/**
 * Workspace-scoped citation evidence detail queries.
 */

import {
  canArchiveInboxEvents,
  canCreateAnnotations,
  canCreateNotebookEntries,
  canResolveInboxEvents,
  canSaveInboxEvents,
} from "@/lib/auth/permissions";
import { getPlanLimits } from "@/lib/entitlements/plan-entitlements";
import { createAdminSupabaseClient, requireWorkspaceScope } from "@/lib/db/admin";
import type { Json, Tables } from "@/lib/db/types";
import { canAccessHistoryDate } from "@/lib/entitlements/checks";
import {
  buildOccurrencePage,
  decodeOccurrenceCursor,
  findPriorOccurrence,
  isEarliestOccurrence,
  selectOccurrence,
} from "@/lib/evidence/occurrence-history";
import { getProvenanceCopy } from "@/lib/evidence/provenance";
import { parseProviderMetadata, parseScanRunInsight } from "@/lib/evidence/provider-visibility";
import {
  buildEvidenceHighlights,
  serializeAnnotationItem,
  serializeEvidenceSource,
  serializeEventDetailHeader,
  serializeLinkedNotebookNote,
  serializeMemberState,
  serializeMonitoredResponse,
  serializeOccurrenceLedgerItem,
} from "@/lib/evidence/serializers";
import {
  ANNOTATIONS_LIMIT,
  EVIDENCE_OCCURRENCE_PAGE_SIZE,
  LINKED_NOTES_LIMIT,
  isUuid,
  type CitationEventDetail,
  type OccurrenceLedgerItem,
} from "@/lib/evidence/types";
import type { AiSurfaceKey, PlanKey, WorkspaceRole } from "@/types/product";

type OccurrenceRow = Tables<"citation_event_occurrences">;

function parseLocationSnapshot(snapshot: Json | null | undefined): {
  label: string | null;
  source: "monitor" | "provider" | null;
} {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    return { label: null, source: null };
  }
  const record = snapshot as Record<string, unknown>;
  const labelCandidates = [
    record.label,
    record.location_label,
    record.location,
    record.city,
    record.country,
  ];
  let label: string | null = null;
  for (const candidate of labelCandidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      label = candidate.trim();
      break;
    }
  }
  if (!label && typeof record.country_code === "string") {
    label = record.country_code;
  }
  const sourceRaw = record.source;
  const source =
    sourceRaw === "monitor" || sourceRaw === "provider" ? sourceRaw : null;
  return { label, source };
}

