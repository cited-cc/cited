import "server-only";

import { selfHostedEntitlementProvider } from "@/lib/entitlements/providers/self-hosted";
import type { EntitlementProvider } from "@/lib/entitlements/provider";
import type { EntitlementSource } from "@/lib/entitlements/types";

export function entitlementSourceForDeployment(): EntitlementSource {
  return "self_hosted";
}

export function getEntitlementProvider(
  source: EntitlementSource,
): EntitlementProvider {
  if (source !== "self_hosted") {
    throw new Error(
      `Entitlement source "${source}" is not available in the community edition.`,
    );
  }
  return selfHostedEntitlementProvider;
}

export function getEntitlementProviderForDeployment(): EntitlementProvider {
  return selfHostedEntitlementProvider;
}

export function assertEntitlementSourceMatchesDeployment(
  source: EntitlementSource,
): void {
  if (source !== "self_hosted") {
    throw new Error(
      `Entitlement source "${source}" does not match community edition deployment.`,
    );
  }
}

export function isSelfHostedEntitlementSource(
  source: EntitlementSource,
): boolean {
  return source === "self_hosted";
}

export function isCloudEntitlementSource(_source: EntitlementSource): boolean {
  return false;
}
