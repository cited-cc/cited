/**
 * Notebook serializers.
 */

import type { Tables } from "@/lib/db/types";
import { truncateEvidenceText } from "@/lib/inbox/safe-url";
import { buildEventSummary } from "@/lib/inbox/serializers";
import {
  NOTEBOOK_PREVIEW_MAX_LENGTH,
  type NotebookEntryListItem,
  type NotebookEntryRevisionItem,
  type NotebookLinkedEventRef,
} from "@/lib/notebook/types";
import type { AiSurfaceKey, CitationEventType } from "@/types/product";

type NotebookRow = Tables<"notebook_entries">;
type RevisionRow = Tables<"notebook_entry_revisions">;
type CitationEventRow = Tables<"citation_events">;

export function serializeLinkedEventRef(input: {
  event: CitationEventRow;
  promptText?: string | null;
  domainHostname?: string | null;
}): NotebookLinkedEventRef {
  const summaryTitle = buildEventSummary({
    id: input.event.id,
    eventType: input.event.event_type as CitationEventType,
    aiSurface: (input.event.ai_surface as AiSurfaceKey | null) ?? null,
    promptId: null,
    promptText: input.promptText ?? null,
    domainId: input.event.domain_id,
    domainHostname: input.domainHostname ?? null,
    citedHostname: input.event.cited_hostname,
    citedUrl: null,
    sourceTitle: null,
    sourceSnippet: null,
    confidenceScore: null,
    firstSeenAt: input.event.first_seen_at,
    lastSeenAt: input.event.last_seen_at,
    occurrenceCount: Number(input.event.occurrence_count ?? 1),
    latestOccurrenceAt: input.event.last_seen_at,
    memberState: {
      seenAt: null,
      savedAt: null,
      archivedAt: null,
      resolvedAt: null,
    },
  });

  return {
    id: input.event.id,
    eventType: input.event.event_type as CitationEventType,
    aiSurface: (input.event.ai_surface as AiSurfaceKey | null) ?? null,
    summaryTitle,
    promptText: truncateEvidenceText(input.promptText, 160),
    firstSeenAt: input.event.first_seen_at,
    lastSeenAt: input.event.last_seen_at,
  };
}

export function serializeNotebookListItem(input: {
  row: NotebookRow;
  currentUserId: string;
  linkedEvent?: NotebookLinkedEventRef | null;
}): NotebookEntryListItem {
  return {
    id: input.row.id,
    title: input.row.title,
    bodyPreview:
      truncateEvidenceText(input.row.body, NOTEBOOK_PREVIEW_MAX_LENGTH) ?? "",
    visibility: input.row.visibility,
    pinned: input.row.pinned,
    archivedAt: input.row.archived_at,
    updatedAt: input.row.updated_at,
    createdAt: input.row.created_at,
    authorClerkUserId: input.row.author_clerk_user_id,
    authorIsCurrentUser:
      input.row.author_clerk_user_id === input.currentUserId,
    citationEventId: input.row.citation_event_id,
    linkedEvent: input.linkedEvent ?? null,
  };
}

export function serializeNotebookRevision(input: {
  row: RevisionRow;
  currentUserId: string;
}): NotebookEntryRevisionItem {
  return {
    id: input.row.id,
    revisionNumber: input.row.revision_number,
    titleSnapshot: input.row.title_snapshot,
    bodySnapshot: input.row.body_snapshot,
    editedByClerkUserId: input.row.edited_by_clerk_user_id,
    editedByCurrentUser:
      input.row.edited_by_clerk_user_id === input.currentUserId,
    createdAt: input.row.created_at,
  };
}

export function normalizeNotebookTitle(title: string): string {
  return title.replace(/\s+/g, " ").trim();
}

export function normalizeNotebookBody(body: string): string {
  return body.replace(/\r\n/g, "\n");
}
