import { createAdminSupabaseClient } from "@/lib/db/admin";
import {
  getMonitoringSafetyLimits,
} from "@/lib/monitoring/surfaces";
import type { PlanKey } from "@/types/product";
import { getOptionalServerEnv } from "@/lib/env";
import { createMonitorIssueNotification } from "@/lib/notifications/create-event-notification";
import { logger } from "@/lib/security/logger";

export type BillingPeriod = {
  start: Date;
  end: Date;
};

/**
 * Prefer Stripe subscription period when available.
 * Fallback: calendar month UTC window (documented in monitoring-engine.md).
 */
export function resolveBillingPeriod(input: {
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  now?: Date;
}): BillingPeriod {
  const now = input.now ?? new Date();
  if (input.currentPeriodStart && input.currentPeriodEnd) {
    const start = new Date(input.currentPeriodStart);
    const end = new Date(input.currentPeriodEnd);
    if (
      Number.isFinite(start.getTime()) &&
      Number.isFinite(end.getTime()) &&
      end.getTime() > start.getTime()
    ) {
      return { start, end };
    }
  }

  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0),
  );
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0),
  );
  return { start, end };
}

export async function getMonitorCheckUsage(input: {
  workspaceId: string;
  period: BillingPeriod;
}): Promise<number> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("monitoring_usage_events")
    .select("quantity")
    .eq("workspace_id", input.workspaceId)
    .eq("metric_key", "monitor_check_completed")
    .gte("billing_period_start", input.period.start.toISOString())
    .lt("billing_period_end", input.period.end.toISOString());

  // Period match: events stored with exact period bounds.
  // Also query by overlapping window for calendar fallback consistency.
  if (error) {
    const { data: fallback } = await admin
      .from("monitoring_usage_events")
      .select("quantity, billing_period_start, billing_period_end")
      .eq("workspace_id", input.workspaceId)
      .eq("metric_key", "monitor_check_completed");

    return (fallback ?? [])
      .filter((row) => {
        const start = new Date(row.billing_period_start as string).getTime();
        return start === input.period.start.getTime();
      })
      .reduce((sum, row) => sum + Number(row.quantity ?? 0), 0);
  }

  // Prefer exact period_start match
  const { data: exact } = await admin
    .from("monitoring_usage_events")
    .select("quantity")
    .eq("workspace_id", input.workspaceId)
    .eq("metric_key", "monitor_check_completed")
    .eq("billing_period_start", input.period.start.toISOString());

  return (exact ?? data ?? []).reduce(
    (sum, row) => sum + Number(row.quantity ?? 0),
    0,
  );
}

export async function recordUsageEvent(input: {
  workspaceId: string;
  scanRunId: string;
  metricKey:
    | "provider_task_submitted"
    | "monitor_check_completed"
    | "provider_cost_usd"
    | "baseline_scan_completed"
    | "recurring_scan_completed";
  quantity: number;
  period: BillingPeriod;
}): Promise<boolean> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.rpc("record_monitoring_usage_event", {
    p_workspace_id: input.workspaceId,
    p_scan_run_id: input.scanRunId,
    p_metric_key: input.metricKey,
    p_quantity: input.quantity,
    p_billing_period_start: input.period.start.toISOString(),
    p_billing_period_end: input.period.end.toISOString(),
    p_source: "monitoring_engine",
  });

  if (error) {
    // Fallback insert for environments without RPC yet.
    const { error: insertError } = await admin
      .from("monitoring_usage_events")
      .insert({
        workspace_id: input.workspaceId,
        scan_run_id: input.scanRunId,
        metric_key: input.metricKey,
        quantity: input.quantity,
        billing_period_start: input.period.start.toISOString(),
        billing_period_end: input.period.end.toISOString(),
        source: "monitoring_engine",
      });
    if (insertError) {
      if (insertError.code === "23505") {
        return false;
      }
      logger.error("Failed to record monitoring usage", {
        event: "monitoring.usage.record_failed",
        workspaceId: input.workspaceId,
        scanRunId: input.scanRunId,
        errorCategory: "internal_persistence_error",
      });
      return false;
    }
    return true;
  }

  return Boolean(data);
}

export function isUsageSafetyExceeded(input: {
  used: number;
  limit: number;
  safetyPercent?: number;
}): boolean {
  const percent = input.safetyPercent ?? 95;
  const threshold = Math.floor((input.limit * percent) / 100);
  return input.used >= threshold;
}

export async function evaluateWorkspaceUsageSafety(input: {
  workspaceId: string;
  planKey: PlanKey;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
}): Promise<{
  exceeded: boolean;
  used: number;
  limit: number;
  period: BillingPeriod;
}> {
  const limits = getMonitoringSafetyLimits(input.planKey);
  const period = resolveBillingPeriod({
    currentPeriodStart: input.currentPeriodStart,
    currentPeriodEnd: input.currentPeriodEnd,
  });
  const used = await getMonitorCheckUsage({
    workspaceId: input.workspaceId,
    period,
  });
  const env = getOptionalServerEnv();
  const exceeded = isUsageSafetyExceeded({
    used,
    limit: limits.maxMonthlyMonitorChecks,
    safetyPercent: env.MONITORING_USAGE_SAFETY_PERCENT ?? 95,
  });
  return {
    exceeded,
    used,
    limit: limits.maxMonthlyMonitorChecks,
    period,
  };
}

export async function blockMonitorsForUsageLimit(input: {
  workspaceId: string;
}): Promise<number> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("monitor_configurations")
    .update({
      activation_status: "blocked",
      pause_reason: "usage_safety_limit_reached",
      paused_at: new Date().toISOString(),
    })
    .eq("workspace_id", input.workspaceId)
    .eq("activation_status", "active")
    .select("id");

  if (error) {
    logger.error("Failed to block monitors for usage limit", {
      event: "monitoring.usage.block_failed",
      workspaceId: input.workspaceId,
    });
    return 0;
  }

  await admin.from("monitoring_audit_events").insert({
    workspace_id: input.workspaceId,
    event_name: "usage_limit_reached",
    safe_metadata: { blockedCount: data?.length ?? 0 },
  });

  await createMonitorIssueNotification({
    workspaceId: input.workspaceId,
    notificationType: "usage_safety_limit_reached",
    monitorIdOrGroup: input.workspaceId,
    issueFingerprint: `usage_safety:${input.workspaceId}`,
    reason: "usage_safety_limit_reached",
    priority: "high",
  });

  return data?.length ?? 0;
}
