/**
 * Citation evidence-ledger view models (Phase 7).
 * Raw DB rows stay in lib/db/types; UI consumes these serializers only.
 */

import type {
  AiSurfaceKey,
  CitationAnnotationTargetKind,
  CitationAnnotationVisibility,
  CitationEventType,
  CitationEvidenceType,
  WorkspaceRole,
} from "@/types/product";
import type { InboxMemberState } from "@/lib/inbox/types";

export const MATERIAL_CHANGE_KINDS = [
  "first_observation",
  "observed_again",
  "source_url_changed",
  "source_hostname_changed",
  "citation_position_changed",
  "evidence_text_changed",
  "response_changed",
  "comparison_unavailable",
] as const;

export type MaterialChangeKind = (typeof MATERIAL_CHANGE_KINDS)[number];

export type MaterialChangeResult = {
  kind: MaterialChangeKind;
  label: string;
  summary: string;
  isMaterialChange: boolean;
};

export type EvidenceSourceItem = {
  id: string;
  type: CitationEvidenceType;
  text: string | null;
  url: string | null;
  title: string | null;
  position: number | null;
  hostname: string | null;
};

export type EvidenceHighlightSpan = {
  start: number;
  end: number;
  kind: "citation" | "brand" | "recommendation" | "competitor" | "missed_opportunity";
  label: string;
};

export type ProviderMetadataSnapshot = {
  inputTokens?: number | null;
  outputTokens?: number | null;
  webSearch?: boolean | null;
  moneySpent?: number | null;
  missingAiOverview?: boolean | null;
  asynchronousAiOverview?: boolean | null;
  seType?: string | null;
  itemTypes?: string[] | null;
  locationCode?: number | null;
  mentionCandidateCount?: number | null;
  providerCostUsd?: number | null;
  providerCostType?: "actual" | "estimated" | "unknown" | null;
};

export type AnswerSourceItem = {
  position: number | null;
  hostname: string | null;
  url: string | null;
  title: string | null;
  snippet: string | null;
  relation: "your_domain" | "competitor" | "other";
};

export type ScanRunInsightSnapshot = {
  citationCount: number;
  eventCount: number;
  modelName: string | null;
  providerCostUsd?: number | null;
  missingAiOverview?: boolean;
  inputTokens?: number | null;
  outputTokens?: number | null;
  mentionCandidateCount?: number;
  responseRetained: boolean;
};

export type MonitoredResponseSnapshot = {
  id: string;
  promptText: string | null;
  responseText: string | null;
  responseRetained: boolean;
  aiSurface: AiSurfaceKey | null;
  modelName: string | null;
  observedAt: string;
  locationLabel: string | null;
  locationSource: "monitor" | "provider" | null;
  providerMetadata: ProviderMetadataSnapshot | null;
  allSources: AnswerSourceItem[];
  scanInsight: ScanRunInsightSnapshot | null;
};

export type OccurrenceLedgerItem = {
  id: string;
  observedAt: string;
  aiSurface: AiSurfaceKey | null;
  sourceHostname: string | null;
  sourceUrl: string | null;
  citationPosition: number | null;
  change: MaterialChangeResult;
  isSelected: boolean;
  isFirst: boolean;
  isLatest: boolean;
};

export type CitationAnnotationItem = {
  id: string;
  citationEventId: string;
  aiResponseId: string | null;
  citationEvidenceId: string | null;
  targetKind: CitationAnnotationTargetKind;
  anchorStart: number | null;
  anchorEnd: number | null;
  anchorText: string | null;
  body: string;
  visibility: CitationAnnotationVisibility;
  authorClerkUserId: string;
  authorIsCurrentUser: boolean;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  canEdit: boolean;
  canResolve: boolean;
  canDelete: boolean;
};

export type LinkedNotebookNoteItem = {
  id: string;
  title: string;
  bodyPreview: string;
  visibility: "workspace" | "private";
  pinned: boolean;
  updatedAt: string;
  authorIsCurrentUser: boolean;
};

export type CitationEventDetail = {
  event: {
    id: string;
    eventType: CitationEventType;
    aiSurface: AiSurfaceKey | null;
    promptId: string | null;
    promptText: string | null;
    domainId: string | null;
    domainHostname: string | null;
    brandName: string | null;
    citedHostname: string | null;
    citedUrl: string | null;
    sourceTitle: string | null;
    sourceSnippet: string | null;
    citationPosition: number | null;
    confidenceScore: number | null;
    firstSeenAt: string;
    lastSeenAt: string;
    occurrenceCount: number;
    memberState: InboxMemberState;
    summaryTitle: string;
  };
  selectedOccurrence: OccurrenceLedgerItem;
  response: MonitoredResponseSnapshot;
  sources: EvidenceSourceItem[];
  highlights: EvidenceHighlightSpan[];
  occurrences: OccurrenceLedgerItem[];
  occurrenceHasMore: boolean;
  occurrenceNextCursor: string | null;
  changeSummary: MaterialChangeResult;
  annotations: CitationAnnotationItem[];
  linkedNotes: LinkedNotebookNoteItem[];
  provenance: {
    short: string;
    detail: string;
  };
  permissions: {
    role: WorkspaceRole;
    canArchive: boolean;
    canResolve: boolean;
    canSave: boolean;
    canAnnotate: boolean;
    canCreateNote: boolean;
  };
  /** When false, evidence body is withheld for plan history window. */
  historyAccess: {
    allowed: boolean;
    safeMessage: string | null;
    historyDays: number | null;
  };
};

export const EVIDENCE_OCCURRENCE_PAGE_SIZE = 12;
export const ANNOTATION_BODY_MAX_LENGTH = 4000;
export const ANNOTATION_ANCHOR_MAX_LENGTH = 1000;
export const ANNOTATION_CONTEXT_MAX_LENGTH = 200;
export const RESPONSE_COLLAPSE_THRESHOLD = 1200;
export const LINKED_NOTES_LIMIT = 20;
export const ANNOTATIONS_LIMIT = 50;

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}
