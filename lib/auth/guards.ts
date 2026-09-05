import "server-only";

import { AuthError } from "@/lib/auth/errors";
import { getSessionPrincipal } from "@/lib/auth/session";
import type { AuthenticatedPrincipal } from "@/lib/auth/types";

export async function requireAuthenticatedPrincipal(): Promise<AuthenticatedPrincipal> {
  const principal = await getSessionPrincipal();
  if (!principal) {
    throw new AuthError("UNAUTHENTICATED", "Authentication required.", 401);
  }
  return principal;
}

export async function requireAuthenticatedUserId(): Promise<string> {
  const principal = await requireAuthenticatedPrincipal();
  return principal.userId;
}
