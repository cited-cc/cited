import type { AuthenticatedPrincipal } from "@/lib/auth/types";

export type AuthProviderAdapter = {
  readonly id: "clerk" | "local";
  resolveSessionPrincipal(): Promise<AuthenticatedPrincipal | null>;
};
