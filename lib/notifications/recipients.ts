import { createAdminSupabaseClient } from "@/lib/db/admin";
import {
  canReceiveDigestEmail,
  canReceiveInstantEmail,
  canReceiveMonitorIssueEmail,
  ensureUserNotificationPreferences,
  getWorkspaceNotificationPreferences,
  type UserNotificationPreferences,
  type WorkspaceNotificationPreferences,
} from "@/lib/notifications/preferences";
import {
  type NotificationRecipientType,
  type NotificationType,
} from "@/lib/notifications/types";
import { hashEmail } from "@/lib/security/encryption";
import type { WorkspaceRole } from "@/types/product";

export type EmailRecipient = {
  clerkUserId: string;
  email: string;
  emailHash: string;
  role: WorkspaceRole;
  recipientType: NotificationRecipientType;
};

export type ResolvedRecipients = {
  emailRecipients: EmailRecipient[];
  workspacePrefs: WorkspaceNotificationPreferences;
};

function recipientTypeForRole(role: WorkspaceRole): NotificationRecipientType {
  switch (role) {
    case "owner":
      return "workspace_owner";
    case "admin":
      return "workspace_admin";
    case "member":
    case "viewer":
      return "workspace_member";
    default: {
      const _exhaustive: never = role;
      return _exhaustive;
    }
  }
}

function isInstantType(type: NotificationType): boolean {
  return (
    type === "new_citation" ||
    type === "new_mention" ||
    type === "new_recommendation" ||
    type === "new_competitor_citation" ||
    type === "new_missed_opportunity" ||
    type === "renewed_citation"
  );
}

function isMonitorType(type: NotificationType): boolean {
  return (
    type === "monitor_blocked" ||
    type === "monitor_recovered" ||
    type === "monitor_repeated_failure" ||
    type === "usage_safety_limit_reached" ||
    type === "domain_verification_required"
  );
}

function roleEligibleForInstant(role: WorkspaceRole): boolean {
  return role === "owner" || role === "admin";
}

function roleEligibleForMonitor(role: WorkspaceRole): boolean {
  return role === "owner" || role === "admin";
}

function roleEligibleForDigest(role: WorkspaceRole): boolean {
  return (
    role === "owner" ||
    role === "admin" ||
    role === "member" ||
    role === "viewer"
  );
}

async function resolveMemberEmail(
  userId: string | null,
  legacySubject: string,
): Promise<string | null> {
  const admin = createAdminSupabaseClient();
  const lookupId = userId ?? legacySubject;

  const { data, error } = await admin
    .from("users")
    .select("email_normalized, status")
    .eq("id", lookupId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  if (data.status === "disabled") {
    return null;
  }

  return data.email_normalized;
}

function userAllowsType(
  type: NotificationType,
  workspace: WorkspaceNotificationPreferences,
  user: UserNotificationPreferences,
): boolean {
  if (isInstantType(type)) {
    return canReceiveInstantEmail(workspace, user);
  }
  if (isMonitorType(type)) {
    return canReceiveMonitorIssueEmail(workspace, user);
  }
  if (type === "weekly_digest") {
    return canReceiveDigestEmail(workspace, user);
  }
  return false;
}

function roleAllowsType(type: NotificationType, role: WorkspaceRole): boolean {
  if (isInstantType(type)) return roleEligibleForInstant(role);
  if (isMonitorType(type)) return roleEligibleForMonitor(role);
  if (type === "weekly_digest") return roleEligibleForDigest(role);
  return false;
}

export async function resolveNotificationRecipients(input: {
  workspaceId: string;
  notificationType: NotificationType;
}): Promise<ResolvedRecipients> {
  const admin = createAdminSupabaseClient();
  const workspacePrefs = await getWorkspaceNotificationPreferences(
    input.workspaceId,
  );

  const { data: members } = await admin
    .from("workspace_members")
    .select("clerk_user_id, user_id, role")
    .eq("workspace_id", input.workspaceId);

  const emailRecipients: EmailRecipient[] = [];
  const seenEmails = new Set<string>();

  for (const member of members ?? []) {
    const role = member.role as WorkspaceRole;
    const clerkUserId = member.clerk_user_id as string;
    const userId = (member.user_id as string | null) ?? null;

    if (!roleAllowsType(input.notificationType, role)) continue;

    const userPrefs = await ensureUserNotificationPreferences({
      workspaceId: input.workspaceId,
      clerkUserId,
      role,
    });

    if (!userAllowsType(input.notificationType, workspacePrefs, userPrefs)) {
      continue;
    }

    const email = await resolveMemberEmail(userId, clerkUserId);
    if (!email) continue;

    const normalized = email.trim().toLowerCase();
    if (seenEmails.has(normalized)) continue;
    seenEmails.add(normalized);

    emailRecipients.push({
      clerkUserId,
      email,
      emailHash: hashEmail(email),
      role,
      recipientType: recipientTypeForRole(role),
    });
  }

  return {
    emailRecipients,
    workspacePrefs,
  };
}

export {
  roleEligibleForInstant,
  roleEligibleForMonitor,
  roleEligibleForDigest,
  recipientTypeForRole,
};
