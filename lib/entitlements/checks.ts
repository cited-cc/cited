import "server-only";

import type { AiSurfaceKey, MonitoringFrequency, PlanKey } from "@/types/product";

import {
  getDowngradeTargets,
  getUpgradeTargets,
  isPublicPaidPlanKey,
} from "@/lib/entitlements/plan-catalog";
import type { BillingStatus } from "@/lib/entitlements/access-types";
import { resolveWorkspaceEntitlements } from "@/lib/entitlements/resolve";
import type { EntitlementLimitKey } from "@/lib/entitlements/types";
import {
  isUnlimitedLimit,
  isWithinEntitlementLimit,
} from "@/lib/entitlements/types";
import type { WorkspaceStatus } from "@/types/product";

export type EntitlementDenialReason =
  | "billing_inactive"
  | "plan_limit_reached"
  | "feature_not_in_plan"
  | "usage_safety_limit_reached"
  | "workspace_suspended"
  | "requires_upgrade"
  | "unknown_billing_state"
  | "operational_limit_reached"
  | "configuration_incomplete";

export type EntitlementResult =
  | { allowed: true }
  | {
      allowed: false;
      reason: EntitlementDenialReason;
      currentPlan: PlanKey;
      requiredPlan?: PlanKey;
      limitKey?: string;
      currentUsage?: number;
      limit?: number;
      safeMessage: string;
    };

export type EntitlementContext = {
  workspaceId: string;
  planKey: PlanKey;
  status: WorkspaceStatus;
  billingStatus?: BillingStatus | null;
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: string | null;
  billingGraceUntil?: string | null;
  portfolioExtraDomains?: number | null;
  now?: Date;
};

function snapshotForContext(ctx: EntitlementContext) {
  return resolveWorkspaceEntitlements({
    workspaceId: ctx.workspaceId,
    planKey: ctx.planKey,
    status: ctx.status,
    billingStatus: ctx.billingStatus,
    cancelAtPeriodEnd: ctx.cancelAtPeriodEnd,
    currentPeriodEnd: ctx.currentPeriodEnd,
    billingGraceUntil: ctx.billingGraceUntil,
    portfolioExtraDomains: ctx.portfolioExtraDomains,
    now: ctx.now,
  });
}

function deny(
  ctx: EntitlementContext,
  input: {
    reason: EntitlementDenialReason;
    safeMessage: string;
    requiredPlan?: PlanKey;
    limitKey?: string;
    currentUsage?: number;
    limit?: number;
  },
): EntitlementResult {
  return {
    allowed: false,
    reason: input.reason,
    currentPlan: ctx.planKey,
    requiredPlan: input.requiredPlan,
    limitKey: input.limitKey,
    currentUsage: input.currentUsage,
    limit: input.limit,
    safeMessage: input.safeMessage,
  };
}

function accessGate(ctx: EntitlementContext): EntitlementResult | null {
  const snapshot = snapshotForContext(ctx);
  const { access } = snapshot;

  if (access.kind === "configuration_incomplete") {
    return deny(ctx, {
      reason: "configuration_incomplete",
      safeMessage:
        access.bannerMessage ??
        "Self-hosted configuration is incomplete. Contact your administrator.",
    });
  }

  if (access.kind === "blocked") {
    return deny(ctx, {
      reason: "workspace_suspended",
      safeMessage:
        access.bannerMessage ?? "This workspace is not available.",
    });
  }

  return null;
}

function suggestUpgradeForLimit(currentPlan: PlanKey): PlanKey | undefined {
  const upgrades = getUpgradeTargets(currentPlan);
  return upgrades[0];
}

function operationalLimitMessage(limitKey: EntitlementLimitKey): string {
  const envMap: Record<EntitlementLimitKey, string | null> = {
    maxDomains: "CITED_SELF_HOSTED_MAX_DOMAINS",
    maxPrompts: "CITED_SELF_HOSTED_MAX_PROMPTS",
    maxMembers: "CITED_SELF_HOSTED_MAX_USERS",
    maxActiveMonitorConfigurations: "CITED_SELF_HOSTED_MAX_MONITORS",
    maxMonthlyMonitorChecks: null,
    historyDays: "CITED_SELF_HOSTED_HISTORY_DAYS",
    maxLocations: null,
  };
  const envKey = envMap[limitKey];
  if (envKey) {
    return `This instance limit (${envKey}) has been reached. Ask your administrator to adjust the configuration.`;
  }
  return "This instance limit has been reached. Ask your administrator to adjust the configuration.";
}

