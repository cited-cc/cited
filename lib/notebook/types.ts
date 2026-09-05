/**
 * Notebook view models and constants (Phase 7).
 */

import type {
  AiSurfaceKey,
  CitationEventType,
  NotebookVisibility,
  WorkspaceRole,
} from "@/types/product";

export const NOTEBOOK_VIEWS = [
  "all",
  "pinned",
  "linked",
  "private",
  "archived",
] as const;

export type NotebookView = (typeof NOTEBOOK_VIEWS)[number];

export const NOTEBOOK_DATE_RANGES = [
  "all",
  "7d",
  "30d",
  "custom",
] as const;

export type NotebookDateRange = (typeof NOTEBOOK_DATE_RANGES)[number];

export type NotebookLinkedEventRef = {
  id: string;
  eventType: CitationEventType;
  aiSurface: AiSurfaceKey | null;
  summaryTitle: string;
  promptText: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
};

export type NotebookEntryListItem = {
  id: string;
  title: string;
  bodyPreview: string;
  visibility: NotebookVisibility;
  pinned: boolean;
  archivedAt: string | null;
  updatedAt: string;
  createdAt: string;
  authorClerkUserId: string;
  authorIsCurrentUser: boolean;
  citationEventId: string | null;
  linkedEvent: NotebookLinkedEventRef | null;
};

export type NotebookEntryRevisionItem = {
  id: string;
  revisionNumber: number;
  titleSnapshot: string;
  bodySnapshot: string;
  editedByClerkUserId: string;
  editedByCurrentUser: boolean;
  createdAt: string;
};

export type NotebookEntryDetail = {
  entry: NotebookEntryListItem & {
    body: string;
    bodyFormat: "plain_text";
  };
  revisions: NotebookEntryRevisionItem[];
  revisionCount: number;
  linkedEvent: NotebookLinkedEventRef | null;
  permissions: {
    role: WorkspaceRole;
    canEdit: boolean;
    canArchive: boolean;
    canPin: boolean;
    canChangeVisibility: boolean;
    canRestoreRevision: boolean;
  };
};

export type NotebookCounts = {
  all: number;
  pinned: number;
  linked: number;
  private: number;
  archived: number;
};

export type NotebookFilters = {
  view: NotebookView;
  visibility: NotebookVisibility | null;
  linkedOnly: boolean | null;
  eventType: CitationEventType | null;
  surface: AiSurfaceKey | null;
  authorId: string | null;
  range: NotebookDateRange;
  customFrom: string | null;
  customTo: string | null;
  search: string | null;
  cursor: string | null;
};

export type NotebookListResult = {
  items: NotebookEntryListItem[];
  nextCursor: string | null;
  hasMore: boolean;
};

export const DEFAULT_NOTEBOOK_FILTERS: NotebookFilters = {
  view: "all",
  visibility: null,
  linkedOnly: null,
  eventType: null,
  surface: null,
  authorId: null,
  range: "all",
  customFrom: null,
  customTo: null,
  search: null,
  cursor: null,
};

export const NOTEBOOK_PAGE_SIZE = 25;
export const NOTEBOOK_SEARCH_MAX_LENGTH = 120;
export const NOTEBOOK_TITLE_MAX_LENGTH = 200;
export const NOTEBOOK_BODY_MAX_LENGTH = 20_000;
export const NOTEBOOK_PREVIEW_MAX_LENGTH = 180;

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}
