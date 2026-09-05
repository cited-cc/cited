/**
 * Workspace-scoped notebook queries with private-note filtering.
 */

import { createAdminSupabaseClient, requireWorkspaceScope } from "@/lib/db/admin";
import type { Tables } from "@/lib/db/types";
import { createHmac, timingSafeEqual } from "node:crypto";
import {
  canArchiveNotebookEntry,
  canChangeNotebookVisibility,
  canEditNotebookEntry,
  canPinNotebookEntry,
  canRestoreNotebookRevision,
  canViewNotebookEntry,
} from "@/lib/notebook/permissions";
import { resolveNotebookDateBounds } from "@/lib/notebook/query-state";
import { listNotebookRevisions } from "@/lib/notebook/revisions";
import {
  serializeLinkedEventRef,
  serializeNotebookListItem,
} from "@/lib/notebook/serializers";
import {
  NOTEBOOK_PAGE_SIZE,
  isUuid,
  type NotebookCounts,
  type NotebookEntryDetail,
  type NotebookEntryListItem,
  type NotebookFilters,
  type NotebookLinkedEventRef,
  type NotebookListResult,
} from "@/lib/notebook/types";
import type { WorkspaceRole } from "@/types/product";

type NotebookRow = Tables<"notebook_entries">;
type CitationEventRow = Tables<"citation_events">;

type NotebookCursor = {
  updatedAt: string;
  id: string;
};

function cursorSecret(): string {
  return (
    process.env.INBOX_CURSOR_SECRET ||
    process.env.CITED_CURSOR_SECRET ||
    "cited-dev-cursor-secret"
  );
}

function encodeCursor(cursor: NotebookCursor): string {
  const payload = Buffer.from(
    JSON.stringify({ u: cursor.updatedAt, i: cursor.id }),
    "utf8",
  ).toString("base64url");
  const sig = createHmac("sha256", cursorSecret())
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

function decodeCursor(raw: string | null | undefined): NotebookCursor | null {
  if (!raw) return null;
  const [payload, sig] = raw.split(".");
  if (!payload || !sig) return null;
  const expected = createHmac("sha256", cursorSecret())
    .update(payload)
    .digest("base64url");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { u?: string; i?: string };
    if (!parsed.u || !parsed.i || !isUuid(parsed.i)) return null;
    return { updatedAt: parsed.u, id: parsed.i };
  } catch {
    return null;
  }
}

function visibilityFilterClause(clerkUserId: string): string {
  // Workspace notes OR own private notes.
  return `visibility.eq.workspace,and(visibility.eq.private,author_clerk_user_id.eq.${clerkUserId})`;
}

