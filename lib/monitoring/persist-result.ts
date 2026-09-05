import { createAdminSupabaseClient } from "@/lib/db/admin";
import { classifyNormalizedResult } from "@/lib/classification";
import {
  appendAiResponseSnapshot,
  appendCitationEvidence,
  appendCitationOccurrence,
  appendScanRunComplete,
  upsertDerivedCitationEvent,
} from "@/lib/evidence/ledger";
import { buildScanResultSummary } from "@/lib/evidence/provider-visibility";
import {
  recordUsageEvent,
  resolveBillingPeriod,
  type BillingPeriod,
} from "@/lib/monitoring/usage";
import type {
  ClassifiedCitationEvent,
  NormalizedAiResult,
  ScanRunType,
} from "@/lib/monitoring/types";
import {
  createEventNotification,
  createRenewedCitationNotification,
} from "@/lib/notifications/create-event-notification";
import { logger } from "@/lib/security/logger";
import type { AiSurfaceKey } from "@/types/product";

export type PersistResultInput = {
  workspaceId: string;
  scanRunId: string;
  monitorConfigurationId: string;
  domainId: string;
  brandId?: string | null;
  aiSurface: AiSurfaceKey;
  runType: ScanRunType;
  verifiedHostname: string;
  approvedAliases: string[];
  brandNames: string[];
  competitorHostnames: string[];
  result: NormalizedAiResult;
  period: BillingPeriod;
  correlationId: string;
};

export type PersistResultOutput = {
  aiResponseId: string;
  eventsCreated: number;
  eventsUpdated: number;
  occurrencesCreated: number;
};

/**
 * Persist a normalized provider result through the immutable evidence ledger.
 * Do not write evidence tables from other call sites.
 */
export async function persistNormalizedResult(
  input: PersistResultInput,
): Promise<PersistResultOutput> {
  const admin = createAdminSupabaseClient();

  const snapshot = await appendAiResponseSnapshot({
    workspaceId: input.workspaceId,
    scanRunId: input.scanRunId,
    aiSurface: input.aiSurface,
    result: input.result,
  });

  const classified = classifyNormalizedResult(input.result, {
    workspaceId: input.workspaceId,
    domainId: input.domainId,
    brandId: input.brandId,
    monitorConfigurationId: input.monitorConfigurationId,
    verifiedHostname: input.verifiedHostname,
    approvedAliases: input.approvedAliases,
    brandNames: input.brandNames,
    competitorHostnames: input.competitorHostnames,
  });

  let eventsCreated = 0;
  let eventsUpdated = 0;
  let occurrencesCreated = 0;
  const nowIso = new Date().toISOString();

  for (const event of classified) {
    const outcome = await upsertCitationEvent({
      input,
      aiResponseId: snapshot.aiResponseId,
      event,
      nowIso,
    });
    if (outcome.created) eventsCreated += 1;
    if (outcome.updated) eventsUpdated += 1;
    if (outcome.occurrenceCreated) occurrencesCreated += 1;
  }

  await appendScanRunComplete({
    workspaceId: input.workspaceId,
    scanRunId: input.scanRunId,
    responseHash: snapshot.responseHash,
    result: input.result,
    runType: input.runType,
    completedAt: nowIso,
    summary: buildScanResultSummary({
      result: input.result,
      eventCount: classified.length,
      eventsCreated,
      eventsUpdated,
      occurrencesCreated,
    }),
  });

  await recordUsageEvent({
    workspaceId: input.workspaceId,
    scanRunId: input.scanRunId,
    metricKey: "monitor_check_completed",
    quantity: 1,
    period: input.period,
  });

  if (input.runType === "baseline") {
    await recordUsageEvent({
      workspaceId: input.workspaceId,
      scanRunId: input.scanRunId,
      metricKey: "baseline_scan_completed",
      quantity: 1,
      period: input.period,
    });
  } else if (input.runType === "recurring") {
    await recordUsageEvent({
      workspaceId: input.workspaceId,
      scanRunId: input.scanRunId,
      metricKey: "recurring_scan_completed",
      quantity: 1,
      period: input.period,
    });
  }

  if (
    typeof input.result.providerCostUsd === "number" &&
    input.result.providerCostUsd > 0
  ) {
    await recordUsageEvent({
      workspaceId: input.workspaceId,
      scanRunId: input.scanRunId,
      metricKey: "provider_cost_usd",
      quantity: input.result.providerCostUsd,
      period: input.period,
    });
  }

  await admin.from("monitoring_audit_events").insert({
    workspace_id: input.workspaceId,
    monitor_configuration_id: input.monitorConfigurationId,
    scan_run_id: input.scanRunId,
    event_name: "scan_completed",
    safe_metadata: {
      eventsCreated,
      eventsUpdated,
      occurrencesCreated,
      correlationId: input.correlationId,
    },
  });

  logger.info("Persisted monitoring result", {
    event: "monitoring.persist.completed",
    workspaceId: input.workspaceId,
    scanRunId: input.scanRunId,
    monitorConfigurationId: input.monitorConfigurationId,
    correlationId: input.correlationId,
    status: "completed",
  });

  return {
    aiResponseId: snapshot.aiResponseId,
    eventsCreated,
    eventsUpdated,
    occurrencesCreated,
  };
}