export async function getCitationEventDetail(input: {
  workspaceId: string;
  clerkUserId: string;
  role: WorkspaceRole;
  eventId: string;
  occurrenceId?: string | null;
}): Promise<CitationEventDetail | null> {
  const workspaceId = requireWorkspaceScope(input.workspaceId);
  if (!isUuid(input.eventId)) return null;

  const admin = createAdminSupabaseClient();

  const { data: event, error } = await admin
    .from("citation_events")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("id", input.eventId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load citation event: ${error.message}`);
  }
  if (!event) return null;

  const { data: workspaceBilling } = await admin
    .from("workspaces")
    .select("plan_key, status, billing_status")
    .eq("id", workspaceId)
    .maybeSingle();

  const planKey = (workspaceBilling?.plan_key as PlanKey | undefined) ?? "founder";
  const historyCheck = canAccessHistoryDate(
    {
      workspaceId,
      planKey,
      status: (workspaceBilling?.status as
        | "active"
        | "trialing"
        | "past_due"
        | "canceled"
        | "suspended"
        | undefined) ?? "active",
      billingStatus: (workspaceBilling?.billing_status as
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
        | null) ?? null,
    },
    (event.last_seen_at as string) ?? (event.first_seen_at as string),
  );
  const historyDays = getPlanLimits(planKey).historyDays;

  if (!historyCheck.allowed) {
    const memberState = serializeMemberState(null);
    const eventHeader = serializeEventDetailHeader({
      event,
      memberState,
      promptId: null,
      promptText: null,
      domainHostname: null,
      brandName: null,
    });
    return {
      event: {
        ...eventHeader,
        promptText: null,
        citedUrl: null,
        sourceTitle: null,
        sourceSnippet: null,
      },
      selectedOccurrence: {
        id: "history-gated",
        observedAt: event.last_seen_at as string,
        aiSurface: (event.ai_surface as AiSurfaceKey | null) ?? null,
        sourceHostname: null,
        sourceUrl: null,
        citationPosition: null,
        isFirst: true,
        isLatest: true,
        isSelected: true,
        change: {
          kind: "comparison_unavailable",
          label: "History gated",
          summary: "Outside active history window",
          isMaterialChange: false,
        },
      },
      response: {
        id: "history-gated",
        promptText: null,
        responseText: null,
        responseRetained: false,
        aiSurface: (event.ai_surface as AiSurfaceKey | null) ?? null,
        modelName: null,
        observedAt: event.last_seen_at as string,
        locationLabel: null,
        locationSource: null,
        providerMetadata: null,
        allSources: [],
        scanInsight: null,
      },
      sources: [],
      highlights: [],
      occurrences: [],
      occurrenceHasMore: false,
      occurrenceNextCursor: null,
      changeSummary: {
        kind: "comparison_unavailable",
        label: "History gated",
        summary: "Outside active history window",
        isMaterialChange: false,
      },
      annotations: [],
      linkedNotes: [],
      provenance: getProvenanceCopy(),
      permissions: {
        role: input.role,
        canArchive: false,
        canResolve: false,
        canSave: canSaveInboxEvents(input.role),
        canAnnotate: false,
        canCreateNote: false,
      },
      historyAccess: {
        allowed: false,
        safeMessage: historyCheck.safeMessage,
        historyDays,
      },
    };
  }

  const [
    { data: memberStateRow },
    { data: evidenceRows },
    { data: occurrenceRows },
    { data: annotationRows },
    { data: noteRows },
    { data: monitorConfig },
    { data: domain },
    { data: brand },
  ] = await Promise.all([
    admin
      .from("citation_event_member_states")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("citation_event_id", input.eventId)
      .eq("clerk_user_id", input.clerkUserId)
      .maybeSingle(),
    admin
      .from("citation_evidence")
      .select("*")
      .eq("citation_event_id", input.eventId)
      .order("created_at", { ascending: true })
      .limit(40),
    admin
      .from("citation_event_occurrences")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("citation_event_id", input.eventId)
      .order("observed_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(EVIDENCE_OCCURRENCE_PAGE_SIZE + 1),
    admin
      .from("citation_annotations")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("citation_event_id", input.eventId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(ANNOTATIONS_LIMIT),
    admin
      .from("notebook_entries")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("citation_event_id", input.eventId)
      .is("deleted_at", null)
      .order("pinned", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(LINKED_NOTES_LIMIT),
    event.monitor_configuration_id
      ? admin
          .from("monitor_configurations")
          .select("id, monitored_prompt_id, city, country_code, locale")
          .eq("workspace_id", workspaceId)
          .eq("id", event.monitor_configuration_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    event.domain_id
      ? admin
          .from("domains")
          .select("id, hostname, normalized_hostname")
          .eq("workspace_id", workspaceId)
          .eq("id", event.domain_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    event.brand_id
      ? admin
          .from("brands")
          .select("id, name")
          .eq("workspace_id", workspaceId)
          .eq("id", event.brand_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const allOccurrences = (occurrenceRows ?? []) as OccurrenceRow[];
  const page = buildOccurrencePage({ rows: allOccurrences });

  // If requested occurrence is not in the first page, fetch it explicitly.
  let selected = selectOccurrence({
    occurrencesNewestFirst: allOccurrences,
    requestedId: input.occurrenceId ?? null,
  });

  if (
    input.occurrenceId &&
    isUuid(input.occurrenceId) &&
    (!selected || selected.id !== input.occurrenceId)
  ) {
    const { data: requested } = await admin
      .from("citation_event_occurrences")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("citation_event_id", input.eventId)
      .eq("id", input.occurrenceId)
      .maybeSingle();
    if (requested) {
      selected = requested as OccurrenceRow;
    }
  }

  if (!selected) {
    // Fall back: synthesize from event's primary ai_response if no occurrences.
    return null;
  }

  const { data: aiResponse } = await admin
    .from("ai_responses")
    .select(
      "id, prompt_text_snapshot, response_text, response_hash, ai_surface, model_name, location_snapshot, created_at, citations_snapshot, provider_metadata",
    )
    .eq("workspace_id", workspaceId)
    .eq("id", selected.ai_response_id)
    .maybeSingle();

  const [{ data: domainAliases }, { data: scanRun }] = await Promise.all([
    event.domain_id
      ? admin
          .from("domain_aliases")
          .select("normalized_hostname")
          .eq("domain_id", event.domain_id)
      : Promise.resolve({ data: [] }),
    admin
      .from("scan_runs")
      .select("result_summary")
      .eq("workspace_id", workspaceId)
      .eq("id", selected.scan_run_id)
      .maybeSingle(),
  ]);

  let promptId: string | null = null;
  let promptText: string | null =
    (aiResponse?.prompt_text_snapshot as string | null) ?? null;

  if (monitorConfig?.monitored_prompt_id) {
    const { data: prompt } = await admin
      .from("monitored_prompts")
      .select("id, prompt_text")
      .eq("workspace_id", workspaceId)
      .eq("id", monitorConfig.monitored_prompt_id)
      .maybeSingle();
    promptId = (prompt?.id as string | undefined) ?? null;
    promptText =
      (prompt?.prompt_text as string | undefined) ?? promptText;
  }

  const locationFromResponse = parseLocationSnapshot(
    aiResponse?.location_snapshot as Json | undefined,
  );
  const monitorLocationParts = [
    typeof monitorConfig?.city === "string" ? monitorConfig.city : null,
    typeof monitorConfig?.country_code === "string"
      ? monitorConfig.country_code
      : null,
  ].filter((part): part is string => Boolean(part && part.trim()));
  const monitorLocation =
    monitorLocationParts.length > 0 ? monitorLocationParts.join(", ") : null;
  const locationLabel = monitorLocation ?? locationFromResponse.label;
  const locationSource: "monitor" | "provider" | null = monitorLocation
    ? "monitor"
    : locationFromResponse.source ??
      (locationFromResponse.label ? "provider" : null);

  const memberState = serializeMemberState(memberStateRow);
  const eventHeader = serializeEventDetailHeader({
    event,
    memberState,
    promptId,
    promptText,
    domainHostname: (domain?.hostname as string | undefined) ?? null,
    brandName: (brand?.name as string | undefined) ?? null,
  });

  const aiSurface =
    (event.ai_surface as AiSurfaceKey | null) ??
    ((aiResponse?.ai_surface as AiSurfaceKey | null) ?? null);

  // For material change we need prior within full newest-first set.
  // Fetch one older row if selected is last on page.
  let comparisonSet = allOccurrences;
  if (
    !allOccurrences.some((row) => row.id === selected!.id) ||
    findPriorOccurrence(allOccurrences, selected.id) === null
  ) {
    const { data: around } = await admin
      .from("citation_event_occurrences")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("citation_event_id", input.eventId)
      .lte("observed_at", selected.observed_at)
      .order("observed_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(3);
    if (around && around.length > 0) {
      const map = new Map<string, OccurrenceRow>();
      for (const row of [...allOccurrences, ...(around as OccurrenceRow[])]) {
        map.set(row.id, row);
      }
      comparisonSet = Array.from(map.values()).sort((a, b) => {
        const t = b.observed_at.localeCompare(a.observed_at);
        return t !== 0 ? t : b.id.localeCompare(a.id);
      });
    }
  }

  const prior = findPriorOccurrence(comparisonSet, selected.id);
  const isFirst = isEarliestOccurrence(comparisonSet, selected.id);
  const isLatest = comparisonSet[0]?.id === selected.id;

  const selectedLedger = serializeOccurrenceLedgerItem({
    row: selected,
    aiSurface,
    prior,
    isFirst,
    isLatest,
    isSelected: true,
  });

  const occurrences: OccurrenceLedgerItem[] = page.items.map((row) => {
    const rowPrior = findPriorOccurrence(comparisonSet, row.id);
    return serializeOccurrenceLedgerItem({
      row,
      aiSurface,
      prior: rowPrior,
      isFirst: isEarliestOccurrence(comparisonSet, row.id),
      isLatest: comparisonSet[0]?.id === row.id,
      isSelected: row.id === selected!.id,
    });
  });

  // Ensure selected appears even if outside first page.
  if (!occurrences.some((item) => item.id === selectedLedger.id)) {
    occurrences.unshift(selectedLedger);
  }

  const sources = (evidenceRows ?? []).map(serializeEvidenceSource);
  const verifiedHostname =
    (domain?.normalized_hostname as string | undefined) ??
    (domain?.hostname as string | undefined) ??
    null;
  const approvedAliases = (domainAliases ?? []).map(
    (alias) => alias.normalized_hostname as string,
  );
  const scanSummary = parseScanRunInsight(
    scanRun?.result_summary as Json | undefined,
    parseProviderMetadata(aiResponse?.provider_metadata as Json | undefined),
    Array.isArray(aiResponse?.citations_snapshot)
      ? aiResponse.citations_snapshot.length
      : 0,
  );
  const response = serializeMonitoredResponse({
    response: aiResponse,
    occurrence: selected,
    aiSurface,
    locationLabel,
    locationSource,
    verifiedHostname,
    approvedAliases,
    competitorHostnames: [],
    scanSummary,
  });

  const highlights = buildEvidenceHighlights({
    responseText: response.responseText ?? "",
    eventType: eventHeader.eventType,
    sources,
    citedHostname: eventHeader.citedHostname,
    brandName: eventHeader.brandName,
  });

  const annotations = (annotationRows ?? [])
    .filter((row) => {
      if (row.visibility === "private") {
        return row.author_clerk_user_id === input.clerkUserId;
      }
      return true;
    })
    .map((row) =>
      serializeAnnotationItem({
        row,
        currentUserId: input.clerkUserId,
        role: input.role,
      }),
    );

  const linkedNotes = (noteRows ?? [])
    .filter((row) => {
      if (row.visibility === "private") {
        return row.author_clerk_user_id === input.clerkUserId;
      }
      return true;
    })
    .map((row) =>
      serializeLinkedNotebookNote({
        row,
        currentUserId: input.clerkUserId,
      }),
    );

  return {
    event: eventHeader,
    selectedOccurrence: selectedLedger,
    response,
    sources,
    highlights,
    occurrences,
    occurrenceHasMore: page.hasMore,
    occurrenceNextCursor: page.nextCursor,
    changeSummary: selectedLedger.change,
    annotations,
    linkedNotes,
    provenance: getProvenanceCopy(),
    permissions: {
      role: input.role,
      canArchive: canArchiveInboxEvents(input.role),
      canResolve: canResolveInboxEvents(input.role),
      canSave: canSaveInboxEvents(input.role),
      canAnnotate: canCreateAnnotations(input.role),
      canCreateNote: canCreateNotebookEntries(input.role),
    },
    historyAccess: {
      allowed: true,
      safeMessage: null,
      historyDays,
    },
  };
}

export async function getCitationEventOccurrences(input: {
  workspaceId: string;
  eventId: string;
  cursor?: string | null;
  aiSurface?: AiSurfaceKey | null;
}): Promise<{
  items: OccurrenceLedgerItem[];
  hasMore: boolean;
  nextCursor: string | null;
}> {
  const workspaceId = requireWorkspaceScope(input.workspaceId);
  if (!isUuid(input.eventId)) {
    return { items: [], hasMore: false, nextCursor: null };
  }

  const admin = createAdminSupabaseClient();
  const cursor = decodeOccurrenceCursor(input.cursor);

  let query = admin
    .from("citation_event_occurrences")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("citation_event_id", input.eventId)
    .order("observed_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(EVIDENCE_OCCURRENCE_PAGE_SIZE + 1);

  if (cursor) {
    query = query.or(
      `observed_at.lt.${cursor.observedAt},and(observed_at.eq.${cursor.observedAt},id.lt.${cursor.id})`,
    );
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to load occurrences: ${error.message}`);
  }

  const rows = (data ?? []) as OccurrenceRow[];
  const page = buildOccurrencePage({ rows });

  // Load a slightly wider window for prior comparison.
  const { data: wider } = await admin
    .from("citation_event_occurrences")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("citation_event_id", input.eventId)
    .order("observed_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(EVIDENCE_OCCURRENCE_PAGE_SIZE + 5);

  const comparisonSet = (wider ?? rows) as OccurrenceRow[];

  const items = page.items.map((row) =>
    serializeOccurrenceLedgerItem({
      row,
      aiSurface: input.aiSurface ?? null,
      prior: findPriorOccurrence(comparisonSet, row.id),
      isFirst: isEarliestOccurrence(comparisonSet, row.id),
      isLatest: comparisonSet[0]?.id === row.id,
      isSelected: false,
    }),
  );

  return {
    items,
    hasMore: page.hasMore,
    nextCursor: page.nextCursor,
  };
}

export async function assertOccurrenceInEvent(input: {
  workspaceId: string;
  eventId: string;
  occurrenceId: string;
}): Promise<boolean> {
  const workspaceId = requireWorkspaceScope(input.workspaceId);
  if (!isUuid(input.eventId) || !isUuid(input.occurrenceId)) return false;
  const admin = createAdminSupabaseClient();
  const { data } = await admin
    .from("citation_event_occurrences")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("citation_event_id", input.eventId)
    .eq("id", input.occurrenceId)
    .maybeSingle();
  return Boolean(data);
}
