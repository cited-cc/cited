import { getEffectiveWorkspaceLimits } from "@/lib/entitlements/effective-limits";
import { getPlanLimits } from "@/lib/entitlements/plan-entitlements";
import { createAdminSupabaseClient } from "@/lib/db/admin";
import {
  getMonitorCheckUsage,
  resolveBillingPeriod,
  type BillingPeriod,
} from "@/lib/monitoring/usage";
import { getMonitoringSafetyLimits } from "@/lib/monitoring/surfaces";
import type { PlanKey } from "@/types/product";

export type WorkspaceUsageSnapshot = {
  workspaceId: string;
  planKey: PlanKey;
  period: BillingPeriod;
  domainsUsed: number;
  domainsLimit: number;
  promptsUsed: number;
  promptsLimit: number;
  activeMonitorConfigurationsUsed: number;
  activeMonitorConfigurationsLimit: number;
  monitorChecksUsed: number;
  monitorChecksLimit: number;
  membersUsed: number;
  membersLimit: number;
  historyDays: number | null;
  aiSurfaces: string[];
  generatedAt: string;
  fromCache: boolean;
};

const SNAPSHOT_STALE_MS = 15 * 60 * 1000;

function usagePercent(used: number, limit: number): number {
  if (limit <= 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

export function usageWarningLevel(
  used: number,
  limit: number,
): "ok" | "warn" | "critical" | "blocked" {
  const pct = usagePercent(used, limit);
  if (pct >= 100) return "blocked";
  if (pct >= 95) return "critical";
  if (pct >= 80) return "warn";
  return "ok";
}

export function usagePercentBucket(used: number, limit: number): string {
  const pct = usagePercent(used, limit);
  if (pct >= 100) return "100";
  if (pct >= 95) return "95_99";
  if (pct >= 80) return "80_94";
  if (pct >= 50) return "50_79";
  return "0_49";
}

/**
 * Collect live usage counts from authoritative tables.
 */
export async function collectWorkspaceUsage(input: {
  workspaceId: string;
  planKey: PlanKey;
  portfolioExtraDomains?: number | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
}): Promise<Omit<WorkspaceUsageSnapshot, "fromCache" | "generatedAt">> {
  const admin = createAdminSupabaseClient();
  const limits = getEffectiveWorkspaceLimits({
    planKey: input.planKey,
    portfolioExtraDomains: input.portfolioExtraDomains,
  });
  const safety = getMonitoringSafetyLimits(input.planKey);
  const period = resolveBillingPeriod({
    currentPeriodStart: input.currentPeriodStart,
    currentPeriodEnd: input.currentPeriodEnd,
  });

  const [
    { count: domains },
    { count: prompts },
    { count: monitors },
    { count: members },
    checks,
  ] = await Promise.all([
    admin
      .from("domains")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", input.workspaceId)
      .eq("verification_status", "verified"),
    admin
      .from("monitored_prompts")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", input.workspaceId)
      .eq("active", true),
    admin
      .from("monitor_configurations")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", input.workspaceId)
      .eq("activation_status", "active"),
    admin
      .from("workspace_members")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", input.workspaceId),
    getMonitorCheckUsage({
      workspaceId: input.workspaceId,
      period,
    }),
  ]);

  return {
    workspaceId: input.workspaceId,
    planKey: input.planKey,
    period,
    domainsUsed: domains ?? 0,
    domainsLimit: limits.maxDomains,
    promptsUsed: prompts ?? 0,
    promptsLimit: limits.maxPrompts,
    activeMonitorConfigurationsUsed: monitors ?? 0,
    activeMonitorConfigurationsLimit: limits.maxActiveMonitorConfigurations,
    monitorChecksUsed: checks,
    monitorChecksLimit: safety.maxMonthlyMonitorChecks,
    membersUsed: members ?? 0,
    membersLimit: limits.maxMembers,
    historyDays: limits.historyDays,
    aiSurfaces: limits.includedAiSurfaces,
  };
}

/**
 * Refresh or return a recent billing_usage_snapshots row for fast display.
 */
export async function getOrRefreshUsageSnapshot(input: {
  workspaceId: string;
  planKey: PlanKey;
  portfolioExtraDomains?: number | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  maxAgeMs?: number;
}): Promise<WorkspaceUsageSnapshot> {
  const admin = createAdminSupabaseClient();
  const maxAge = input.maxAgeMs ?? SNAPSHOT_STALE_MS;
  const period = resolveBillingPeriod({
    currentPeriodStart: input.currentPeriodStart,
    currentPeriodEnd: input.currentPeriodEnd,
  });

  const { data: cached } = await admin
    .from("billing_usage_snapshots")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .eq("billing_period_start", period.start.toISOString())
    .eq("billing_period_end", period.end.toISOString())
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (cached?.generated_at) {
    const age =
      Date.now() - new Date(cached.generated_at as string).getTime();
    if (Number.isFinite(age) && age < maxAge) {
      return {
        workspaceId: input.workspaceId,
        planKey: (cached.plan_key_snapshot as PlanKey) ?? input.planKey,
        period,
        domainsUsed: Number(cached.domains_used ?? 0),
        domainsLimit: Number(cached.domains_limit ?? 0),
        promptsUsed: Number(cached.prompts_used ?? 0),
        promptsLimit: Number(cached.prompts_limit ?? 0),
        activeMonitorConfigurationsUsed: Number(
          cached.active_monitor_configurations_used ?? 0,
        ),
        activeMonitorConfigurationsLimit: Number(
          cached.active_monitor_configurations_limit ?? 0,
        ),
        monitorChecksUsed: Number(cached.monitor_checks_used ?? 0),
        monitorChecksLimit: Number(cached.monitor_checks_limit ?? 0),
        membersUsed: Number(cached.members_used ?? 0),
        membersLimit: Number(cached.members_limit ?? 0),
        historyDays: getPlanLimits(input.planKey).historyDays,
        aiSurfaces: getPlanLimits(input.planKey).includedAiSurfaces,
        generatedAt: cached.generated_at as string,
        fromCache: true,
      };
    }
  }

  const live = await collectWorkspaceUsage(input);
  const generatedAt = new Date().toISOString();

  await admin.from("billing_usage_snapshots").upsert(
    {
      workspace_id: input.workspaceId,
      billing_period_start: period.start.toISOString(),
      billing_period_end: period.end.toISOString(),
      plan_key_snapshot: input.planKey,
      domains_used: live.domainsUsed,
      domains_limit: live.domainsLimit,
      prompts_used: live.promptsUsed,
      prompts_limit: live.promptsLimit,
      active_monitor_configurations_used:
        live.activeMonitorConfigurationsUsed,
      active_monitor_configurations_limit:
        live.activeMonitorConfigurationsLimit,
      monitor_checks_used: live.monitorChecksUsed,
      monitor_checks_limit: live.monitorChecksLimit,
      members_used: live.membersUsed,
      members_limit: live.membersLimit,
      generated_at: generatedAt,
    },
    {
      onConflict: "workspace_id,billing_period_start,billing_period_end",
    },
  );

  return {
    ...live,
    generatedAt,
    fromCache: false,
  };
}