function planLimitMessage(limitKey: EntitlementLimitKey): string {
  return operationalLimitMessage(limitKey);
}
export function canAddDomain(
  ctx: EntitlementContext,
  currentDomainCount: number,
): EntitlementResult {
  const gated = accessGate(ctx);
  if (gated) return gated;

  const limits = snapshotForContext(ctx).limits;
  if (!isWithinEntitlementLimit(currentDomainCount, limits.maxDomains)) {
    const requiredPlan =
      ctx.planKey === "portfolio"
        ? undefined
        : suggestUpgradeForLimit(ctx.planKey);
    return deny(ctx, {
      reason:
        "operational_limit_reached",
      limitKey: "maxDomains",
      currentUsage: currentDomainCount,
      limit: limits.maxDomains ?? undefined,
      requiredPlan,
      safeMessage: planLimitMessage("maxDomains"),
    });
  }
  return { allowed: true };
}

export function canVerifyDomain(ctx: EntitlementContext): EntitlementResult {
  const gated = accessGate(ctx);
  if (gated) return gated;
  return { allowed: true };
}

export function canAddPrompt(
  ctx: EntitlementContext,
  currentPromptCount: number,
): EntitlementResult {
  const gated = accessGate(ctx);
  if (gated) return gated;

  const limits = snapshotForContext(ctx).limits;
  if (!isWithinEntitlementLimit(currentPromptCount, limits.maxPrompts)) {
    const required = suggestUpgradeForLimit(ctx.planKey);
    return deny(ctx, {
      reason:
        "operational_limit_reached",
      limitKey: "maxPrompts",
      currentUsage: currentPromptCount,
      limit: limits.maxPrompts ?? undefined,
      requiredPlan: required,
      safeMessage: planLimitMessage("maxPrompts"),
    });
  }
  return { allowed: true };
}

export function canActivateMonitorConfiguration(
  ctx: EntitlementContext,
  currentActiveCount: number,
): EntitlementResult {
  const gated = accessGate(ctx);
  if (gated) return gated;

  const snapshot = snapshotForContext(ctx);
  if (!snapshot.access.canRunMonitoring) {
    return deny(ctx, {
      reason: "billing_inactive",
      safeMessage:
        snapshot.access.bannerMessage ??
        ("Monitoring is not available for this workspace."),
    });
  }

  const limits = snapshot.limits;
  if (
    !isWithinEntitlementLimit(
      currentActiveCount,
      limits.maxActiveMonitorConfigurations,
    )
  ) {
    return deny(ctx, {
      reason:
        "operational_limit_reached",
      limitKey: "maxActiveMonitorConfigurations",
      currentUsage: currentActiveCount,
      limit: limits.maxActiveMonitorConfigurations ?? undefined,
      requiredPlan: suggestUpgradeForLimit(ctx.planKey),
      safeMessage: planLimitMessage("maxActiveMonitorConfigurations"),
    });
  }
  return { allowed: true };
}

export function canSelectAiSurface(
  ctx: EntitlementContext,
  surface: AiSurfaceKey,
): EntitlementResult {
  const gated = accessGate(ctx);
  if (gated) return gated;

  const snapshot = snapshotForContext(ctx);
  if (!snapshot.includedAiSurfaces.includes(surface)) {
    return deny(ctx, {
      reason: "feature_not_in_plan",
      limitKey: "includedAiSurfaces",
      requiredPlan: suggestUpgradeForLimit(ctx.planKey),
      safeMessage:
        "This AI surface is not enabled for this self-hosted instance.",
    });
  }
  return { allowed: true };
}

