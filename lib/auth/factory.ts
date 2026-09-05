import "server-only";

import type { AuthProviderAdapter } from "@/lib/auth/provider";
import { localAuthProvider } from "@/lib/auth/providers/local";

export function getAuthProviderAdapter(): AuthProviderAdapter {
  return localAuthProvider;
}
