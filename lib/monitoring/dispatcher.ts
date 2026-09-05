import { randomUUID } from "node:crypto";

import { canRunMonitoringForWorkspace } from "@/lib/entitlements/resolve";
import { createAdminSupabaseClient } from "@/lib/db/admin";
import { getOptionalServerEnv, isMonitoringEnabled } from "@/lib/env";
import { claimDueScanRuns, releaseExpiredLeases } from "@/lib/monitoring/claim-runs";
import { executeScanRun } from "@/lib/monitoring/execute-scan-run";
import {
  buildIdempotencyKey,
  calculateNextRunAt,
  normalizeScheduleSlot,
  resolveDueScheduledFor,
} from "@/lib/monitoring/schedule";
import {
  getMonitoringSafetyLimits,
  isAiSurfaceEnabled,
} from "@/lib/monitoring/surfaces";
import {
  blockMonitorsForUsageLimit,
  evaluateWorkspaceUsageSafety,
} from "@/lib/monitoring/usage";
import type { DispatcherSummary } from "@/lib/monitoring/types";
import type { AiSurfaceKey, MonitoringFrequency, PlanKey } from "@/types/product";
import { logger } from "@/lib/security/logger";

async function createRecurringRuns(input: {
  dispatchBatchSize: number;
  staleMinutes: number;
  now: Date;
}): Promise<{ created: number; evaluated: number; skipped: number }> {
  const admin = createAdminSupabaseClient();
  let created = 0;
  let evaluated = 0;
  let skipped = 0;

  const { data: dueMonitors } = await admin
    .from("monitor_configurations")
    .select(
      "id, workspace_id, ai_surface, scan_frequency, next_run_at, activation_status, enabled",
    )
    .eq("activation_status", "active")
    .eq("enabled", true)
    .not("next_run_at", "is", null)
    .lte("next_run_at", input.now.toISOString())
    .order("next_run_at", { ascending: true })
    .limit(input.dispatchBatchSize);

  for (const monitor of dueMonitors ?? []) {
    evaluated += 1;
    const workspaceId = monitor.workspace_id as string;
    const surface = monitor.ai_surface as AiSurfaceKey;

    if (!isAiSurfaceEnabled(surface)) {
      await admin
        .from("monitor_configurations")
        .update({
          activation_status: "blocked",
          pause_reason: "unsupported_surface",
          paused_at: input.now.toISOString(),
        })
        .eq("id", monitor.id as string);
      skipped += 1;
      continue;
    }

    const { data: workspace } = await admin
      .from("workspaces")
      .select(
        "id, plan_key, status, billing_status, cancel_at_period_end, current_period_start, current_period_end, billing_grace_until, onboarding_completed_at",
      )
      .eq("id", workspaceId)
      .maybeSingle();

    if (!workspace || !workspace.onboarding_completed_at) {
      skipped += 1;
      continue;
    }

    if (
      !canRunMonitoringForWorkspace({
        workspaceId,
        planKey: workspace.plan_key as PlanKey,
        status: workspace.status as "active" | "trialing" | "past_due" | "canceled" | "suspended",
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
      skipped += 1;
      continue;
    }

    const { count: openRuns } = await admin
      .from("scan_runs")
      .select("id", { count: "exact", head: true })
      .eq("monitor_configuration_id", monitor.id as string)
      .in("status", ["queued", "running"]);

    if ((openRuns ?? 0) > 0) {
      // No overlapping active scans; push next_run_at forward without backlog.
      const next = calculateNextRunAt({
        monitorConfigurationId: monitor.id as string,
        cadence: (monitor.scan_frequency as MonitoringFrequency) || "twice_weekly",
        from: input.now,
      });
      await admin
        .from("monitor_configurations")
        .update({ next_run_at: next.toISOString() })
        .eq("id", monitor.id as string);
      skipped += 1;
      continue;
    }

    const usage = await evaluateWorkspaceUsageSafety({
      workspaceId,
      planKey: workspace.plan_key as PlanKey,
      currentPeriodStart: workspace.current_period_start,
      currentPeriodEnd: workspace.current_period_end,
    });
    if (usage.exceeded) {
      await blockMonitorsForUsageLimit({ workspaceId });
      skipped += 1;
      continue;
    }

    const limits = getMonitoringSafetyLimits(workspace.plan_key as PlanKey);
    const { count: concurrent } = await admin
      .from("scan_runs")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .in("status", ["queued", "running"]);
    if ((concurrent ?? 0) >= limits.maxConcurrentRunsPerWorkspace) {
      skipped += 1;
      continue;
    }

    const cadence =
      (monitor.scan_frequency as MonitoringFrequency) || "twice_weekly";
    const scheduledFor = resolveDueScheduledFor({
      monitorConfigurationId: monitor.id as string,
      cadence,
      nextRunAt: new Date(monitor.next_run_at as string),
      now: input.now,
      staleMinutes: input.staleMinutes,
    });
    const idempotencyKey = buildIdempotencyKey({
      monitorConfigurationId: monitor.id as string,
      scheduledFor,
      runType: "recurring",
    });

    const { error } = await admin.from("scan_runs").insert({
      workspace_id: workspaceId,
      monitor_configuration_id: monitor.id as string,
      status: "queued",
      scheduled_for: normalizeScheduleSlot(scheduledFor).toISOString(),
      run_type: "recurring",
      attempt_count: 0,
      poll_attempt_count: 0,
      next_attempt_at: input.now.toISOString(),
      provider: "dataforseo",
      idempotency_key: idempotencyKey,
      correlation_id: idempotencyKey,
      result_summary: { queuedBy: "dispatcher" },
    });

    if (error) {
      if (error.code !== "23505") {
        logger.error("Failed to create recurring scan run", {
          event: "monitoring.dispatch.create_failed",
          workspaceId,
          monitorConfigurationId: monitor.id as string,
        });
      }
      skipped += 1;
    } else {
      created += 1;
    }

    const nextRunAt = calculateNextRunAt({
      monitorConfigurationId: monitor.id as string,
      cadence,
      from: scheduledFor,
    });
    await admin
      .from("monitor_configurations")
      .update({ next_run_at: nextRunAt.toISOString() })
      .eq("id", monitor.id as string);
  }

  return { created, evaluated, skipped };
}

/**
 * Durable monitoring dispatcher. Safe to invoke repeatedly from cron.
 */
export async function runMonitoringDispatcher(): Promise<DispatcherSummary> {
  const env = getOptionalServerEnv();
  const now = new Date();
  const workerId = `dispatcher_${randomUUID()}`;
  const summary: DispatcherSummary = {
    monitorsEvaluated: 0,
    runsCreated: 0,
    runsClaimed: 0,
    runsCompleted: 0,
    runsPending: 0,
    runsFailed: 0,
    runsSkipped: 0,
    leasesReleased: 0,
    processingRounds: 0,
  };

  summary.leasesReleased = await releaseExpiredLeases();

  if (!isMonitoringEnabled(env)) {
    logger.info("Monitoring dispatcher skipped; MONITORING_ENABLED=false", {
      event: "monitoring.dispatch.disabled",
    });
    return summary;
  }

  const dispatchBatch = env.MONITORING_DISPATCH_BATCH_SIZE ?? 25;
  const processBatch = env.MONITORING_PROCESS_BATCH_SIZE ?? 20;
  const staleMinutes = env.MONITORING_STALE_RUN_MINUTES ?? 90;
  const timeBudgetMs = env.MONITORING_DISPATCH_TIME_BUDGET_MS ?? 240_000;
  const maxRounds = env.MONITORING_DISPATCH_MAX_ROUNDS ?? 25;
  const dispatchStartedAt = Date.now();

  const created = await createRecurringRuns({
    dispatchBatchSize: dispatchBatch,
    staleMinutes,
    now,
  });
  summary.monitorsEvaluated = created.evaluated;
  summary.runsCreated = created.created;
  summary.runsSkipped += created.skipped;

  let round = 0;
  while (
    round < maxRounds &&
    Date.now() - dispatchStartedAt < timeBudgetMs
  ) {
    const claimed = await claimDueScanRuns({
      limit: processBatch,
      workerId,
    });
    if (claimed.length === 0) {
      break;
    }

    round += 1;
    summary.processingRounds = round;
    summary.runsClaimed += claimed.length;

    for (const run of claimed) {
      if (Date.now() - dispatchStartedAt >= timeBudgetMs) {
        break;
      }

      try {
        const outcome = await executeScanRun(run);
        switch (outcome) {
          case "completed":
            summary.runsCompleted += 1;
            break;
          case "pending":
            summary.runsPending += 1;
            break;
          case "failed":
            summary.runsFailed += 1;
            break;
          case "retried":
            summary.runsPending += 1;
            break;
          case "skipped":
            summary.runsSkipped += 1;
            break;
          default: {
            const _exhaustive: never = outcome;
            void _exhaustive;
          }
        }
      } catch (error) {
        summary.runsFailed += 1;
        logger.error("Dispatcher failed executing scan run", {
          event: "monitoring.dispatch.execute_error",
          scanRunId: run.id,
          workspaceId: run.workspace_id,
          errorCategory: "internal_persistence_error",
        });
        void error;
      }
    }
  }

  logger.info("Monitoring dispatcher completed", {
    event: "monitoring.dispatch.completed",
    ...summary,
  });

  return summary;
}