async function loadLinkedEventMap(input: {
  workspaceId: string;
  eventIds: string[];
}): Promise<Map<string, NotebookLinkedEventRef>> {
  const map = new Map<string, NotebookLinkedEventRef>();
  if (input.eventIds.length === 0) return map;

  const admin = createAdminSupabaseClient();
  const { data: events } = await admin
    .from("citation_events")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .in("id", input.eventIds);

  if (!events || events.length === 0) return map;

  const domainIds = Array.from(
    new Set(
      events
        .map((e) => e.domain_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  const { data: domains } =
    domainIds.length > 0
      ? await admin
          .from("domains")
          .select("id, hostname")
          .eq("workspace_id", input.workspaceId)
          .in("id", domainIds)
      : { data: [] };

  const domainMap = new Map(
    (domains ?? []).map((d) => [d.id as string, d.hostname as string]),
  );

  for (const event of events as CitationEventRow[]) {
    map.set(
      event.id,
      serializeLinkedEventRef({
        event,
        domainHostname: event.domain_id
          ? (domainMap.get(event.domain_id) ?? null)
          : null,
      }),
    );
  }

  return map;
}

export async function getNotebookCounts(input: {
  workspaceId: string;
  clerkUserId: string;
}): Promise<NotebookCounts> {
  const workspaceId = requireWorkspaceScope(input.workspaceId);
  const admin = createAdminSupabaseClient();

  const base = () =>
    admin
      .from("notebook_entries")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null)
      .or(visibilityFilterClause(input.clerkUserId));

  const [
    { count: all },
    { count: pinned },
    { count: linked },
    { count: privateCount },
    { count: archived },
  ] = await Promise.all([
    base().is("archived_at", null),
    base().is("archived_at", null).eq("pinned", true),
    base().is("archived_at", null).not("citation_event_id", "is", null),
    admin
      .from("notebook_entries")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null)
      .is("archived_at", null)
      .eq("visibility", "private")
      .eq("author_clerk_user_id", input.clerkUserId),
    base().not("archived_at", "is", null),
  ]);

  return {
    all: all ?? 0,
    pinned: pinned ?? 0,
    linked: linked ?? 0,
    private: privateCount ?? 0,
    archived: archived ?? 0,
  };
}

export async function getNotebookEntries(input: {
  workspaceId: string;
  clerkUserId: string;
  filters: NotebookFilters;
}): Promise<NotebookListResult> {
  const workspaceId = requireWorkspaceScope(input.workspaceId);
  const admin = createAdminSupabaseClient();
  const bounds = resolveNotebookDateBounds(input.filters);
  const cursor = decodeCursor(input.filters.cursor);

  let query = admin
    .from("notebook_entries")
    .select("*")
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .or(visibilityFilterClause(input.clerkUserId))
    .order("pinned", { ascending: false })
    .order("updated_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(NOTEBOOK_PAGE_SIZE + 1);

  switch (input.filters.view) {
    case "all":
      query = query.is("archived_at", null);
      break;
    case "pinned":
      query = query.is("archived_at", null).eq("pinned", true);
      break;
    case "linked":
      query = query.is("archived_at", null).not("citation_event_id", "is", null);
      break;
    case "private":
      query = query
        .is("archived_at", null)
        .eq("visibility", "private")
        .eq("author_clerk_user_id", input.clerkUserId);
      break;
    case "archived":
      query = query.not("archived_at", "is", null);
      break;
    default: {
      const _exhaustive: never = input.filters.view;
      void _exhaustive;
      break;
    }
  }

  if (input.filters.visibility && input.filters.view !== "private") {
    if (input.filters.visibility === "private") {
      query = query
        .eq("visibility", "private")
        .eq("author_clerk_user_id", input.clerkUserId);
    } else {
      query = query.eq("visibility", "workspace");
    }
  }

  if (bounds.from) query = query.gte("updated_at", bounds.from);
  if (bounds.to) query = query.lte("updated_at", bounds.to);

  if (cursor) {
    query = query.or(
      `updated_at.lt.${cursor.updatedAt},and(updated_at.eq.${cursor.updatedAt},id.lt.${cursor.id})`,
    );
  }

  if (input.filters.search) {
    const term = input.filters.search.replace(/[%_,]/g, " ").trim();
    if (term) {
      query = query.or(`title.ilike.%${term}%,body.ilike.%${term}%`);
    }
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to load notebook entries: ${error.message}`);
  }

  let rows = (data ?? []) as NotebookRow[];

  // Optional linked-event filters applied after fetch when event metadata needed.
  if (input.filters.eventType || input.filters.surface) {
    const eventIds = rows
      .map((r) => r.citation_event_id)
      .filter((id): id is string => Boolean(id));
    if (eventIds.length === 0) {
      rows = rows.filter((r) => !r.citation_event_id);
    } else {
      let eventQuery = admin
        .from("citation_events")
        .select("id")
        .eq("workspace_id", workspaceId)
        .in("id", eventIds);
      if (input.filters.eventType) {
        eventQuery = eventQuery.eq("event_type", input.filters.eventType);
      }
      if (input.filters.surface) {
        eventQuery = eventQuery.eq("ai_surface", input.filters.surface);
      }
      const { data: matched } = await eventQuery;
      const allowed = new Set((matched ?? []).map((e) => e.id as string));
      rows = rows.filter(
        (r) => r.citation_event_id && allowed.has(r.citation_event_id),
      );
    }
  }

  if (input.filters.authorId) {
    rows = rows.filter((r) => r.author_clerk_user_id === input.filters.authorId);
  }

  const hasMore = rows.length > NOTEBOOK_PAGE_SIZE;
  const page = hasMore ? rows.slice(0, NOTEBOOK_PAGE_SIZE) : rows;
  const last = page[page.length - 1];

  const linkedMap = await loadLinkedEventMap({
    workspaceId,
    eventIds: page
      .map((r) => r.citation_event_id)
      .filter((id): id is string => Boolean(id)),
  });

  const items: NotebookEntryListItem[] = page.map((row) =>
    serializeNotebookListItem({
      row,
      currentUserId: input.clerkUserId,
      linkedEvent: row.citation_event_id
        ? (linkedMap.get(row.citation_event_id) ?? null)
        : null,
    }),
  );

  return {
    items,
    hasMore,
    nextCursor:
      hasMore && last
        ? encodeCursor({ updatedAt: last.updated_at, id: last.id })
        : null,
  };
}

export async function getNotebookEntryDetail(input: {
  workspaceId: string;
  clerkUserId: string;
  role: WorkspaceRole;
  entryId: string;
}): Promise<NotebookEntryDetail | null> {
  const workspaceId = requireWorkspaceScope(input.workspaceId);
  if (!isUuid(input.entryId)) return null;

  const admin = createAdminSupabaseClient();
  const { data: row } = await admin
    .from("notebook_entries")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("id", input.entryId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!row) return null;

  if (
    !canViewNotebookEntry({
      role: input.role,
      visibility: row.visibility,
      authorClerkUserId: row.author_clerk_user_id,
      currentUserId: input.clerkUserId,
    })
  ) {
    return null;
  }

  let linkedEvent: NotebookLinkedEventRef | null = null;
  if (row.citation_event_id) {
    const map = await loadLinkedEventMap({
      workspaceId,
      eventIds: [row.citation_event_id],
    });
    linkedEvent = map.get(row.citation_event_id) ?? null;
  }

  const listItem = serializeNotebookListItem({
    row,
    currentUserId: input.clerkUserId,
    linkedEvent,
  });

  const revisions = await listNotebookRevisions({
    workspaceId,
    entryId: row.id,
    currentUserId: input.clerkUserId,
  });

  const permInput = {
    role: input.role,
    authorClerkUserId: row.author_clerk_user_id,
    currentUserId: input.clerkUserId,
    visibility: row.visibility,
  };

  return {
    entry: {
      ...listItem,
      body: row.body,
      bodyFormat: "plain_text",
    },
    revisions,
    revisionCount: revisions.length,
    linkedEvent,
    permissions: {
      role: input.role,
      canEdit: canEditNotebookEntry(permInput),
      canArchive: canArchiveNotebookEntry(permInput),
      canPin: canPinNotebookEntry(permInput),
      canChangeVisibility: canChangeNotebookVisibility(permInput),
      canRestoreRevision: canRestoreNotebookRevision(permInput),
    },
  };
}

export async function getLinkedNotebookEntriesForEvent(input: {
  workspaceId: string;
  clerkUserId: string;
  eventId: string;
  limit?: number;
}): Promise<NotebookEntryListItem[]> {
  const workspaceId = requireWorkspaceScope(input.workspaceId);
  if (!isUuid(input.eventId)) return [];
  const admin = createAdminSupabaseClient();
  const { data } = await admin
    .from("notebook_entries")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("citation_event_id", input.eventId)
    .is("deleted_at", null)
    .or(visibilityFilterClause(input.clerkUserId))
    .order("pinned", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(input.limit ?? 20);

  return (data ?? []).map((row) =>
    serializeNotebookListItem({
      row: row as NotebookRow,
      currentUserId: input.clerkUserId,
    }),
  );
}