export function canUseMonitoringCadence(
  ctx: EntitlementContext,
  cadence: MonitoringFrequency,
): EntitlementResult {
  const gated = accessGate(ctx);
  if (gated) return gated;

  const snapshot = snapshotForContext(ctx);
  if (!snapshot.allowedFrequencies.includes(cadence)) {
    return deny(ctx, {
      reason: "feature_not_in_plan",
      limitKey: "monitoringCadence",
      requiredPlan: cadence === "daily" ? "pro" : suggestUpgradeForLimit(ctx.planKey),
      safeMessage:
        "This monitoring cadence is not enabled for this self-hosted instance.",
    });
  }
  return { allowed: true };
}

export function canUseLocation(
  ctx: EntitlementContext,
  locationCount: number,
): EntitlementResult {
  const gated = accessGate(ctx);
  if (gated) return gated;

  const snapshot = snapshotForContext(ctx);
  if (locationCount > 1 && !snapshot.features.multipleLocations) {
    return deny(ctx, {
      reason: "feature_not_in_plan",
      limitKey: "supportsMultipleLocations",
      requiredPlan: "pro",
      safeMessage:
        "Multiple locations are not enabled for this self-hosted instance.",
    });
  }

  const maxLocations = snapshot.limits.maxLocations;
  if (
    maxLocations !== null &&
    locationCount > maxLocations
  ) {
    return deny(ctx, {
      reason:
        "operational_limit_reached",
      limitKey: "maxLocations",
      currentUsage: locationCount,
      limit: maxLocations,
      requiredPlan: "pro",
      safeMessage: planLimitMessage("maxLocations"),
    });
  }
  return { allowed: true };
}

export function canInviteMember(
  ctx: EntitlementContext,
  currentMemberCount: number,
): EntitlementResult {
  const gated = accessGate(ctx);
  if (gated) return gated;

  const limits = snapshotForContext(ctx).limits;
  if (!isWithinEntitlementLimit(currentMemberCount, limits.maxMembers)) {
    return deny(ctx, {
      reason:
        "operational_limit_reached",
      limitKey: "maxMembers",
      currentUsage: currentMemberCount,
      limit: limits.maxMembers ?? undefined,
      requiredPlan: suggestUpgradeForLimit(ctx.planKey),
      safeMessage: planLimitMessage("maxMembers"),
    });
  }
  return { allowed: true };
}

export function canUseSlackAlerts(ctx: EntitlementContext): EntitlementResult {
  const snapshot = snapshotForContext(ctx);
  if (!snapshot.features.slackAlerts) {
    return deny(ctx, {
      reason: "feature_not_in_plan",
      requiredPlan: "growth",
      limitKey: "slackAlerts",
      safeMessage: "Slack alerts are not available on Cited.",
    });
  }
  const gated = accessGate(ctx);
  if (gated) return gated;
  return { allowed: true };
}

export function canUseCompetitorWatch(
  ctx: EntitlementContext,
): EntitlementResult {
  const snapshot = snapshotForContext(ctx);
  if (!snapshot.features.competitorWatch) {
    return deny(ctx, {
      reason: "feature_not_in_plan",
      requiredPlan: "growth",
      limitKey: "competitorWatch",
      safeMessage:
        "Competitor watch is not enabled for this self-hosted instance.",
    });
  }
  const gated = accessGate(ctx);
  if (gated) return gated;
  return { allowed: true };
}

export function canUseMissedOpportunityAlerts(
  ctx: EntitlementContext,
): EntitlementResult {
  const snapshot = snapshotForContext(ctx);
  if (!snapshot.features.missedOpportunityAlerts) {
    return deny(ctx, {
      reason: "feature_not_in_plan",
      requiredPlan: "growth",
      limitKey: "missedOpportunityAlerts",
      safeMessage:
        "Missed-opportunity alerts are not enabled for this self-hosted instance.",
    });
  }
  const gated = accessGate(ctx);
  if (gated) return gated;
  return { allowed: true };
}

export function canUseRecurringCitationAlerts(
  ctx: EntitlementContext,
): EntitlementResult {
  const snapshot = snapshotForContext(ctx);
  if (!snapshot.features.recurringCitationAlerts) {
    return deny(ctx, {
      reason: "feature_not_in_plan",
      requiredPlan: "pro",
      limitKey: "recurringCitationAlerts",
      safeMessage:
        "Recurring citation alerts are not enabled for this self-hosted instance.",
    });
  }
  const gated = accessGate(ctx);
  if (gated) return gated;
  return { allowed: true };
}

