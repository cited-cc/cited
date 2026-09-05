import "server-only";

import {
  assertEntitlementSourceMatchesDeployment,
  getEntitlementProviderForDeployment,
} from "@/lib/entitlements/factory";
import type { WorkspaceEntitlementInput } from "@/lib/entitlements/provider";
import type { EntitlementSnapshot } from "@/lib/entitlements/types";

/**
 * Resolve immutable workspace entitlements for the current deployment mode.
 * Never trust client-provided entitlement data.
 */
export function resolveWorkspaceEntitlements(
  input: WorkspaceEntitlementInput,
): EntitlementSnapshot {
  const provider = getEntitlementProviderForDeployment();
  const snapshot = provider.resolve(input);
  assertEntitlementSourceMatchesDeployment(snapshot.source);
  return snapshot;
}

export function canRunMonitoringForWorkspace(
  input: WorkspaceEntitlementInput,
): boolean {
  return resolveWorkspaceEntitlements(input).access.canRunMonitoring;
}
