import "server-only";

import { getSelectableAiSurfacesForPlan } from "@/lib/monitoring/surfaces";
import type { AiSurfaceKey, MonitoringFrequency } from "@/types/product";

import type {
  EntitlementProvider,
  WorkspaceEntitlementInput,
} from "@/lib/entitlements/provider";
import { getSelfHostedSafetyLimits } from "@/lib/entitlements/self-hosted-config";
import type {
  EntitlementFeature,
  EntitlementLimits,
  EntitlementSnapshot,
  WorkspaceAccessState,
} from "@/lib/entitlements/types";

const SELF_HOSTED_ALLOWED_FREQUENCIES: readonly MonitoringFrequency[] =
  Object.freeze(["manual", "twice_weekly", "weekly", "daily"]);

function buildSelfHostedFeatures(): Record<EntitlementFeature, boolean> {
  return Object.freeze({
    monitoring: true,
    competitorWatch: true,
    missedOpportunityAlerts: true,
    recurringCitationAlerts: true,
    notebook: true,
    annotations: true,
    exportData: true,
    emailAlerts: true,
    weeklyDigest: true,
    // Slack alerts via incoming webhooks (Phase 10).
    slackAlerts: true,
    teamMembers: true,
    multipleLocations: true,
  });
}

function buildSelfHostedLimits(): EntitlementLimits {
  const safety = getSelfHostedSafetyLimits();

  return Object.freeze({
    maxDomains: safety.maxDomains,
    maxPrompts: safety.maxPrompts,
    maxMembers: safety.maxUsers,
    maxActiveMonitorConfigurations: safety.maxMonitors,
    maxMonthlyMonitorChecks: null,
    historyDays: safety.historyDays,
    maxLocations: null,
  });
}

function resolveSelfHostedSurfaces(): AiSurfaceKey[] {
  return getSelectableAiSurfacesForPlan("pro");
}

function buildSelfHostedAccess(
  input: WorkspaceEntitlementInput,
): WorkspaceAccessState {
  if (input.status === "suspended") {
    return Object.freeze({
      kind: "blocked",
      canRunMonitoring: false,
      canCreateMutations: false,
      canManageBilling: false,
      showAccessBanner: true,
      bannerMessage:
        "This workspace is disabled by the administrator.",
    });
  }

  return Object.freeze({
    kind: "active",
    canRunMonitoring: true,
    canCreateMutations: true,
    canManageBilling: false,
    showAccessBanner: false,
    bannerMessage: null,
  });
}

export const selfHostedEntitlementProvider: EntitlementProvider = Object.freeze({
  source: "self_hosted",
  resolve(input: WorkspaceEntitlementInput): EntitlementSnapshot {
    return Object.freeze({
      source: "self_hosted",
      workspaceId: input.workspaceId,
      features: buildSelfHostedFeatures(),
      limits: buildSelfHostedLimits(),
      allowedFrequencies: SELF_HOSTED_ALLOWED_FREQUENCIES,
      includedAiSurfaces: resolveSelfHostedSurfaces(),
      access: buildSelfHostedAccess(input),
      effectiveAt: (input.now ?? new Date()).toISOString(),
    });
  },
});
