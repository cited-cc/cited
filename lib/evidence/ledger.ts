import { createAdminSupabaseClient, requireWorkspaceScope } from "@/lib/db/admin";
import type { Json } from "@/lib/db/types";
import {
  buildResponseFingerprint,
  buildSourceFingerprint,
  detectMaterialChange,
} from "@/lib/evidence/material-change";
import {
  serializeCitationsSnapshot,
  serializeProviderMetadata,
} from "@/lib/evidence/provider-visibility";
import {
  buildEventFingerprint,
  hashEvidenceOccurrence,
  hashResponseEvidence,
  redactAndCapPayload,
} from "@/lib/monitoring/hash";
import type {
  ClassifiedCitationEvent,
  NormalizedAiResult,
  ScanRunType,
} from "@/lib/monitoring/types";
import { getOptionalServerEnv } from "@/lib/env";
import type { AiSurfaceKey } from "@/types/product";

/**
 * Immutable evidence ledger writers.
 * Never mutate historical response text or overwrite occurrences.
 * Event-level derived fields (last_seen_at, counts) may update.
 */

export type AppendAiResponseSnapshotInput = {
  workspaceId: string;
  scanRunId: string;
  aiSurface: AiSurfaceKey;
  result: NormalizedAiResult;
};

export type AppendAiResponseSnapshotResult = {
  aiResponseId: string;
  responseHash: string;
  created: boolean;
};

