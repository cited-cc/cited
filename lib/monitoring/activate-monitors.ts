import { canRunMonitoringForWorkspace } from "@/lib/entitlements/resolve";
import { canUseSurface, getPlanEntitlements } from "@/lib/entitlements/plan-entitlements";
import { getDefaultCadenceForPlan } from "@/lib/entitlements/plan-catalog";
import { createAdminSupabaseClient } from "@/lib/db/admin";
import { getOptionalServerEnv, isMonitoringEnabled } from "@/lib/env";
import {
  buildIdempotencyKey,
  calculateNextRunAt,
  normalizeScheduleSlot,
} from "@/lib/monitoring/schedule";
import {
  cadenceChecksPerMonth,
  getMonitoringSafetyLimits,
  isAiSurfaceEnabled,
} from "@/lib/monitoring/surfaces";
import { isRecoverableBlockReason } from "@/lib/monitoring/status-copy";
import {
  blockMonitorsForUsageLimit,
  evaluateWorkspaceUsageSafety,
} from "@/lib/monitoring/usage";
import type { AiSurfaceKey, MonitoringFrequency, PlanKey } from "@/types/product";
import { logger } from "@/lib/security/logger";

export type ActivateMonitorsResult = {
  activated: number;
  blocked: number;
  baselinesQueued: number;
  skipped: number;
  reasons: string[];
};

async function queueBaselineRun(input: {
  workspaceId: string;
  monitorConfigurationId: string;
  now: Date;
  /** Spread baseline load across dispatcher cycles. */
  staggerSeconds?: number;
}): Promise<boolean> {
  const admin = createAdminSupabaseClient();
  const scheduledFor = normalizeScheduleSlot(input.now);
  const nextAttemptAt = new Date(
    input.now.getTime() + Math.max(0, input.staggerSeconds ?? 0) * 1000,
  );
  const idempotencyKey = buildIdempotencyKey({
    monitorConfigurationId: input.monitorConfigurationId,
    scheduledFor,
    runType: "baseline",
  });

  const { error } = await admin.from("scan_runs").insert({
    workspace_id: input.workspaceId,
    monitor_configuration_id: input.monitorConfigurationId,
    status: "queued",
    scheduled_for: scheduledFor.toISOString(),
    run_type: "baseline",
    attempt_count: 0,
    poll_attempt_count: 0,
    next_attempt_at: nextAttemptAt.toISOString(),
    provider: "dataforseo",
    idempotency_key: idempotencyKey,
    correlation_id: idempotencyKey,
    result_summary: { queuedBy: "activation" },
  });

  if (error) {
    if (error.code === "23505") {
      return false;
    }
    logger.error("Failed to queue baseline scan", {
      event: "monitoring.baseline.queue_failed",
      workspaceId: input.workspaceId,
      monitorConfigurationId: input.monitorConfigurationId,
    });
    return false;
  }
  return true;
}

async function blockMonitorConfiguration(input: {
  workspaceId: string;
  monitorConfigurationId: string;
  pauseReason: string;
  now: Date;
}): Promise<void> {
  const admin = createAdminSupabaseClient();
  await admin
    .from("monitor_configurations")
    .update({
      activation_status: "blocked",
      pause_reason: input.pauseReason,
      paused_at: input.now.toISOString(),
    })
    .eq("id", input.monitorConfigurationId)
    .eq("workspace_id", input.workspaceId);
}

/**
 * Activate eligible configured monitors after onboarding completion.
 * Does not execute scans synchronously.
 */
