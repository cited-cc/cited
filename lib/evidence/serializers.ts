/**
 * Serialize evidence-ledger rows into view models.
 * Never include raw_provider_payload.
 */

import type { Tables } from "@/lib/db/types";
import {
  detectMaterialChange,
  type OccurrenceCompareFields,
} from "@/lib/evidence/material-change";
import { getProvenanceCopy } from "@/lib/evidence/provenance";
import { normalizeProviderText } from "@/lib/evidence/provider-text";
import type {
  CitationAnnotationItem,
  EvidenceHighlightSpan,
  EvidenceSourceItem,
  LinkedNotebookNoteItem,
  MaterialChangeResult,
  MonitoredResponseSnapshot,
  OccurrenceLedgerItem,
  ScanRunInsightSnapshot,
} from "@/lib/evidence/types";
import {
  parseCitationsSnapshot,
  parseProviderMetadata,
  parseScanRunInsight,
  serializeAnswerSources,
} from "@/lib/evidence/provider-visibility";
import { toSafeHttpsUrl, truncateEvidenceText } from "@/lib/inbox/safe-url";
import {
  buildEventSummary,
  serializeMemberState,
} from "@/lib/inbox/serializers";
import type { InboxMemberState } from "@/lib/inbox/types";
import { getHostname } from "@/lib/utils";
import type {
  AiSurfaceKey,
  CitationAnnotationTargetKind,
  CitationAnnotationVisibility,
  CitationEventType,
  CitationEvidenceType,
  WorkspaceRole,
} from "@/types/product";

type CitationEventRow = Tables<"citation_events">;
type OccurrenceRow = Tables<"citation_event_occurrences">;
type EvidenceRow = Tables<"citation_evidence">;
type AnnotationRow = Tables<"citation_annotations">;
type NotebookRow = Tables<"notebook_entries">;
type AiResponseRow = Pick<
  Tables<"ai_responses">,
  | "id"
  | "prompt_text_snapshot"
  | "response_text"
  | "response_hash"
  | "ai_surface"
  | "model_name"
  | "created_at"
  | "citations_snapshot"
  | "provider_metadata"
>;

export function occurrenceCompareFields(
  row: OccurrenceRow,
): OccurrenceCompareFields {
  return {
    sourceUrlNormalized: row.source_url_normalized,
    sourceHostname: row.source_hostname,
    citationPosition: row.citation_position,
    evidenceHash: row.evidence_hash,
    sourceFingerprint: row.source_fingerprint,
    responseFingerprint: row.response_fingerprint,
  };
}

export function serializeOccurrenceLedgerItem(input: {
  row: OccurrenceRow;
  aiSurface: AiSurfaceKey | null;
  prior: OccurrenceRow | null;
  isFirst: boolean;
  isLatest: boolean;
  isSelected: boolean;
}): OccurrenceLedgerItem {
  const change = detectMaterialChange({
    current: occurrenceCompareFields(input.row),
    prior: input.prior ? occurrenceCompareFields(input.prior) : null,
    isFirstObservation: input.isFirst,
  });

  return {
    id: input.row.id,
    observedAt: input.row.observed_at,
    aiSurface: input.aiSurface,
    sourceHostname: input.row.source_hostname,
    sourceUrl: toSafeHttpsUrl(input.row.source_url_normalized),
    citationPosition: input.row.citation_position,
    change,
    isSelected: input.isSelected,
    isFirst: input.isFirst,
    isLatest: input.isLatest,
  };
}

export function serializeEvidenceSource(row: EvidenceRow): EvidenceSourceItem {
  const url = toSafeHttpsUrl(row.evidence_url);
  return {
    id: row.id,
    type: row.evidence_type as CitationEvidenceType,
    text: truncateEvidenceText(row.evidence_text, 400),
    url,
    title: null,
    position: row.evidence_position,
    hostname: url ? getHostname(url) : null,
  };
}