export async function appendAiResponseSnapshot(
  input: AppendAiResponseSnapshotInput,
): Promise<AppendAiResponseSnapshotResult> {
  const workspaceId = requireWorkspaceScope(input.workspaceId);
  const admin = createAdminSupabaseClient();
  const env = getOptionalServerEnv();
  const maxBytes = env.MONITORING_MAX_RAW_PAYLOAD_BYTES ?? 524_288;

  const { data: existingResponse } = await admin
    .from("ai_responses")
    .select("id, response_hash")
    .eq("scan_run_id", input.scanRunId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  const citationUrls = input.result.citations
    .map((c) => c.normalizedUrl ?? c.url)
    .filter((u): u is string => Boolean(u));

  const responseHash = hashResponseEvidence({
    aiSurface: input.aiSurface,
    prompt: input.result.prompt,
    responseText: input.result.responseText,
    citationUrls,
    languageCode: input.result.location.languageCode,
    countryCode: input.result.location.countryCode,
    city: input.result.location.city,
  });

  if (existingResponse?.id) {
    return {
      aiResponseId: existingResponse.id as string,
      responseHash:
        (existingResponse.response_hash as string | null) ?? responseHash,
      created: false,
    };
  }

  const capped = redactAndCapPayload(input.result.rawPayload, maxBytes);
  const { data: inserted, error } = await admin
    .from("ai_responses")
    .insert({
      workspace_id: workspaceId,
      scan_run_id: input.scanRunId,
      ai_surface: input.aiSurface,
      prompt_text_snapshot: input.result.prompt,
      response_text: input.result.responseText,
      response_language: input.result.responseLanguage ?? null,
      response_hash: responseHash,
      model_name: input.result.modelName ?? null,
      location_snapshot: {
        languageCode: input.result.location.languageCode,
        countryCode: input.result.location.countryCode,
        city: input.result.location.city ?? null,
      },
      raw_provider_payload: {
        ...(capped.payload as Record<string, Json | undefined>),
        _meta: {
          truncated: capped.truncated,
          byteLength: capped.byteLength,
          provider: input.result.provider,
        },
      } as Json,
      citations_snapshot: serializeCitationsSnapshot(input.result.citations),
      provider_metadata: serializeProviderMetadata(input.result),
    })
    .select("id")
    .single();

  if (error || !inserted) {
    if (error?.code === "23505") {
      const { data: raced } = await admin
        .from("ai_responses")
        .select("id, response_hash")
        .eq("scan_run_id", input.scanRunId)
        .eq("workspace_id", workspaceId)
        .maybeSingle();
      if (raced?.id) {
        return {
          aiResponseId: raced.id as string,
          responseHash: (raced.response_hash as string | null) ?? responseHash,
          created: false,
        };
      }
    }
    throw new Error("Failed to persist AI response evidence.");
  }

  return {
    aiResponseId: inserted.id as string,
    responseHash,
    created: true,
  };
}

export type AppendCitationEvidenceInput = {
  citationEventId: string;
  evidence: ClassifiedCitationEvent["evidence"];
};

export async function appendCitationEvidence(
  input: AppendCitationEvidenceInput,
): Promise<string[]> {
  const admin = createAdminSupabaseClient();
  const ids: string[] = [];

  for (const evidence of input.evidence) {
    const { data } = await admin
      .from("citation_evidence")
      .insert({
        citation_event_id: input.citationEventId,
        evidence_type: evidence.evidenceType,
        evidence_text: evidence.evidenceText ?? null,
        evidence_url: evidence.evidenceUrl ?? null,
        evidence_position: evidence.evidencePosition ?? null,
        metadata: (evidence.metadata ?? {}) as Json,
      })
      .select("id")
      .single();
    if (data?.id) ids.push(data.id as string);
  }

  return ids;
}

export type AppendCitationOccurrenceInput = {
  workspaceId: string;
  citationEventId: string;
  scanRunId: string;
  aiResponseId: string;
  event: ClassifiedCitationEvent;
  observedAt: string;
};

export type AppendCitationOccurrenceResult = {
  occurrenceCreated: boolean;
  isMaterialChange: boolean | null;
  changeSummary: string | null;
  evidenceHash: string;
};

export async function appendCitationOccurrence(
  input: AppendCitationOccurrenceInput,
): Promise<AppendCitationOccurrenceResult> {
  const workspaceId = requireWorkspaceScope(input.workspaceId);
  const admin = createAdminSupabaseClient();

  const evidenceHash = hashEvidenceOccurrence({
    eventType: input.event.eventType,
    citedUrlNormalized: input.event.citedUrlNormalized,
    brandKey: input.event.fingerprintKey,
    responseExcerpt: input.event.evidence[0]?.evidenceText ?? null,
  });

  const sourceFingerprint = buildSourceFingerprint({
    sourceUrlNormalized: input.event.citedUrlNormalized ?? null,
    sourceHostname: input.event.citedHostname ?? null,
    citationPosition: input.event.citationPosition ?? null,
  });
  const responseFingerprint = buildResponseFingerprint({
    evidenceHash,
    responseHash: null,
  });

  const { data: priorOccurrence } = await admin
    .from("citation_event_occurrences")
    .select(
      "source_url_normalized, source_hostname, citation_position, evidence_hash, source_fingerprint, response_fingerprint",
    )
    .eq("workspace_id", workspaceId)
    .eq("citation_event_id", input.citationEventId)
    .order("observed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const change = detectMaterialChange({
    current: {
      sourceUrlNormalized: input.event.citedUrlNormalized ?? null,
      sourceHostname: input.event.citedHostname ?? null,
      citationPosition: input.event.citationPosition ?? null,
      evidenceHash,
      sourceFingerprint,
      responseFingerprint,
    },
    prior: priorOccurrence
      ? {
          sourceUrlNormalized: priorOccurrence.source_url_normalized,
          sourceHostname: priorOccurrence.source_hostname,
          citationPosition: priorOccurrence.citation_position,
          evidenceHash: priorOccurrence.evidence_hash,
          sourceFingerprint: priorOccurrence.source_fingerprint,
          responseFingerprint: priorOccurrence.response_fingerprint,
        }
      : null,
    isFirstObservation: !priorOccurrence,
  });

  const { error: occurrenceError } = await admin
    .from("citation_event_occurrences")
    .insert({
      workspace_id: workspaceId,
      citation_event_id: input.citationEventId,
      scan_run_id: input.scanRunId,
      ai_response_id: input.aiResponseId,
      observed_at: input.observedAt,
      event_type: input.event.eventType,
      source_url_normalized: input.event.citedUrlNormalized ?? null,
      source_hostname: input.event.citedHostname ?? null,
      source_title: input.event.sourceTitle ?? null,
      source_snippet: input.event.sourceSnippet ?? null,
      citation_position: input.event.citationPosition ?? null,
      confidence_score: input.event.confidenceScore,
      evidence_hash: evidenceHash,
      source_fingerprint: sourceFingerprint,
      response_fingerprint: responseFingerprint,
      is_material_change: change.isMaterialChange,
      change_summary: change.label,
    });

  return {
    occurrenceCreated: !occurrenceError,
    isMaterialChange: change.isMaterialChange,
    changeSummary: change.label,
    evidenceHash,
  };
}

export type UpsertDerivedCitationEventInput = {
  workspaceId: string;
  domainId: string;
  brandId?: string | null;
  scanRunId: string;
  aiResponseId: string;
  monitorConfigurationId: string;
  aiSurface: AiSurfaceKey;
  event: ClassifiedCitationEvent;
  nowIso: string;
};

export type UpsertDerivedCitationEventResult = {
  citationEventId: string;
  created: boolean;
  updated: boolean;
  fingerprint: string;
};

/**
 * Upserts derived citation_events state. Evidence and occurrences stay append-only.
 */
