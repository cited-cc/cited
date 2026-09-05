import type { WorkspaceRole } from "@/types/product";
import { hasMinimumRole } from "@/lib/auth/errors";

/** Viewers are view-only; export requires member+. */
export function canExportEvidence(role: WorkspaceRole): boolean {
  return hasMinimumRole(role, "member");
}

/** Full workspace evidence archive requires admin+. */
export function canExportWorkspaceArchive(role: WorkspaceRole): boolean {
  return hasMinimumRole(role, "admin");
}
