import type { WorkspaceRole } from "@/types/product";

export type AuthErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "WORKSPACE_NOT_FOUND"
  | "MEMBERSHIP_REQUIRED"
  | "INSUFFICIENT_ROLE";

export class AuthError extends Error {
  readonly code: AuthErrorCode;
  readonly status: number;

  constructor(code: AuthErrorCode, message: string, status: number) {
    super(message);
    this.name = "AuthError";
    this.code = code;
    this.status = status;
  }
}

export type AuthenticatedUser = {
  userId: string;
};

export type WorkspaceMembership = {
  workspaceId: string;
  userId: string;
  /** Legacy provider subject stored in clerk_user_id during migration. */
  clerkUserId: string;
  role: WorkspaceRole;
  workspace: {
    id: string;
    name: string;
    slug: string;
    plan_key: string;
    status: string;
    owner_clerk_user_id: string;
    owner_user_id: string | null;
  };
};

export const ROLE_RANK: Record<WorkspaceRole, number> = {
  viewer: 1,
  member: 2,
  admin: 3,
  owner: 4,
};

export function roleSatisfies(
  actual: WorkspaceRole,
  allowed: readonly WorkspaceRole[],
): boolean {
  return allowed.includes(actual);
}

export function hasMinimumRole(
  actual: WorkspaceRole,
  minimum: WorkspaceRole,
): boolean {
  return ROLE_RANK[actual] >= ROLE_RANK[minimum];
}
