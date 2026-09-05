"use server";

import { revalidatePath } from "next/cache";

import { trackProductEvent } from "@/lib/analytics/product";
import { requireWorkspaceRole } from "@/lib/auth";
import { createAdminSupabaseClient } from "@/lib/db/admin";
import { createMonitor } from "@/lib/monitoring/create-monitor";
import { calculateNextRunAt } from "@/lib/monitoring/schedule";
import { isAiSurfaceEnabled } from "@/lib/monitoring/surfaces";
import {
  assertRateLimit,
  RATE_LIMIT_PRESETS,
} from "@/lib/security/rate-limit";
import type { AiSurfaceKey, MonitoringFrequency, PlanKey } from "@/types/product";

function enforceMonitorActionRateLimit(workspaceId: string, action: string): void {
  const result = assertRateLimit({
    key: `monitor:${action}:${workspaceId}`,
    ...RATE_LIMIT_PRESETS.monitorManualAction,
  });
  if (!result.ok) {
    throw new Error("Too many monitor updates. Try again shortly.");
  }
}

export async function createMonitorAction(input: {
  workspaceId: string;
  domainId: string;
  promptText: string;
  surfaces: AiSurfaceKey[];
  countryCode: string;
  languageCode: string;
  city?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const membership = await requireWorkspaceRole(input.workspaceId, [
      "owner",
      "admin",
      "member",
    ]);
    enforceMonitorActionRateLimit(input.workspaceId, "create");

    const admin = createAdminSupabaseClient();
    const { data: workspace } = await admin
      .from("workspaces")
      .select("plan_key, portfolio_extra_domains, status")
      .eq("id", input.workspaceId)
      .maybeSingle();

    if (!workspace) {
      return { ok: false, error: "Workspace not found." };
    }

    if (
      workspace.status !== "active" &&
      workspace.status !== "trialing" &&
      workspace.status !== "past_due"
    ) {
      return {
        ok: false,
        error: "Billing must be active to create monitors.",
      };
    }

    const outcome = await createMonitor({
      workspaceId: input.workspaceId,
      planKey: membership.workspace.plan_key as PlanKey,
      portfolioExtraDomains: workspace.portfolio_extra_domains as number | null,
      domainId: input.domainId,
      promptText: input.promptText,
      surfaces: input.surfaces,
      countryCode: input.countryCode,
      languageCode: input.languageCode,
      city: input.city,
    });

    if (!outcome.ok) {
      return outcome;
    }

    trackProductEvent("monitor_created", { route: "/app" });

    revalidatePath("/app/monitors");
    revalidatePath("/app");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Could not create monitor.",
    };
  }
}

export async function pauseMonitorAction(input: {
  workspaceId: string;
  monitorConfigurationId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireWorkspaceRole(input.workspaceId, ["owner", "admin", "member"]);
    enforceMonitorActionRateLimit(input.workspaceId, "pause");
    const admin = createAdminSupabaseClient();
    const { error } = await admin
      .from("monitor_configurations")
      .update({
        activation_status: "paused",
        paused_at: new Date().toISOString(),
        pause_reason: "user_paused",
        enabled: true,
      })
      .eq("id", input.monitorConfigurationId)
      .eq("workspace_id", input.workspaceId)
      .in("activation_status", ["active", "blocked"]);

    if (error) {
      return { ok: false, error: "Could not pause monitor." };
    }

    await admin.from("monitoring_audit_events").insert({
      workspace_id: input.workspaceId,
      monitor_configuration_id: input.monitorConfigurationId,
      event_name: "monitor_paused",
      safe_metadata: { by: "user" },
    });

    revalidatePath("/app/monitors");
    revalidatePath("/app");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not pause monitor.",
    };
  }
}

export async function resumeMonitorAction(input: {
  workspaceId: string;
  monitorConfigurationId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireWorkspaceRole(input.workspaceId, ["owner", "admin", "member"]);
    enforceMonitorActionRateLimit(input.workspaceId, "resume");
    const admin = createAdminSupabaseClient();

    const { data: config } = await admin
      .from("monitor_configurations")
      .select("id, ai_surface, scan_frequency, activation_status, pause_reason")
      .eq("id", input.monitorConfigurationId)
      .eq("workspace_id", input.workspaceId)
      .maybeSingle();

    if (!config) {
      return { ok: false, error: "Monitor not found." };
    }

    if (!isAiSurfaceEnabled(config.ai_surface as AiSurfaceKey)) {
      return { ok: false, error: "This AI surface is not available." };
    }

    if (config.pause_reason === "usage_safety_limit_reached") {
      return {
        ok: false,
        error: "Usage safety limit reached. Monitoring resumes next billing period.",
      };
    }

    const { data: workspace } = await admin
      .from("workspaces")
      .select("status")
      .eq("id", input.workspaceId)
      .maybeSingle();

    if (
      !workspace ||
      (workspace.status !== "active" && workspace.status !== "trialing")
    ) {
      return { ok: false, error: "Billing must be active to resume monitoring." };
    }

    const now = new Date();
    const nextRunAt = calculateNextRunAt({
      monitorConfigurationId: input.monitorConfigurationId,
      cadence:
        (config.scan_frequency as MonitoringFrequency) === "manual"
          ? "twice_weekly"
          : ((config.scan_frequency as MonitoringFrequency) || "twice_weekly"),
      from: now,
    });

    const { error } = await admin
      .from("monitor_configurations")
      .update({
        activation_status: "active",
        paused_at: null,
        pause_reason: null,
        next_run_at: nextRunAt.toISOString(),
        failure_streak: 0,
      })
      .eq("id", input.monitorConfigurationId)
      .eq("workspace_id", input.workspaceId);

    if (error) {
      return { ok: false, error: "Could not resume monitor." };
    }

    await admin.from("monitoring_audit_events").insert({
      workspace_id: input.workspaceId,
      monitor_configuration_id: input.monitorConfigurationId,
      event_name: "monitor_activated",
      safe_metadata: { resumed: true, nextRunAt: nextRunAt.toISOString() },
    });

    trackProductEvent("monitor_activated", { route: "/app/monitors" });

    revalidatePath("/app/monitors");
    revalidatePath("/app");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Could not resume monitor.",
    };
  }
}
