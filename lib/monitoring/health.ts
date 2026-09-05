import { createAdminSupabaseClient } from "@/lib/db/admin";
import { getOptionalServerEnv, isMonitoringEnabled } from "@/lib/env";
import type { MonitoringHealthSnapshot } from "@/lib/monitoring/types";
import {
  getMonitoringProvider,
  resolveDefaultMonitoringProviderId,
} from "@/lib/providers";

export async function getMonitoringHealthSnapshot(): Promise<MonitoringHealthSnapshot> {
  const env = getOptionalServerEnv();
  const monitoringEnabled = isMonitoringEnabled(env);
  const selectedProviderId = resolveDefaultMonitoringProviderId();

  let providerConfigured = false;
  try {
    const provider = getMonitoringProvider(selectedProviderId);
    const validation = provider.validateConfiguration();
    providerConfigured = validation.ok && validation.ready;
  } catch {
    providerConfigured = false;
  }

  const provider =
    selectedProviderId === "mock"
      ? "mock"
      : providerConfigured
        ? "dataforseo"
        : "none";

  try {
    const admin = createAdminSupabaseClient();
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [{ count: queued }, { count: running }, { count: failed }, { data: oldest }] =
      await Promise.all([
        admin
          .from("scan_runs")
          .select("id", { count: "exact", head: true })
          .eq("status", "queued"),
        admin
          .from("scan_runs")
          .select("id", { count: "exact", head: true })
          .eq("status", "running"),
        admin
          .from("scan_runs")
          .select("id", { count: "exact", head: true })
          .eq("status", "failed")
          .gte("updated_at", since),
        admin
          .from("scan_runs")
          .select("scheduled_for, created_at")
          .in("status", ["queued", "running"])
          .order("scheduled_for", { ascending: true })
          .limit(1)
          .maybeSingle(),
      ]);

    let oldestPendingRunAgeSeconds: number | null = null;
    if (oldest?.scheduled_for) {
      oldestPendingRunAgeSeconds = Math.max(
        0,
        Math.floor(
          (Date.now() - new Date(oldest.scheduled_for as string).getTime()) /
            1000,
        ),
      );
    }

    return {
      monitoringEnabled,
      providerConfigured,
      provider,
      queuedRunCount: queued ?? 0,
      runningRunCount: running ?? 0,
      failedRunCountRecent: failed ?? 0,
      oldestPendingRunAgeSeconds,
    };
  } catch {
    return {
      monitoringEnabled,
      providerConfigured,
      provider,
      queuedRunCount: 0,
      runningRunCount: 0,
      failedRunCountRecent: 0,
      oldestPendingRunAgeSeconds: null,
    };
  }
}
