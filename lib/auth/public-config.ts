import { getPublicDeploymentMode } from "@/lib/deployment/public-config";
import type { AuthProvider } from "@/lib/auth/types";

/** Community edition uses local authentication exclusively. */
export function getPublicAuthProvider(): AuthProvider {
  return "local";
}

export function isPublicLocalAuthProvider(): boolean {
  return true;
}

export function isPublicClerkAuthProvider(): boolean {
  return false;
}

export function getPublicDeploymentModeForAuth(): ReturnType<
  typeof getPublicDeploymentMode
> {
  return getPublicDeploymentMode();
}
