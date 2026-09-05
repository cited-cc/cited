import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { recordAuthAuditEvent } from "@/lib/auth/identity";
import { localMembershipSubject } from "@/lib/auth/membership-keys";
import type { AuthenticatedPrincipal } from "@/lib/auth/types";
import { createAdminSupabaseClient } from "@/lib/db/admin";
import type { WorkspaceRole } from "@/types/product";

const INVITATION_TTL_HOURS = 72;

export class InvitationError extends Error {
  readonly code:
    | "INVALID_INVITATION"
    | "INVITATION_EXPIRED"
    | "MEMBERSHIP_EXISTS"
    | "FORBIDDEN";

  constructor(
    code: InvitationError["code"],
    message: string,
  ) {
    super(message);
    this.name = "InvitationError";
    this.code = code;
  }
}

function hashInvitationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateInvitationToken(): string {
  return randomBytes(32).toString("base64url");
}

export async function createWorkspaceInvitation(input: {
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
  invitedByUserId: string;
}): Promise<{ invitationId: string; token: string; expiresAt: string }> {
  const admin = createAdminSupabaseClient();
  const emailNormalized = input.email.trim().toLowerCase();
  const token = generateInvitationToken();
  const tokenHash = hashInvitationToken(token);
  const expiresAt = new Date(
    Date.now() + INVITATION_TTL_HOURS * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await admin
    .from("workspace_invitations")
    .insert({
      workspace_id: input.workspaceId,
      email_normalized: emailNormalized,
      role: input.role,
      token_hash: tokenHash,
      invited_by_user_id: input.invitedByUserId,
      status: "pending",
      expires_at: expiresAt,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to create invitation: ${error.message}`);
  }

  await recordAuthAuditEvent({
    userId: input.invitedByUserId,
    workspaceId: input.workspaceId,
    action: "auth.invitation.created",
  });

  return {
    invitationId: data.id as string,
    token,
    expiresAt,
  };
}

export async function acceptWorkspaceInvitation(input: {
  token: string;
  principal: AuthenticatedPrincipal;
  password?: string;
}): Promise<{ workspaceId: string; role: WorkspaceRole }> {
  const admin = createAdminSupabaseClient();
  const tokenHash = hashInvitationToken(input.token);

  const { data: invitation, error } = await admin
    .from("workspace_invitations")
    .select(
      "id, workspace_id, email_normalized, role, status, expires_at, accepted_by_user_id",
    )
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load invitation: ${error.message}`);
  }

  if (!invitation || invitation.status !== "pending") {
    throw new InvitationError("INVALID_INVITATION", "Invitation is not valid.");
  }

  if (new Date(invitation.expires_at as string).getTime() < Date.now()) {
    await admin
      .from("workspace_invitations")
      .update({ status: "expired" })
      .eq("id", invitation.id as string);
    throw new InvitationError("INVITATION_EXPIRED", "Invitation has expired.");
  }

  if (
    input.principal.email &&
    input.principal.email !== invitation.email_normalized
  ) {
    throw new InvitationError("FORBIDDEN", "Invitation email does not match.");
  }

  const membershipSubject = localMembershipSubject(input.principal.userId);

  const { data: existingMembership } = await admin
    .from("workspace_members")
    .select("id")
    .eq("workspace_id", invitation.workspace_id as string)
    .or(
      `user_id.eq.${input.principal.userId},clerk_user_id.eq.${membershipSubject}`,
    )
    .maybeSingle();

  if (existingMembership) {
    throw new InvitationError(
      "MEMBERSHIP_EXISTS",
      "You are already a member of this workspace.",
    );
  }

  const { error: memberError } = await admin.from("workspace_members").insert({
    workspace_id: invitation.workspace_id as string,
    clerk_user_id: membershipSubject,
    user_id: input.principal.userId,
    role: invitation.role as WorkspaceRole,
  });

  if (memberError) {
    throw new Error(`Failed to create membership: ${memberError.message}`);
  }

  const { error: inviteUpdateError } = await admin
    .from("workspace_invitations")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
      accepted_by_user_id: input.principal.userId,
    })
    .eq("id", invitation.id as string);

  if (inviteUpdateError) {
    throw new Error(`Failed to update invitation: ${inviteUpdateError.message}`);
  }

  await recordAuthAuditEvent({
    userId: input.principal.userId,
    workspaceId: invitation.workspace_id as string,
    action: "auth.invitation.accepted",
  });

  return {
    workspaceId: invitation.workspace_id as string,
    role: invitation.role as WorkspaceRole,
  };
}

export async function assertNotFinalOwnerRemoval(input: {
  workspaceId: string;
  targetUserId: string;
}): Promise<void> {
  const admin = createAdminSupabaseClient();

  const { data: targetMembership, error: targetError } = await admin
    .from("workspace_members")
    .select("role, user_id")
    .eq("workspace_id", input.workspaceId)
    .eq("user_id", input.targetUserId)
    .maybeSingle();

  if (targetError) {
    throw new Error(`Failed to load membership: ${targetError.message}`);
  }

  if (!targetMembership || targetMembership.role !== "owner") {
    return;
  }

  const { count, error: countError } = await admin
    .from("workspace_members")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", input.workspaceId)
    .eq("role", "owner");

  if (countError) {
    throw new Error(`Failed to count owners: ${countError.message}`);
  }

  if ((count ?? 0) <= 1) {
    throw new InvitationError(
      "FORBIDDEN",
      "Cannot remove or disable the final workspace owner.",
    );
  }
}