export async function activateMonitorsForWorkspace(
  workspaceId: string,
): Promise<ActivateMonitorsResult> {
  const admin = createAdminSupabaseClient();
  const reasons: string[] = [];
  const env = getOptionalServerEnv();
  const now = new Date();

  const { data: workspace } = await admin
    .from("workspaces")
    .select(
      "id, plan_key, status, billing_status, cancel_at_period_end, onboarding_completed_at, current_period_start, current_period_end, billing_grace_until",
    )
    .eq("id", workspaceId)
    .maybeSingle();

  if (!workspace) {
    return {
      activated: 0,
      blocked: 0,
      baselinesQueued: 0,
      skipped: 0,
      reasons: ["Workspace not found"],
    };
  }

  if (
    !canRunMonitoringForWorkspace({
      workspaceId,
      planKey: workspace.plan_key as PlanKey,
      status: workspace.status as
        | "active"
        | "trialing"
        | "past_due"
        | "canceled"
        | "suspended",
      billingStatus: workspace.billing_status as
        | "active"
        | "trialing"
        | "past_due"
        | "unpaid"
        | "canceled"
        | "incomplete"
        | "incomplete_expired"
        | "paused"
        | "suspended"
        | "unknown"
        | null,
      cancelAtPeriodEnd: Boolean(workspace.cancel_at_period_end),
      currentPeriodEnd: workspace.current_period_end as string | null,
      billingGraceUntil: workspace.billing_grace_until as string | null,
    })
  ) {
    reasons.push("Monitoring is not authorized for this workspace");
    return {
      activated: 0,
      blocked: 0,
      baselinesQueued: 0,
      skipped: 0,
      reasons,
    };
  }

  if (!workspace.onboarding_completed_at) {
    reasons.push("Onboarding is not complete");
    return {
      activated: 0,
      blocked: 0,
      baselinesQueued: 0,
      skipped: 0,
      reasons,
    };
  }

  const { data: verifiedDomain } = await admin
    .from("domains")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("verification_status", "verified")
    .limit(1)
    .maybeSingle();

  if (!verifiedDomain) {
    reasons.push("No verified domain");
    return {
      activated: 0,
      blocked: 0,
      baselinesQueued: 0,
      skipped: 0,
      reasons,
    };
  }

  const planKey = workspace.plan_key as PlanKey;
  const entitlements = getPlanEntitlements(planKey);
  const safety = getMonitoringSafetyLimits(planKey);
  const cadence = getDefaultCadenceForPlan(planKey);

  const usage = await evaluateWorkspaceUsageSafety({
    workspaceId,
    planKey,
    currentPeriodStart: workspace.current_period_start,
    currentPeriodEnd: workspace.current_period_end,
  });

  if (usage.exceeded) {
    await blockMonitorsForUsageLimit({ workspaceId });
    reasons.push("Usage safety limit reached");
    return {
      activated: 0,
      blocked: 0,
      baselinesQueued: 0,
      skipped: 0,
      reasons,
    };
  }

  const monitoringOn = isMonitoringEnabled(env);
  if (!monitoringOn) {
    reasons.push(
      process.env.NODE_ENV === "production"
        ? "Monitoring is disabled"
        : "MONITORING_ENABLED=false (monitors stay configured)",
    );
  }

  const { data: configs } = await admin
    .from("monitor_configurations")
    .select(
      "id, ai_surface, enabled, activation_status, scan_frequency, monitored_prompt_id, pause_reason, created_at",
    )
    .eq("workspace_id", workspaceId)
    .eq("enabled", true)
    .in("activation_status", ["configured", "blocked"]);

  const candidates = (configs ?? []).filter((config) => {
    if (config.activation_status === "configured") {
      return true;
    }
    return isRecoverableBlockReason(config.pause_reason as string | null);
  });

  if (candidates.length < 1) {
    reasons.push("No configured monitors");
    return {
      activated: 0,
      blocked: 0,
      baselinesQueued: 0,
      skipped: 0,
      reasons,
    };
  }

  const sortedCandidates = [...candidates].sort((left, right) => {
    const leftCreated = String(left.created_at ?? left.id);
    const rightCreated = String(right.created_at ?? right.id);
    return leftCreated.localeCompare(rightCreated);
  });

  let activated = 0;
  let blocked = 0;
  let baselinesQueued = 0;
  let skipped = 0;
  let baselineBudget = safety.maxBaselineChecksPerActivation;
  let monthlyCheckBudget = safety.maxMonthlyMonitorChecks;
  let baselineStaggerIndex = 0;
  const baselineStaggerSeconds = 15;

  for (const config of sortedCandidates) {
    const surface = config.ai_surface as AiSurfaceKey;
    const frequency = (config.scan_frequency ??
      entitlements.monitoringCadence) as MonitoringFrequency;
    const checksPerMonth = cadenceChecksPerMonth(
      frequency === "manual" ? cadence : frequency,
    );

    if (!isAiSurfaceEnabled(surface) || !canUseSurface(planKey, surface)) {
      await blockMonitorConfiguration({
        workspaceId,
        monitorConfigurationId: config.id as string,
        pauseReason: "unsupported_surface",
        now,
      });
      blocked += 1;
      continue;
    }

    if (activated >= safety.maxActiveMonitorConfigurations) {
      await blockMonitorConfiguration({
        workspaceId,
        monitorConfigurationId: config.id as string,
        pauseReason: "max_active_monitors",
        now,
      });
      blocked += 1;
      continue;
    }

    if (checksPerMonth > 0 && checksPerMonth > monthlyCheckBudget) {
      await blockMonitorConfiguration({
        workspaceId,
        monitorConfigurationId: config.id as string,
        pauseReason: "plan_capacity_exceeded",
        now,
      });
      blocked += 1;
      continue;
    }

    if (!monitoringOn) {
      skipped += 1;
      continue;
    }

    const nextRunAt = calculateNextRunAt({
      monitorConfigurationId: config.id as string,
      cadence: frequency === "manual" ? "twice_weekly" : frequency,
      from: now,
    });

    const { error } = await admin
      .from("monitor_configurations")
      .update({
        activation_status: "active",
        activated_at: now.toISOString(),
        next_run_at: nextRunAt.toISOString(),
        pause_reason: null,
        paused_at: null,
        failure_streak: 0,
      })
      .eq("id", config.id as string)
      .eq("workspace_id", workspaceId);

    if (error) {
      skipped += 1;
      continue;
    }

    activated += 1;
    if (checksPerMonth > 0) {
      monthlyCheckBudget -= checksPerMonth;
    }

    if (baselineBudget > 0) {
      const queued = await queueBaselineRun({
        workspaceId,
        monitorConfigurationId: config.id as string,
        now,
        staggerSeconds: baselineStaggerIndex * baselineStaggerSeconds,
      });
      if (queued) {
        baselinesQueued += 1;
        baselineBudget -= 1;
        baselineStaggerIndex += 1;
        await admin.from("monitoring_audit_events").insert({
          workspace_id: workspaceId,
          monitor_configuration_id: config.id as string,
          event_name: "baseline_queued",
          safe_metadata: {},
        });
      }
    }

    await admin.from("monitoring_audit_events").insert({
      workspace_id: workspaceId,
      monitor_configuration_id: config.id as string,
      event_name: "monitor_activated",
      safe_metadata: { nextRunAt: nextRunAt.toISOString() },
    });
  }

  if (blocked > 0) {
    reasons.push(`${blocked} monitor(s) remain blocked by plan limits.`);
  }

  logger.info("Monitor activation completed", {
    event: "monitoring.activation.completed",
    workspaceId,
    activated,
    blocked,
    baselinesQueued,
    skipped,
  });

  return { activated, blocked, baselinesQueued, skipped, reasons };
}
