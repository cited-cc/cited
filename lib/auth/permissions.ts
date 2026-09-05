/**
 * Pure authorization helpers extracted for unit testing without Clerk/Supabase.
 */
import type { WorkspaceRole } from "@/types/product";
import { ROLE_RANK, roleSatisfies, hasMinimumRole } from "@/lib/auth/errors";

export function assertRoleAllowed(
  actual: WorkspaceRole,
  allowed: readonly WorkspaceRole[],
): { ok: true } | { ok: false; reason: "INSUFFICIENT_ROLE" } {
  if (!roleSatisfies(actual, allowed)) {
    return { ok: false, reason: "INSUFFICIENT_ROLE" };
  }
  return { ok: true };
}

export function canManageBilling(role: WorkspaceRole): boolean {
  return hasMinimumRole(role, "admin");
}

export function canEditMonitors(role: WorkspaceRole): boolean {
  return hasMinimumRole(role, "member");
}

export function canViewInbox(role: WorkspaceRole): boolean {
  return hasMinimumRole(role, "viewer");
}

/** Personal seen / open acknowledgment. All roles including viewer. */
export function canTriageInboxEvents(role: WorkspaceRole): boolean {
  return hasMinimumRole(role, "viewer");
}

/** Save / unsave personal notes. All roles including viewer. */
export function canSaveInboxEvents(role: WorkspaceRole): boolean {
  return hasMinimumRole(role, "viewer");
}

/** Archive / restore. Members and above (not viewer-only). */
export function canArchiveInboxEvents(role: WorkspaceRole): boolean {
  return hasMinimumRole(role, "member");
}

/** Resolve / reopen. Members and above (not viewer-only). */
export function canResolveInboxEvents(role: WorkspaceRole): boolean {
  return hasMinimumRole(role, "member");
}

/** View notebook entries (workspace notes + own private notes). */
export function canViewNotebook(role: WorkspaceRole): boolean {
  return hasMinimumRole(role, "viewer");
}

/** Create notebook entries and annotations. Members and above. */
export function canCreateNotebookEntries(role: WorkspaceRole): boolean {
  return hasMinimumRole(role, "member");
}

/** Create annotations. Members and above. */
export function canCreateAnnotations(role: WorkspaceRole): boolean {
  return hasMinimumRole(role, "member");
}

/** Resolve/reopen workspace annotations. Owners and admins. */
export function canModerateWorkspaceAnnotations(role: WorkspaceRole): boolean {
  return hasMinimumRole(role, "admin");
}

/** Workspace-wide notification settings, Slack, and test sends. */
export function canManageWorkspaceNotifications(role: WorkspaceRole): boolean {
  return hasMinimumRole(role, "admin");
}

/** Personal notification preferences for the signed-in member. */
export function canManagePersonalNotifications(role: WorkspaceRole): boolean {
  return hasMinimumRole(role, "viewer");
}

/** Export citation evidence. Viewers are view-only by default. */
export function canExportEvidence(role: WorkspaceRole): boolean {
  return hasMinimumRole(role, "member");
}

/** Full workspace evidence archive. */
export function canExportWorkspaceArchive(role: WorkspaceRole): boolean {
  return hasMinimumRole(role, "admin");
}

/** Workspace name and domain administration. */
export function canManageWorkspaceSettings(role: WorkspaceRole): boolean {
  return hasMinimumRole(role, "admin");
}

export { ROLE_RANK, roleSatisfies, hasMinimumRole };
