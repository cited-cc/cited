/**
 * Citation Inbox view models and filter types.
 * Raw DB rows stay in lib/db/types; UI consumes these serializers only.
 */

import type {
  AiSurfaceKey,
  CitationEventType,
  CitationEvidenceType,
} from "@/types/product";

export const INBOX_VIEWS = [
  "all",
  "new",
  "citations",
  "mentions",
  "recommendations",
  "opportunities",
  "saved",
  "archived",
] as const;

export type InboxView = (typeof INBOX_VIEWS)[number];

export const INBOX_DATE_RANGES = [
  "today",
  "7d",
  "30d",
  "all",
  "custom",
] as const;

export type InboxDateRange = (typeof INBOX_DATE_RANGES)[number];

export const INBOX_MEMBER_STATE_FILTERS = [
  "unread",
  "seen",
  "saved",
  "archived",
  "resolved",
  "open",
] as const;

export type InboxMemberStateFilter =
  (typeof INBOX_MEMBER_STATE_FILTERS)[number];

export const INBOX_EVENT_TYPE_FILTERS = [
  "citation",
  "mention",
  "recommendation",
  "competitor_citation",
  "missed_opportunity",
] as const satisfies readonly CitationEventType[];

export type InboxMemberState = {
  seenAt: string | null;
  savedAt: string | null;
  archivedAt: string | null;
  resolvedAt: string | null;
};

export type InboxEventListItem = {
  id: string;
  eventType: CitationEventType;
  aiSurface: AiSurfaceKey | null;
  promptId: string | null;
  promptText: string | null;
  domainId: string | null;
  domainHostname: string | null;
  citedHostname: string | null;
  citedUrl: string | null;
  sourceTitle: string | null;
  sourceSnippet: string | null;
  confidenceScore: number | null;
  firstSeenAt: string;
  lastSeenAt: string;
  occurrenceCount: number;
  latestOccurrenceAt: string | null;
  memberState: InboxMemberState;
};

export type InboxEvidenceItem = {
  type: CitationEvidenceType;
  text: string | null;
  url: string | null;
  title: string | null;
  position: number | null;
};

export type InboxOccurrenceItem = {
  observedAt: string;
  aiSurface: AiSurfaceKey | null;
  sourceHostname: string | null;
  sourceUrl: string | null;
  citationPosition: number | null;
};

export type InboxEventPreview = {
  event: InboxEventListItem;
  responseExcerpt: string | null;
  evidence: InboxEvidenceItem[];
  recentOccurrences: InboxOccurrenceItem[];
};

export type InboxFilters = {
  view: InboxView;
  eventTypes: CitationEventType[];
  surfaces: AiSurfaceKey[];
  domainId: string | null;
  promptId: string | null;
  range: InboxDateRange;
  customFrom: string | null;
  customTo: string | null;
  memberStates: InboxMemberStateFilter[];
  hasSourceCitation: boolean | null;
  search: string | null;
  selectedEventId: string | null;
  cursor: string | null;
};

export type InboxTabCounts = {
  all: number;
  new: number;
  citations: number;
  mentions: number;
  recommendations: number;
  opportunities: number;
  saved: number;
  archived: number;
};

export type InboxFilterOptions = {
  domains: Array<{ id: string; hostname: string }>;
  prompts: Array<{ id: string; name: string; promptText: string }>;
  surfaces: AiSurfaceKey[];
};

export type InboxListResult = {
  items: InboxEventListItem[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type InboxWorkspaceContext = {
  workspaceId: string;
  clerkUserId: string;
  role: import("@/types/product").WorkspaceRole;
  hasActiveMonitors: boolean;
  totalEventCount: number;
};

export type CitationEventMemberAction =
  | "seen"
  | "saved"
  | "unsaved"
  | "archived"
  | "restored"
  | "resolved"
  | "reopened";

export const EMPTY_MEMBER_STATE: InboxMemberState = {
  seenAt: null,
  savedAt: null,
  archivedAt: null,
  resolvedAt: null,
};

export const DEFAULT_INBOX_FILTERS: InboxFilters = {
  view: "all",
  eventTypes: [],
  surfaces: [],
  domainId: null,
  promptId: null,
  range: "all",
  customFrom: null,
  customTo: null,
  memberStates: [],
  hasSourceCitation: null,
  search: null,
  selectedEventId: null,
  cursor: null,
};

export const INBOX_PAGE_SIZE = 25;
export const INBOX_SEARCH_MAX_LENGTH = 120;
export const INBOX_BULK_SELECTION_CAP = 50;
export const INBOX_OCCURRENCE_PREVIEW_LIMIT = 8;
export const INBOX_SNIPPET_MAX_LENGTH = 280;
export const INBOX_RESPONSE_EXCERPT_MAX_LENGTH = 480;