export function buildEvidenceHighlights(input: {
  responseText: string;
  eventType: CitationEventType;
  sources: EvidenceSourceItem[];
  citedHostname: string | null;
  brandName: string | null;
}): EvidenceHighlightSpan[] {
  const text = input.responseText;
  if (!text) return [];

  const spans: EvidenceHighlightSpan[] = [];

  for (const source of input.sources) {
    if (!source.text) continue;
    const idx = text.indexOf(source.text);
    if (idx < 0) continue;

    let kind: EvidenceHighlightSpan["kind"] = "citation";
    let label = "Matched evidence";
    switch (source.type) {
      case "source_link":
      case "domain_match":
        kind = "citation";
        label = "Matched source citation";
        break;
      case "brand_match":
        kind = "brand";
        label = "Matched brand phrase";
        break;
      case "recommendation_excerpt":
        kind = "recommendation";
        label = "Recommendation evidence";
        break;
      case "competitor_match":
        kind =
          input.eventType === "missed_opportunity"
            ? "missed_opportunity"
            : "competitor";
        label =
          input.eventType === "missed_opportunity"
            ? "Competitor evidence while verified domain was absent"
            : "Competitor source evidence";
        break;
      case "response_excerpt":
        kind =
          input.eventType === "mention"
            ? "brand"
            : input.eventType === "recommendation"
              ? "recommendation"
              : "citation";
        label = "Matched response excerpt";
        break;
      default: {
        const _exhaustive: never = source.type;
        void _exhaustive;
        break;
      }
    }

    spans.push({
      start: idx,
      end: idx + source.text.length,
      kind,
      label,
    });
  }

  // Exact hostname / brand phrase fallback when evidence rows lack excerpts.
  if (spans.length === 0) {
    const needles: Array<{ value: string; kind: EvidenceHighlightSpan["kind"]; label: string }> =
      [];
    if (input.citedHostname) {
      needles.push({
        value: input.citedHostname,
        kind:
          input.eventType === "competitor_citation" ||
          input.eventType === "missed_opportunity"
            ? "competitor"
            : "citation",
        label: "Matched hostname",
      });
    }
    if (input.brandName) {
      needles.push({
        value: input.brandName,
        kind: "brand",
        label: "Matched brand phrase",
      });
    }
    for (const needle of needles) {
      const lower = text.toLowerCase();
      const target = needle.value.toLowerCase();
      let from = 0;
      while (from < lower.length) {
        const idx = lower.indexOf(target, from);
        if (idx < 0) break;
        // Boundary-ish check: avoid highlighting inside longer tokens for short brands.
        const before = idx === 0 ? " " : text[idx - 1] ?? " ";
        const after =
          idx + needle.value.length >= text.length
            ? " "
            : text[idx + needle.value.length] ?? " ";
        const boundary = /[\s.,;:!?()[\]"'`/-]/;
        if (boundary.test(before) && boundary.test(after)) {
          spans.push({
            start: idx,
            end: idx + needle.value.length,
            kind: needle.kind,
            label: needle.label,
          });
          break;
        }
        from = idx + needle.value.length;
      }
    }
  }

  return resolveNonOverlappingSpans(spans);
}

function resolveNonOverlappingSpans(
  spans: EvidenceHighlightSpan[],
): EvidenceHighlightSpan[] {
  const sorted = [...spans].sort(
    (a, b) => a.start - b.start || b.end - a.end - (a.end - a.start),
  );
  const result: EvidenceHighlightSpan[] = [];
  let cursor = -1;
  for (const span of sorted) {
    if (span.start < cursor) continue;
    result.push(span);
    cursor = span.end;
  }
  return result;
}

export function serializeMonitoredResponse(input: {
  response: AiResponseRow | null;
  occurrence: OccurrenceRow;
  aiSurface: AiSurfaceKey | null;
  locationLabel: string | null;
  locationSource: "monitor" | "provider" | null;
  verifiedHostname?: string | null;
  approvedAliases?: string[];
  competitorHostnames?: string[];
  scanSummary?: ScanRunInsightSnapshot | null;
}): MonitoredResponseSnapshot {
  const responseText = normalizeProviderText(input.response?.response_text ?? null);
  const citations = parseCitationsSnapshot(input.response?.citations_snapshot);
  const providerMetadata = parseProviderMetadata(input.response?.provider_metadata);
  const allSources = serializeAnswerSources({
    citations,
    verifiedHostname: input.verifiedHostname ?? null,
    approvedAliases: input.approvedAliases ?? [],
    competitorHostnames: input.competitorHostnames ?? [],
  });
  const scanInsight =
    input.scanSummary ??
    parseScanRunInsight(null, providerMetadata, citations.length);

  return {
    id: input.response?.id ?? input.occurrence.ai_response_id,
    promptText: input.response?.prompt_text_snapshot ?? null,
    responseText,
    responseRetained: Boolean(responseText && responseText.trim().length > 0),
    aiSurface:
      (input.response?.ai_surface as AiSurfaceKey | null) ?? input.aiSurface,
    modelName: input.response?.model_name ?? null,
    observedAt: input.occurrence.observed_at,
    locationLabel: input.locationLabel,
    locationSource: input.locationSource,
    providerMetadata,
    allSources,
    scanInsight,
  };
}

export function serializeAnnotationItem(input: {
  row: AnnotationRow;
  currentUserId: string;
  role: WorkspaceRole;
}): CitationAnnotationItem {
  const isAuthor = input.row.author_clerk_user_id === input.currentUserId;
  const isAdmin = input.role === "owner" || input.role === "admin";
  const canEdit = isAuthor;
  const canDelete = isAuthor || isAdmin;
  const canResolve =
    isAuthor ||
    (isAdmin && input.row.visibility === "workspace");

  return {
    id: input.row.id,
    citationEventId: input.row.citation_event_id,
    aiResponseId: input.row.ai_response_id,
    citationEvidenceId: input.row.citation_evidence_id,
    targetKind: input.row.target_kind as CitationAnnotationTargetKind,
    anchorStart: input.row.anchor_start,
    anchorEnd: input.row.anchor_end,
    anchorText: input.row.anchor_text,
    body: input.row.body,
    visibility: input.row.visibility as CitationAnnotationVisibility,
    authorClerkUserId: input.row.author_clerk_user_id,
    authorIsCurrentUser: isAuthor,
    resolvedAt: input.row.resolved_at,
    createdAt: input.row.created_at,
    updatedAt: input.row.updated_at,
    canEdit,
    canResolve,
    canDelete,
  };
}

export function serializeLinkedNotebookNote(input: {
  row: NotebookRow;
  currentUserId: string;
}): LinkedNotebookNoteItem {
  return {
    id: input.row.id,
    title: input.row.title,
    bodyPreview: truncateEvidenceText(input.row.body, 160) ?? "",
    visibility: input.row.visibility,
    pinned: input.row.pinned,
    updatedAt: input.row.updated_at,
    authorIsCurrentUser: input.row.author_clerk_user_id === input.currentUserId,
  };
}

export function serializeEventDetailHeader(input: {
  event: CitationEventRow;
  memberState: InboxMemberState;
  promptId: string | null;
  promptText: string | null;
  domainHostname: string | null;
  brandName: string | null;
}) {
  const listLike = {
    id: input.event.id,
    eventType: input.event.event_type as CitationEventType,
    aiSurface: (input.event.ai_surface as AiSurfaceKey | null) ?? null,
    promptId: input.promptId,
    promptText: truncateEvidenceText(input.promptText, 240),
    domainId: input.event.domain_id,
    domainHostname: input.domainHostname,
    citedHostname: input.event.cited_hostname,
    citedUrl: toSafeHttpsUrl(input.event.cited_url),
    sourceTitle: truncateEvidenceText(input.event.source_title, 160),
    sourceSnippet: truncateEvidenceText(input.event.source_snippet, 280),
    confidenceScore:
      typeof input.event.confidence_score === "number"
        ? input.event.confidence_score
        : null,
    firstSeenAt: input.event.first_seen_at,
    lastSeenAt: input.event.last_seen_at,
    occurrenceCount: Math.max(1, Number(input.event.occurrence_count ?? 1)),
    latestOccurrenceAt: input.event.last_seen_at,
    memberState: input.memberState,
  };

  return {
    ...listLike,
    brandName: input.brandName,
    citationPosition: input.event.citation_position,
    summaryTitle: buildEventSummary(listLike),
  };
}

export { serializeMemberState, getProvenanceCopy };

export function changeSummaryForSelected(
  selected: OccurrenceLedgerItem,
): MaterialChangeResult {
  return selected.change;
}