export function canAccessHistoryDate(
  ctx: EntitlementContext,
  eventDate: Date | string,
): EntitlementResult {
  const limits = snapshotForContext(ctx).limits;
  if (isUnlimitedLimit(limits.historyDays)) {
    return { allowed: true };
  }

  const date =
    typeof eventDate === "string" ? new Date(eventDate) : eventDate;
  if (!Number.isFinite(date.getTime())) {
    return deny(ctx, {
      reason: "requires_upgrade",
      safeMessage: "This citation note could not be dated for history access.",
    });
  }

  const now = ctx.now ?? new Date();
  const ageMs = now.getTime() - date.getTime();
  const windowMs = limits.historyDays * 24 * 60 * 60 * 1000;
  if (ageMs > windowMs) {
    const required = suggestUpgradeForLimit(ctx.planKey);
    return deny(ctx, {
      reason:
        "operational_limit_reached",
      limitKey: "historyDays",
      limit: limits.historyDays,
      requiredPlan: required,
      safeMessage: planLimitMessage("historyDays"),
    });
  }
  return { allowed: true };
}

export function canCreateNotebookEntry(
  ctx: EntitlementContext,
): EntitlementResult {
  const snapshot = snapshotForContext(ctx);
  if (!snapshot.features.notebook) {
    return deny(ctx, {
      reason: "feature_not_in_plan",
      requiredPlan: "founder",
      safeMessage:
        "Notebook is not enabled for this self-hosted instance.",
    });
  }
  const gated = accessGate(ctx);
  if (gated) return gated;
  return { allowed: true };
}

export function canCreateAnnotation(
  ctx: EntitlementContext,
): EntitlementResult {
  const snapshot = snapshotForContext(ctx);
  if (!snapshot.features.annotations) {
    return deny(ctx, {
      reason: "feature_not_in_plan",
      requiredPlan: "founder",
      safeMessage:
        "Annotations are not enabled for this self-hosted instance.",
    });
  }
  const gated = accessGate(ctx);
  if (gated) return gated;
  return { allowed: true };
}

export function canExportData(ctx: EntitlementContext): EntitlementResult {
  const snapshot = snapshotForContext(ctx);
  if (!snapshot.features.exportData) {
    return deny(ctx, {
      reason: "feature_not_in_plan",
      requiredPlan: "founder",
      safeMessage:
        "Data export is not enabled for this self-hosted instance.",
    });
  }
  const gated = accessGate(ctx);
  if (gated) return gated;
  return { allowed: true };
}

/** Neutral monitoring authorization. Prefer this over payment-specific checks. */
export function canRunMonitoring(
  ctx: EntitlementContext,
): EntitlementResult {
  const snapshot = snapshotForContext(ctx);

  if (!snapshot.access.canRunMonitoring) {
    return deny(ctx, {
      reason: "billing_inactive",
      safeMessage:
        snapshot.access.bannerMessage ??
        ("Monitoring is not available for this workspace."),
    });
  }
  return { allowed: true };
}

/**
 * @deprecated Use canRunMonitoring. Retained for Cloud billing migration only.
 */
export function canRunPaidMonitoring(
  ctx: EntitlementContext,
): EntitlementResult {
  return canRunMonitoring(ctx);
}

export function recommendPlanForFeature(
  feature:
    | "slackAlerts"
    | "competitorWatch"
    | "dailyCadence"
    | "multipleLocations"
    | "recurringCitationAlerts",
): PlanKey {
  switch (feature) {
    case "slackAlerts":
    case "competitorWatch":
      return "growth";
    case "dailyCadence":
    case "multipleLocations":
    case "recurringCitationAlerts":
      return "pro";
    default: {
      const _exhaustive: never = feature;
      return _exhaustive;
    }
  }
}

export function listAvailablePlanChanges(currentPlan: PlanKey): {
  upgrades: PlanKey[];
  downgrades: PlanKey[];
} {
  return {
    upgrades: getUpgradeTargets(currentPlan),
    downgrades: getDowngradeTargets(currentPlan).filter((key) =>
      isPublicPaidPlanKey(key),
    ),
  };
}
