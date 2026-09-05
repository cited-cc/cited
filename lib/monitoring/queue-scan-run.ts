import { createAdminSupabaseClient } from "@/lib/db/admin";
import type { Json } from "@/lib/db/types";
import { getOptionalServerEnv } from "@/lib/env";
import {
  attachSnapshotToScanRun,
  createMonitorConfigSnapshot,
  type MonitorConfigSnapshotPayload,
} from "@/lib/monitoring/config-snapshot";
import { loadCompetitorsForScan } from "@/lib/monitoring/load-competitors";
import type { ScanRunType } from "@/lib/monitoring/types";
import {
  buildIdempotencyKey,
  normalizeScheduleSlot,
} from "@/lib/monitoring/schedule";
import type { WorkspaceEntitlementInput } from "@/lib/entitlements/provider";
import type { AiSurfaceKey, MonitoringFrequency } from "@/types/product";

export type QueueScanRunInput = {
  workspaceId: string;
  monitorConfigurationId: string;
  runType: ScanRunType;
  scheduledFor: Date;
  nextAttemptAt: Date;
  correlationId?: string;
  resultSummary?: Record<string, unknown>;
  scheduleVersion: number;
  snapshot: MonitorConfigSnapshotPayload;
  workspaceEntitlements: WorkspaceEntitlementInput;
};

export async function queueScanRunWithSnapshot(
  input: QueueScanRunInput,
): Promise<{ created: boolean; scanRunId?: string }> {
  const admin = createAdminSupabaseClient();
  const env = getOptionalServerEnv();
  const slot = normalizeScheduleSlot(input.scheduledFor);
  const idempotencyKey =
    input.correlationId ??
    buildIdempotencyKey({
      monitorConfigurationId: input.monitorConfigurationId,
      scheduledFor: slot,
      runType: input.runType,
    });

  const snapshotId = await createMonitorConfigSnapshot({
    workspaceId: input.workspaceId,
    monitorConfigurationId: input.monitorConfigurationId,
    scheduleVersion: input.scheduleVersion,
    configuration: input.snapshot,
  });

  const { data, error } = await admin
    .from("scan_runs")
    .insert({
      workspace_id: input.workspaceId,
      monitor_configuration_id: input.monitorConfigurationId,
      status: "queued",
      phase: "queued",
      scheduled_for: slot.toISOString(),
      run_type: input.runType,
      attempt_count: 0,
      poll_attempt_count: 0,
      next_attempt_at: input.nextAttemptAt.toISOString(),
      provider: env.CITED_MONITORING_PROVIDER ?? env.MONITORING_PROVIDER ?? "mock",
      idempotency_key: idempotencyKey,
      correlation_id: idempotencyKey,
      config_snapshot_id: snapshotId,
      result_summary: (input.resultSummary ?? {}) as Json,
      last_transition_at: new Date().toISOString(),
      last_transition_reason: "created",
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { created: false };
    }
    throw error;
  }

  if (data?.id) {
    await attachSnapshotToScanRun({
      scanRunId: data.id as string,
      workspaceId: input.workspaceId,
      snapshotId,
    });
  }

  return { created: true, scanRunId: data?.id as string | undefined };
}

export async function buildMonitorSnapshotPayload(input: {
  workspaceId: string;
  domainId: string;
  monitorConfigurationId: string;
  monitoredPromptId: string;
  promptText: string;
  verifiedHostname: string;
  approvedAliases: string[];
  brandNames: string[];
  aiSurface: AiSurfaceKey;
  locale: string | null;
  countryCode: string | null;
  city: string | null;
  scanFrequency: MonitoringFrequency;
  workspaceEntitlements: WorkspaceEntitlementInput;
}): Promise<MonitorConfigSnapshotPayload> {
  const competitors = await loadCompetitorsForScan({
    workspaceId: input.workspaceId,
    domainId: input.domainId,
    monitorConfigurationId: input.monitorConfigurationId,
    verifiedHostname: input.verifiedHostname,
    approvedAliases: input.approvedAliases,
    workspaceEntitlements: input.workspaceEntitlements,
  });

  return {
    promptText: input.promptText,
    monitoredPromptId: input.monitoredPromptId,
    primaryBrandNames: input.brandNames,
    verifiedHostname: input.verifiedHostname,
    approvedAliases: input.approvedAliases,
    competitorHostnames: competitors.hostnames,
    competitorBrandNames: competitors.brandNames,
    aiSurface: input.aiSurface,
    locale: input.locale,
    countryCode: input.countryCode,
    city: input.city,
    scanFrequency: input.scanFrequency,
    classificationVersion: "2026-09-04",
    providerRouting: null,
  };
}
