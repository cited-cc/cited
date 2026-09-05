import "server-only";

import { getAuthProviderAdapter } from "@/lib/auth/factory";
import type { AuthenticatedPrincipal } from "@/lib/auth/types";

export async function getSessionPrincipal(): Promise<AuthenticatedPrincipal | null> {
  const adapter = getAuthProviderAdapter();
  return adapter.resolveSessionPrincipal();
}
