import { createAdminSupabaseClient } from "@/lib/db/admin";
import { CLASSIFICATION_VERSION } from "@/lib/classification/contract";
import type { Json } from "@/lib/db/types";
import type { AiSurfaceKey, MonitoringFrequency } from "@/types/product";

export type MonitorConfigSnapshotPayload = {
  promptText: string;
  monitoredPromptId: string;
  primaryBrandNames: string[];
  verifiedHostname: string;
  approvedAliases: string[];
  competitorHostnames: string[];
  competitorBrandNames: string[];
  aiSurface: AiSurfaceKey;
  locale: string | null;
  countryCode: string | null;
  city: string | null;
  scanFrequency: MonitoringFrequency;
  classificationVersion: string;
  providerRouting: string | null;
};

export type CreateConfigSnapshotInput = {
  workspaceId: string;
  monitorConfigurationId: string;
  scheduleVersion: number;
  configuration: MonitorConfigSnapshotPayload;
};

export type ConfigSnapshotRef = {
  snapshotId: string;
  configuration: MonitorConfigSnapshotPayload;
};

export async function createMonitorConfigSnapshot(
  input: CreateConfigSnapshotInput,
): Promise<string> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("monitor_config_snapshots")
    .insert({
      workspace_id: input.workspaceId,
      monitor_configuration_id: input.monitorConfigurationId,
      version: input.scheduleVersion,
      classification_version: CLASSIFICATION_VERSION,
      configuration: input.configuration as unknown as Json,
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    throw new Error("Failed to create monitor configuration snapshot.");
  }
  return data.id as string;
}

export async function loadConfigSnapshot(
  snapshotId: string,
  workspaceId: string,
): Promise<ConfigSnapshotRef | null> {
  const admin = createAdminSupabaseClient();
  const { data } = await admin
    .from("monitor_config_snapshots")
    .select("id, configuration, workspace_id")
    .eq("id", snapshotId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (!data?.configuration) {
    return null;
  }

  return {
    snapshotId: data.id as string,
    configuration: data.configuration as unknown as MonitorConfigSnapshotPayload,
  };
}

export async function attachSnapshotToScanRun(input: {
  scanRunId: string;
  workspaceId: string;
  snapshotId: string;
}): Promise<void> {
  const admin = createAdminSupabaseClient();
  await admin
    .from("scan_runs")
    .update({ config_snapshot_id: input.snapshotId })
    .eq("id", input.scanRunId)
    .eq("workspace_id", input.workspaceId)
    .is("config_snapshot_id", null);
}
