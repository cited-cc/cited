import type { AuthenticatedPrincipal } from "@/lib/auth/types";

export type MembershipLookupKeys = {
  userId: string;
  /** Legacy membership column. Required until provider-specific fields are removed. */
  clerkUserId: string;
};

/**
 * Derive membership lookup keys from a canonical principal.
 * Local users use a synthetic clerk_user_id prefix for compatibility.
 */
export function membershipLookupKeys(
  principal: AuthenticatedPrincipal,
): MembershipLookupKeys {
  if (principal.provider === "clerk") {
    return {
      userId: principal.userId,
      clerkUserId: principal.providerSubject,
    };
  }

  return {
    userId: principal.userId,
    clerkUserId: localMembershipSubject(principal.userId),
  };
}

export function localMembershipSubject(userId: string): string {
  return `local:${userId}`;
}

export function memberSubjectFromAccess(input: {
  userId: string;
  clerkUserId: string | null;
}): string {
  return input.clerkUserId ?? localMembershipSubject(input.userId);
}

export function memberSubjectForScopedTables(
  principal: AuthenticatedPrincipal,
): string {
  return membershipLookupKeys(principal).clerkUserId;
}

export function isLocalMembershipSubject(subject: string): boolean {
  return subject.startsWith("local:");
}
