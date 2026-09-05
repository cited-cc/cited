/**
 * Notebook permission helpers.
 */

import type { NotebookVisibility, WorkspaceRole } from "@/types/product";
import { hasMinimumRole } from "@/lib/auth/permissions";

export function canViewNotebookEntry(input: {
  role: WorkspaceRole;
  visibility: NotebookVisibility;
  authorClerkUserId: string;
  currentUserId: string;
}): boolean {
  if (!hasMinimumRole(input.role, "viewer")) return false;
  if (input.visibility === "private") {
    return input.authorClerkUserId === input.currentUserId;
  }
  return true;
}

export function canCreateNotebookEntry(role: WorkspaceRole): boolean {
  return hasMinimumRole(role, "member");
}

export function canEditNotebookEntry(input: {
  role: WorkspaceRole;
  authorClerkUserId: string;
  currentUserId: string;
}): boolean {
  if (!hasMinimumRole(input.role, "member")) return false;
  return input.authorClerkUserId === input.currentUserId;
}

export function canArchiveNotebookEntry(input: {
  role: WorkspaceRole;
  authorClerkUserId: string;
  currentUserId: string;
  visibility: NotebookVisibility;
}): boolean {
  if (!hasMinimumRole(input.role, "member")) return false;
  if (input.authorClerkUserId === input.currentUserId) return true;
  // Owners/admins may archive workspace notes they did not author.
  if (
    input.visibility === "workspace" &&
    hasMinimumRole(input.role, "admin")
  ) {
    return true;
  }
  return false;
}

export function canPinNotebookEntry(input: {
  role: WorkspaceRole;
  authorClerkUserId: string;
  currentUserId: string;
  visibility: NotebookVisibility;
}): boolean {
  if (!hasMinimumRole(input.role, "member")) return false;
  if (input.visibility === "private") {
    return input.authorClerkUserId === input.currentUserId;
  }
  // Workspace pin is shared; author or admin may toggle.
  return (
    input.authorClerkUserId === input.currentUserId ||
    hasMinimumRole(input.role, "admin")
  );
}

export function canChangeNotebookVisibility(input: {
  role: WorkspaceRole;
  authorClerkUserId: string;
  currentUserId: string;
}): boolean {
  if (!hasMinimumRole(input.role, "member")) return false;
  return input.authorClerkUserId === input.currentUserId;
}

export function canRestoreNotebookRevision(input: {
  role: WorkspaceRole;
  authorClerkUserId: string;
  currentUserId: string;
}): boolean {
  return canEditNotebookEntry(input);
}