export async function upsertDerivedCitationEvent(
  input: UpsertDerivedCitationEventInput,
): Promise<UpsertDerivedCitationEventResult> {
  const workspaceId = requireWorkspaceScope(input.workspaceId);
  const admin = createAdminSupabaseClient();
  const fingerprint =
    (input.event.metadata?.fingerprint as string | undefined) ??
    buildEventFingerprint({
      workspaceId,
      domainId: input.domainId,
      monitorConfigurationId: input.monitorConfigurationId,
      aiSurface: input.aiSurface,
      eventType: input.event.eventType,
      identityKey: input.event.fingerprintKey,
    });

  const { data: existing } = await admin
    .from("citation_events")
    .select("id, occurrence_count")
    .eq("workspace_id", workspaceId)
    .eq("event_fingerprint", fingerprint)
    .maybeSingle();

  if (existing?.id) {
    await admin
      .from("citation_events")
      .update({
        last_seen_at: input.nowIso,
        occurrence_count: Number(existing.occurrence_count ?? 1) + 1,
        confidence_score: input.event.confidenceScore,
        scan_run_id: input.scanRunId,
        ai_response_id: input.aiResponseId,
        cited_url: input.event.citedUrl ?? null,
        cited_url_normalized: input.event.citedUrlNormalized ?? null,
        cited_hostname: input.event.citedHostname ?? null,
        source_title: input.event.sourceTitle ?? null,
        source_snippet: input.event.sourceSnippet ?? null,
        citation_position: input.event.citationPosition ?? null,
      })
      .eq("id", existing.id)
      .eq("workspace_id", workspaceId);

    return {
      citationEventId: existing.id as string,
      created: false,
      updated: true,
      fingerprint,
    };
  }

  const { data: inserted, error } = await admin
    .from("citation_events")
    .insert({
      workspace_id: workspaceId,
      domain_id: input.domainId,
      brand_id: input.event.matchedBrandId ?? input.brandId ?? null,
      scan_run_id: input.scanRunId,
      ai_response_id: input.aiResponseId,
      monitor_configuration_id: input.monitorConfigurationId,
      event_type: input.event.eventType,
      status: "new",
      cited_hostname: input.event.citedHostname ?? null,
      cited_url: input.event.citedUrl ?? null,
      cited_url_normalized: input.event.citedUrlNormalized ?? null,
      source_title: input.event.sourceTitle ?? null,
      source_snippet: input.event.sourceSnippet ?? null,
      citation_position: input.event.citationPosition ?? null,
      confidence_score: input.event.confidenceScore,
      first_seen_at: input.nowIso,
      last_seen_at: input.nowIso,
      event_fingerprint: fingerprint,
      ai_surface: input.aiSurface,
      occurrence_count: 1,
      metadata: (input.event.metadata ?? {}) as Json,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    if (error?.code === "23505") {
      const { data: raced } = await admin
        .from("citation_events")
        .select("id")
        .eq("workspace_id", workspaceId)
        .eq("event_fingerprint", fingerprint)
        .maybeSingle();
      if (raced?.id) {
        return {
          citationEventId: raced.id as string,
          created: false,
          updated: true,
          fingerprint,
        };
      }
    }
    throw new Error("Failed to upsert derived citation event.");
  }

  return {
    citationEventId: inserted.id as string,
    created: true,
    updated: false,
    fingerprint,
  };
}

export type AppendScanRunCompleteInput = {
  workspaceId: string;
  scanRunId: string;
  responseHash: string;
  result: NormalizedAiResult;
  runType: ScanRunType;
  summary: Record<string, unknown>;
  completedAt: string;
};

/**
 * Marks a scan run completed. Does not rewrite historical evidence.
 */
export async function appendScanRunComplete(
  input: AppendScanRunCompleteInput,
): Promise<void> {
  const workspaceId = requireWorkspaceScope(input.workspaceId);
  const admin = createAdminSupabaseClient();

  await admin
    .from("scan_runs")
    .update({
      status: "completed",
      completed_at: input.completedAt,
      response_hash: input.responseHash,
      provider_cost_usd: input.result.providerCostUsd ?? null,
      provider_cost_type: input.result.providerCostType,
      provider_task_id: input.result.providerTaskId ?? null,
      claimed_at: null,
      claimed_by: null,
      lease_expires_at: null,
      next_poll_at: null,
      result_summary: input.summary as Json,
      failure_code: null,
      failure_message: null,
      provider_error_category: null,
    })
    .eq("id", input.scanRunId)
    .eq("workspace_id", workspaceId);
}

/** Alias matching the rescue naming: appendScanRun for completion writes. */
export const appendScanRun = appendScanRunComplete;
