export type AuthProvider = "clerk" | "local";

export type UserStatus = "active" | "disabled";

export type AuthenticatedPrincipal = {
  /** Canonical Cited user ID (UUID). */
  userId: string;
  provider: AuthProvider;
  /** Provider-specific subject (Clerk user ID or local user UUID string). */
  providerSubject: string;
  email: string | null;
  displayName: string | null;
};

export type AuthIdentityRecord = {
  id: string;
  userId: string;
  provider: AuthProvider;
  providerSubject: string;
};

export type UserRecord = {
  id: string;
  emailNormalized: string | null;
  displayName: string | null;
  status: UserStatus;
};

export type InvitationStatus = "pending" | "accepted" | "revoked" | "expired";

export type WorkspaceInvitationRecord = {
  id: string;
  workspaceId: string;
  emailNormalized: string;
  role: string;
  status: InvitationStatus;
  expiresAt: string;
};
