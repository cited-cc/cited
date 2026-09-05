import { canActivateMonitorConfiguration, canRunMonitoring } from "@/lib/entitlements/checks";
import { isMonitoringEnabled, getOptionalServerEnv } from "@/lib/env";
import { isAiSurfaceEnabled } from "@/lib/monitoring/surfaces";
import { isUsageSafetyExceeded } from "@/lib/monitoring/usage";
import type { AiSurfaceKey, PlanKey, WorkspaceStatus } from "@/types/product";
import type { BillingStatus } from "@/lib/entitlements/access-types";

export type MonitorEligibilityStatus =
  | "active"
  | "paused"
  | "billing_blocked"
  | "verification_required"
  | "plan_limit_blocked"
  | "usage_limit_blocked"
  | "provider_blocked"
  | "failed"
  | "disabled";

export type EligibilityInput = {
  workspaceId: string;
  planKey: PlanKey;
  status: WorkspaceStatus;
  billingStatus?: BillingStatus | null;
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: string | null;
  billingGraceUntil?: string | null;
  domainVerified: boolean;
  activationStatus: string;
  aiSurface: AiSurfaceKey;
  currentActiveMonitorCount: number;
  monthlyChecksUsed: number;
  monthlyCheckLimit: number;
  usageSafetyPercent?: number;
  providerConfigured?: boolean;
  /** Override for tests; defaults to MONITORING_ENABLED env. */
  monitoringEnabled?: boolean;
  now?: Date;
};

/**
 * Resolve whether a monitor configuration is eligible to schedule/run.
 * Returns a clear status, never ambiguous "pending".
 */
export function resolveMonitorEligibility(
  input: EligibilityInput,
): {
  eligible: boolean;
  status: MonitorEligibilityStatus;
  safeMessage?: string;
} {
  const env = getOptionalServerEnv();
  const monitoringEnabled =
    input.monitoringEnabled ?? isMonitoringEnabled(env);
  if (!monitoringEnabled) {
    return {
      eligible: false,
      status: "disabled",
      safeMessage: "Monitoring is disabled for this environment.",
    };
  }

  if (input.providerConfigured === false) {
    return {
      eligible: false,
      status: "provider_blocked",
      safeMessage: "Monitoring provider is not configured.",
    };
  }

  if (!isAiSurfaceEnabled(input.aiSurface)) {
    return {
      eligible: false,
      status: "provider_blocked",
      safeMessage: "This AI surface is not available for monitoring.",
    };
  }

  if (!input.domainVerified) {
    return {
      eligible: false,
      status: "verification_required",
      safeMessage: "Verify your domain before monitoring can run.",
    };
  }

  if (input.activationStatus === "paused") {
    return {
      eligible: false,
      status: "paused",
      safeMessage: "This monitor is paused.",
    };
  }

  if (input.activationStatus === "blocked") {
    return {
      eligible: false,
      status: "plan_limit_blocked",
      safeMessage: "This monitor is blocked by plan or usage limits.",
    };
  }

  if (
    input.activationStatus === "disabled" ||
    input.activationStatus === "failed"
  ) {
    return {
      eligible: false,
      status: input.activationStatus === "failed" ? "failed" : "disabled",
      safeMessage: "This monitor is not active.",
    };
  }

  const entitlement = canActivateMonitorConfiguration(
    {
      workspaceId: input.workspaceId,
      planKey: input.planKey,
      status: input.status,
      billingStatus: input.billingStatus,
      cancelAtPeriodEnd: input.cancelAtPeriodEnd,
      currentPeriodEnd: input.currentPeriodEnd,
      billingGraceUntil: input.billingGraceUntil,
      now: input.now,
    },
    input.currentActiveMonitorCount,
  );

  if (!entitlement.allowed) {
    const status: MonitorEligibilityStatus =
      entitlement.reason === "plan_limit_reached"
        ? "plan_limit_blocked"
        : entitlement.reason === "billing_inactive" ||
            entitlement.reason === "workspace_suspended" ||
            entitlement.reason === "unknown_billing_state"
          ? "billing_blocked"
          : "plan_limit_blocked";
    return {
      eligible: false,
      status,
      safeMessage: entitlement.safeMessage,
    };
  }

  const monitoringAuth = canRunMonitoring({
    workspaceId: input.workspaceId,
    planKey: input.planKey,
    status: input.status,
    billingStatus: input.billingStatus,
    cancelAtPeriodEnd: input.cancelAtPeriodEnd,
    currentPeriodEnd: input.currentPeriodEnd,
    billingGraceUntil: input.billingGraceUntil,
    now: input.now,
  });

  if (!monitoringAuth.allowed) {
    return {
      eligible: false,
      status: "billing_blocked",
      safeMessage:
        monitoringAuth.safeMessage ??
        "Monitoring is paused because billing is inactive.",
    };
  }

  if (
    isUsageSafetyExceeded({
      used: input.monthlyChecksUsed,
      limit: input.monthlyCheckLimit,
      safetyPercent:
        input.usageSafetyPercent ?? env.MONITORING_USAGE_SAFETY_PERCENT ?? 95,
    })
  ) {
    return {
      eligible: false,
      status: "usage_limit_blocked",
      safeMessage:
        "Monitoring is paused because the usage safety limit was reached.",
    };
  }

  return { eligible: true, status: "active" };
}
