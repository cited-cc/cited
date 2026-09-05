export type {
  EntitlementFeature,
  EntitlementLimitKey,
  EntitlementLimitValue,
  EntitlementLimits,
  EntitlementSnapshot,
  EntitlementSource,
  WorkspaceAccessKind,
  WorkspaceAccessState,
} from "@/lib/entitlements/types";
export {
  isUnlimitedLimit,
  isWithinEntitlementLimit,
} from "@/lib/entitlements/types";

export type { EntitlementProvider, WorkspaceEntitlementInput } from "@/lib/entitlements/provider";

export {
  entitlementSourceForDeployment,
  getEntitlementProvider,
  getEntitlementProviderForDeployment,
  assertEntitlementSourceMatchesDeployment,
  isCloudEntitlementSource,
  isSelfHostedEntitlementSource,
} from "@/lib/entitlements/factory";

export {
  resolveWorkspaceEntitlements,
  canRunMonitoringForWorkspace,
} from "@/lib/entitlements/resolve";

export {
  getSelfHostedSafetyLimits,
  formatSelfHostedLimitLabel,
  SELF_HOSTED_LIMIT_ENV_KEYS,
  SELF_HOSTED_UNLIMITED_SENTINEL,
} from "@/lib/entitlements/self-hosted-config";

export { selfHostedEntitlementProvider } from "@/lib/entitlements/providers/self-hosted";

export {
  canAddDomain,
  canVerifyDomain,
  canAddPrompt,
  canActivateMonitorConfiguration,
  canSelectAiSurface,
  canUseMonitoringCadence,
  canUseLocation,
  canInviteMember,
  canUseSlackAlerts,
  canUseCompetitorWatch,
  canUseMissedOpportunityAlerts,
  canUseRecurringCitationAlerts,
  canAccessHistoryDate,
  canCreateNotebookEntry,
  canCreateAnnotation,
  canExportData,
  canRunMonitoring,
  /** @deprecated Use canRunMonitoring. Cloud billing wrapper for migration only. */
  canRunPaidMonitoring,
  recommendPlanForFeature,
  listAvailablePlanChanges,
  type EntitlementContext,
  type EntitlementDenialReason,
  type EntitlementResult,
} from "@/lib/entitlements/checks";

export {
  enforceActiveMonitorLimits,
  calculateDowngradeImpact,
} from "@/lib/entitlements/enforce";

export {
  usagePercentBucket,
  usageWarningLevel,
} from "@/lib/entitlements/usage";
