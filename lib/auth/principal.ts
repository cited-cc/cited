import type {
  AuthenticatedPrincipal,
  AuthProvider,
  UserRecord,
} from "@/lib/auth/types";

export function toAuthenticatedPrincipal(input: {
  user: UserRecord;
  provider: AuthProvider;
  providerSubject: string;
}): AuthenticatedPrincipal {
  return {
    userId: input.user.id,
    provider: input.provider,
    providerSubject: input.providerSubject,
    email: input.user.emailNormalized,
    displayName: input.user.displayName,
  };
}
