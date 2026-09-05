/**
 * Require an explicit workspace_id on every workspace-scoped query builder call.
 * Throws if missing so callers cannot accidentally query across tenants.
 */
export function requireWorkspaceScope(workspaceId: string): string {
  if (!workspaceId || typeof workspaceId !== "string") {
    throw new Error("workspace_id is required for workspace-scoped queries.");
  }
  return workspaceId;
}