async function upsertCitationEvent(input: {
  input: PersistResultInput;
  aiResponseId: string;
  event: ClassifiedCitationEvent;
  nowIso: string;
}): Promise<{
  created: boolean;
  updated: boolean;
  occurrenceCreated: boolean;
}> {
  const admin = createAdminSupabaseClient();

  let upserted;
  try {
    upserted = await upsertDerivedCitationEvent({
      workspaceId: input.input.workspaceId,
      domainId: input.input.domainId,
      brandId: input.input.brandId,
      scanRunId: input.input.scanRunId,
      aiResponseId: input.aiResponseId,
      monitorConfigurationId: input.input.monitorConfigurationId,
      aiSurface: input.input.aiSurface,
      event: input.event,
      nowIso: input.nowIso,
    });
  } catch {
    logger.error("Failed to insert citation event", {
      event: "monitoring.persist.event_failed",
      workspaceId: input.input.workspaceId,
      scanRunId: input.input.scanRunId,
    });
    return { created: false, updated: false, occurrenceCreated: false };
  }

  const { citationEventId, created, updated } = upserted;

  if (created) {
    await createEventNotification({
      workspaceId: input.input.workspaceId,
      citationEventId,
      eventType: input.event.eventType,
      aiSurface: input.input.aiSurface,
    });
  }

  const occurrence = await appendCitationOccurrence({
    workspaceId: input.input.workspaceId,
    citationEventId,
    scanRunId: input.input.scanRunId,
    aiResponseId: input.aiResponseId,
    event: input.event,
    observedAt: input.nowIso,
  });

  if (!occurrence.occurrenceCreated) {
    logger.error("Failed to insert citation occurrence", {
      event: "monitoring.persist.occurrence_failed",
      workspaceId: input.input.workspaceId,
      scanRunId: input.input.scanRunId,
    });
  }

  if (
    !created &&
    occurrence.occurrenceCreated &&
    occurrence.isMaterialChange === true
  ) {
    const { data: occurrenceRow } = await admin
      .from("citation_event_occurrences")
      .select("id")
      .eq("workspace_id", input.input.workspaceId)
      .eq("citation_event_id", citationEventId)
      .eq("scan_run_id", input.input.scanRunId)
      .eq("evidence_hash", occurrence.evidenceHash)
      .maybeSingle();

    if (occurrenceRow?.id) {
      await createRenewedCitationNotification({
        workspaceId: input.input.workspaceId,
        citationEventId,
        occurrenceId: occurrenceRow.id as string,
        eventType: input.event.eventType,
        aiSurface: input.input.aiSurface,
        materialChangeType: occurrence.changeSummary,
      });
    }
  }

  if (created || occurrence.occurrenceCreated) {
    await appendCitationEvidence({
      citationEventId,
      evidence: input.event.evidence,
    });
  }

  return {
    created,
    updated,
    occurrenceCreated: occurrence.occurrenceCreated,
  };
}

export { resolveBillingPeriod };
