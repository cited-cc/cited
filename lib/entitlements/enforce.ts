import {
  canUseSurface,
  getPlanFeatures,
  getPlanLimits,
} from "@/lib/entitlements/plan-entitlements";
import { createAdminSupabaseClient } from "@/lib/db/admin";
import { isAiSurfaceEnabled } from "@/lib/monitoring/surfaces";
import type { AiSurfaceKey, PlanKey } from "@/types/product";

const RESTORABLE_PAUSE_REASONS = [
  "billing_inactive",
  "plan_limit",
  "max_active_monitors",
  "plan_capacity_exceeded",
  "unsupported_surface",
] as const;

async function countActiveMonitors(
  workspaceId: string,
): Promise<number> {
  const admin = createAdminSupabaseClient();
  const { count } = await admin
    .from("monitor_configurations")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .eq("activation_status", "active");

  return count ?? 0;
}

async function restoreBlockedMonitor(input: {
  workspaceId: string;
  monitorConfigurationId: string;
  planKey: PlanKey;
}): Promise<boolean> {
  const admin = createAdminSupabaseClient();
  const limits = getPlanLimits(input.planKey);

  const activeCount = await countActiveMonitors(input.workspaceId);
  if (activeCount >= limits.maxActiveMonitorConfigurations) {
    return false;
  }

  const { data: config } = await admin
    .from("monitor_configurations")
    .select("ai_surface")
    .eq("id", input.monitorConfigurationId)
    .eq("workspace_id", input.workspaceId)
    .maybeSingle();

  const surface = config?.ai_surface as AiSurfaceKey | undefined;
  if (
    surface &&
    (!isAiSurfaceEnabled(surface) || !canUseSurface(input.planKey, surface))
  ) {
    return false;
  }

  await admin
    .from("monitor_configurations")
    .update({
      activation_status: "active",
      pause_reason: null,
      paused_at: null,
    })
    .eq("id", input.monitorConfigurationId)
    .eq("workspace_id", input.workspaceId);

  return true;
}

/**
 * After plan change or billing recovery:
 * - Do not delete monitors, prompts, evidence, or notes.
 * - Block excess active monitors beyond the plan limit.
 * - Optionally restore monitors that were blocked only for billing.
 */
export async function enforceActiveMonitorLimits(input: {
  workspaceId: string;
  planKey: PlanKey;
  restoreBillingBlocked?: boolean;
}): Promise<{ active: number; blocked: number; restored: number }> {
  const admin = createAdminSupabaseClient();
  const limits = getPlanLimits(input.planKey);
  const nowIso = new Date().toISOString();
  let restored = 0;

  if (input.restoreBillingBlocked) {
    const { data: blockedMonitors } = await admin
      .from("monitor_configurations")
      .select("id, created_at")
      .eq("workspace_id", input.workspaceId)
      .eq("activation_status", "blocked")
      .in("pause_reason", [...RESTORABLE_PAUSE_REASONS])
      .eq("enabled", true)
      .order("created_at", { ascending: true });

    for (const row of blockedMonitors ?? []) {
      const didRestore = await restoreBlockedMonitor({
        workspaceId: input.workspaceId,
        monitorConfigurationId: row.id as string,
        planKey: input.planKey,
      });
      if (didRestore) {
        restored += 1;
      }
    }
  }

  const { data: activeMonitors } = await admin
    .from("monitor_configurations")
    .select("id, created_at")
    .eq("workspace_id", input.workspaceId)
    .eq("activation_status", "active")
    .order("created_at", { ascending: true });

  const active = activeMonitors ?? [];
  let blocked = 0;

  if (active.length > limits.maxActiveMonitorConfigurations) {
    const excess = active.slice(limits.maxActiveMonitorConfigurations);
    for (const row of excess) {
      await admin
        .from("monitor_configurations")
        .update({
          activation_status: "blocked",
          pause_reason: "plan_limit",
          paused_at: nowIso,
        })
        .eq("id", row.id as string);
      blocked += 1;
    }
  }

  return {
    active: Math.min(active.length, limits.maxActiveMonitorConfigurations),
    blocked,
    restored,
  };
}

/**
 * Calculate over-limit impact for a proposed downgrade without mutating data.
 */
export async function calculateDowngradeImpact(input: {
  workspaceId: string;
  fromPlanKey: PlanKey;
  toPlanKey: PlanKey;
}): Promise<{
  domainsOver: number;
  promptsOver: number;
  monitorsOver: number;
  membersOver: number;
  featureLoss: string[];
  historyDaysFrom: number | null;
  historyDaysTo: number | null;
}> {
  const admin = createAdminSupabaseClient();
  const fromLimits = getPlanLimits(input.fromPlanKey);
  const toLimits = getPlanLimits(input.toPlanKey);
  const fromFeatures = getPlanFeatures(input.fromPlanKey);
  const toFeatures = getPlanFeatures(input.toPlanKey);

  const [
    { count: domains },
    { count: prompts },
    { count: monitors },
    { count: members },
  ] = await Promise.all([
    admin
      .from("domains")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", input.workspaceId),
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
  ]);

  const featureLoss: string[] = [];
  if (fromFeatures.competitorWatch && !toFeatures.competitorWatch) {
    featureLoss.push("Competitor watch");
  }
  if (
    fromFeatures.missedOpportunityAlerts &&
    !toFeatures.missedOpportunityAlerts
  ) {
    featureLoss.push("Missed-opportunity alerts");
  }
  if (
    fromFeatures.recurringCitationAlerts &&
    !toFeatures.recurringCitationAlerts
  ) {
    featureLoss.push("Recurring citation alerts");
  }
  if (
    fromLimits.supportsMultipleLocations &&
    !toLimits.supportsMultipleLocations
  ) {
    featureLoss.push("Multiple locations");
  }
  if (
    fromLimits.monitoringCadence === "daily" &&
    toLimits.monitoringCadence !== "daily"
  ) {
    featureLoss.push("Daily monitoring");
  }

  return {
    domainsOver: Math.max(0, (domains ?? 0) - toLimits.maxDomains),
    promptsOver: Math.max(0, (prompts ?? 0) - toLimits.maxPrompts),
    monitorsOver: Math.max(
      0,
      (monitors ?? 0) - toLimits.maxActiveMonitorConfigurations,
    ),
    membersOver: Math.max(0, (members ?? 0) - toLimits.maxMembers),
    featureLoss,
    historyDaysFrom: fromLimits.historyDays,
    historyDaysTo: toLimits.historyDays,
  };
}
