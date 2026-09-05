import {
  AuthError,
  type AuthenticatedUser,
  type WorkspaceMembership,
  roleSatisfies,
} from "@/lib/auth/errors";
import { requireAuthenticatedPrincipal } from "@/lib/auth/guards";
import { membershipLookupKeys } from "@/lib/auth/membership-keys";
import { getSessionPrincipal } from "@/lib/auth/session";
import { createAdminSupabaseClient, requireWorkspaceScope } from "@/lib/db/admin";
import type { WorkspaceRole } from "@/types/product";

async function findMembershipForPrincipal(
  workspaceId: string,
  keys: ReturnType<typeof membershipLookupKeys>,
): Promise<{
  workspace_id: string;
  clerk_user_id: string;
  user_id: string | null;
  role: WorkspaceRole;
} | null> {
  const admin = createAdminSupabaseClient();
  const scopedWorkspaceId = requireWorkspaceScope(workspaceId);

  const { data: byUserId, error: byUserIdError } = await admin
    .from("workspace_members")
    .select("workspace_id, clerk_user_id, user_id, role")
    .eq("workspace_id", scopedWorkspaceId)
    .eq("user_id", keys.userId)
    .maybeSingle();

  if (byUserIdError) {
    throw new Error(
      `Failed to load workspace membership: ${byUserIdError.message}`,
    );
  }

  if (byUserId) {
    return byUserId as {
      workspace_id: string;
      clerk_user_id: string;
      user_id: string | null;
      role: WorkspaceRole;
    };
  }

  const { data: byClerk, error: byClerkError } = await admin
    .from("workspace_members")
    .select("workspace_id, clerk_user_id, user_id, role")
    .eq("workspace_id", scopedWorkspaceId)
    .eq("clerk_user_id", keys.clerkUserId)
    .maybeSingle();

  if (byClerkError) {
    throw new Error(
      `Failed to load workspace membership: ${byClerkError.message}`,
    );
  }

  return (byClerk as {
    workspace_id: string;
    clerk_user_id: string;
    user_id: string | null;
    role: WorkspaceRole;
  } | null) ?? null;
}

async function findLatestMembershipForPrincipal(
  keys: ReturnType<typeof membershipLookupKeys>,
): Promise<{
  workspace_id: string;
  clerk_user_id: string;
  user_id: string | null;
  role: WorkspaceRole;
} | null> {
  const admin = createAdminSupabaseClient();

  const { data: byUserId, error: byUserIdError } = await admin
    .from("workspace_members")
    .select("workspace_id, clerk_user_id, user_id, role")
    .eq("user_id", keys.userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (byUserIdError) {
    throw new Error(`Failed to resolve current workspace: ${byUserIdError.message}`);
  }

  if (byUserId) {
    return byUserId as {
      workspace_id: string;
      clerk_user_id: string;
      user_id: string | null;
      role: WorkspaceRole;
    };
  }

  const { data: byClerk, error: byClerkError } = await admin
    .from("workspace_members")
    .select("workspace_id, clerk_user_id, user_id, role")
    .eq("clerk_user_id", keys.clerkUserId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (byClerkError) {
    throw new Error(`Failed to resolve current workspace: ${byClerkError.message}`);
  }

  return (byClerk as {
    workspace_id: string;
    clerk_user_id: string;
    user_id: string | null;
    role: WorkspaceRole;
  } | null) ?? null;
}

export async function requireAuthenticatedUser(): Promise<AuthenticatedUser> {
  const principal = await requireAuthenticatedPrincipal();
  return { userId: principal.userId };
}

export async function requireWorkspaceMembership(
  workspaceId: string,
): Promise<WorkspaceMembership> {
  const principal = await requireAuthenticatedPrincipal();
  const keys = membershipLookupKeys(principal);
  const membership = await findMembershipForPrincipal(workspaceId, keys);

  if (!membership) {
    throw new AuthError(
      "MEMBERSHIP_REQUIRED",
      "You are not a member of this workspace.",
      403,
    );
  }

  const admin = createAdminSupabaseClient();
  const scopedWorkspaceId = requireWorkspaceScope(workspaceId);

  const { data: workspace, error: workspaceError } = await admin
    .from("workspaces")
    .select(
      "id, name, slug, plan_key, status, owner_clerk_user_id, owner_user_id",
    )
    .eq("id", scopedWorkspaceId)
    .maybeSingle();

  if (workspaceError) {
    throw new Error(`Failed to load workspace: ${workspaceError.message}`);
  }

  if (!workspace) {
    throw new AuthError("WORKSPACE_NOT_FOUND", "Workspace not found.", 404);
  }

  return {
    workspaceId: membership.workspace_id,
    userId: membership.user_id ?? keys.userId,
    clerkUserId: membership.clerk_user_id,
    role: membership.role,
    workspace: {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      plan_key: workspace.plan_key,
      status: workspace.status,
      owner_clerk_user_id: workspace.owner_clerk_user_id,
      owner_user_id: workspace.owner_user_id,
    },
  };
}

export async function requireWorkspaceRole(
  workspaceId: string,
  allowedRoles: readonly WorkspaceRole[],
): Promise<WorkspaceMembership> {
  const membership = await requireWorkspaceMembership(workspaceId);

  if (!roleSatisfies(membership.role, allowedRoles)) {
    throw new AuthError(
      "INSUFFICIENT_ROLE",
      "You do not have permission to perform this action.",
      403,
    );
  }

  return membership;
}

/**
 * Resolves the current user's preferred workspace.
 * Prefers the most recently updated membership; returns null if none exist.
 */
export async function getCurrentWorkspace(): Promise<WorkspaceMembership | null> {
  const principal = await getSessionPrincipal();
  if (!principal) {
    return null;
  }

  const keys = membershipLookupKeys(principal);
  const membership = await findLatestMembershipForPrincipal(keys);

  if (!membership) {
    return null;
  }

  const admin = createAdminSupabaseClient();
  const { data: workspace, error: workspaceError } = await admin
    .from("workspaces")
    .select(
      "id, name, slug, plan_key, status, owner_clerk_user_id, owner_user_id",
    )
    .eq("id", membership.workspace_id)
    .maybeSingle();

  if (workspaceError) {
    throw new Error(`Failed to load workspace: ${workspaceError.message}`);
  }

  if (!workspace) {
    return null;
  }

  return {
    workspaceId: membership.workspace_id,
    userId: membership.user_id ?? keys.userId,
    clerkUserId: membership.clerk_user_id,
    role: membership.role,
    workspace: {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      plan_key: workspace.plan_key,
      status: workspace.status,
      owner_clerk_user_id: workspace.owner_clerk_user_id,
      owner_user_id: workspace.owner_user_id,
    },
  };
}

export {
  AuthError,
  hasMinimumRole,
  roleSatisfies,
  ROLE_RANK,
} from "@/lib/auth/errors";
export type {
  AuthenticatedUser,
  AuthErrorCode,
  WorkspaceMembership,
} from "@/lib/auth/errors";

export { getSessionPrincipal } from "@/lib/auth/session";
export { requireAuthenticatedPrincipal } from "@/lib/auth/guards";
export type { AuthenticatedPrincipal } from "@/lib/auth/types";
