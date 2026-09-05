import type { AiSurfaceKey, MonitoringFrequency } from "@/types/product";

/** Billing-backed Cloud entitlements or self-hosted configuration. */
export type EntitlementSource = "stripe" | "self_hosted";

export type EntitlementFeature =
  | "monitoring"
  | "competitorWatch"
  | "missedOpportunityAlerts"
  | "recurringCitationAlerts"
  | "notebook"
  | "annotations"
  | "exportData"
  | "emailAlerts"
  | "weeklyDigest"
  | "slackAlerts"
  | "teamMembers"
  | "multipleLocations";

export type EntitlementLimitKey =
  | "maxDomains"
  | "maxPrompts"
  | "maxMembers"
  | "maxActiveMonitorConfigurations"
  | "maxMonthlyMonitorChecks"
  | "historyDays"
  | "maxLocations";

/** null means unlimited for this deployment. */
export type EntitlementLimitValue = number | null;

export type EntitlementLimits = Readonly<
  Record<EntitlementLimitKey, EntitlementLimitValue>
>;

export type WorkspaceAccessKind =
  | "active"
  | "read_only"
  | "blocked"
  | "billing_attention"
  | "onboarding_required"
  | "configuration_incomplete";

export type WorkspaceAccessState = Readonly<{
  kind: WorkspaceAccessKind;
  canRunMonitoring: boolean;
  canCreateMutations: boolean;
  canManageBilling: boolean;
  showAccessBanner: boolean;
  bannerMessage: string | null;
}>;

export type EntitlementSnapshot = Readonly<{
  source: EntitlementSource;
  workspaceId: string;
  features: Readonly<Record<EntitlementFeature, boolean>>;
  limits: EntitlementLimits;
  allowedFrequencies: readonly MonitoringFrequency[];
  includedAiSurfaces: readonly AiSurfaceKey[];
  access: WorkspaceAccessState;
  effectiveAt: string;
}>;

export function isUnlimitedLimit(value: EntitlementLimitValue): value is null {
  return value === null;
}

export function isWithinEntitlementLimit(
  usage: number,
  limit: EntitlementLimitValue,
): boolean {
  if (limit === null) {
    return true;
  }
  return usage < limit;
}
