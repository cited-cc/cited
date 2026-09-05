/**
 * Server-side Citation Inbox queries.
 * Always scoped to an authorized workspace + clerk user after access checks.
 */

import { createAdminSupabaseClient, requireWorkspaceScope } from "@/lib/db/admin";
import type { Tables } from "@/lib/db/types";
import { resolveDateRangeBounds } from "@/lib/inbox/filters";
import { buildNextCursor, decodeInboxCursor } from "@/lib/inbox/pagination";
import {
  buildResponseExcerpt,
  serializeEvidenceItem,
  serializeInboxEventListItem,
  serializeOccurrenceItem,
} from "@/lib/inbox/serializers";
import {
  INBOX_OCCURRENCE_PREVIEW_LIMIT,
  INBOX_PAGE_SIZE,
  type InboxEventListItem,
  type InboxEventPreview,
  type InboxFilterOptions,
  type InboxFilters,
  type InboxListResult,
  type InboxTabCounts,
  type InboxWorkspaceContext,
} from "@/lib/inbox/types";
import type { AiSurfaceKey, WorkspaceRole } from "@/types/product";

type CitationEventRow = Tables<"citation_events">;

type InboxListRpcRow = CitationEventRow & {
  member_seen_at: string | null;
  member_saved_at: string | null;
  member_archived_at: string | null;
  member_resolved_at: string | null;
  prompt_id: string | null;
  prompt_text: string | null;
  domain_hostname: string | null;
};

function toListItem(row: InboxListRpcRow): InboxEventListItem {
  return serializeInboxEventListItem({
    event: row,
    memberState: {
      id: "",
      workspace_id: row.workspace_id,
      citation_event_id: row.id,
      clerk_user_id: "",
      seen_at: row.member_seen_at,
      saved_at: row.member_saved_at,
      archived_at: row.member_archived_at,
      resolved_at: row.member_resolved_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
    },
    promptId: row.prompt_id,
    promptText: row.prompt_text,
    domainHostname: row.domain_hostname,
  });
}

export async function getInboxWorkspaceContext(input: {
  workspaceId: string;
  clerkUserId: string;
  role: WorkspaceRole;
}): Promise<InboxWorkspaceContext> {
  const workspaceId = requireWorkspaceScope(input.workspaceId);
  const admin = createAdminSupabaseClient();

  const [{ count: activeMonitorCount }, { count: totalEventCount }] =
    await Promise.all([
      admin
        .from("monitor_configurations")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .eq("activation_status", "active")
        .eq("enabled", true),
      admin
        .from("citation_events")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId),
    ]);

  return {
    workspaceId,
    clerkUserId: input.clerkUserId,
    role: input.role,
    hasActiveMonitors: (activeMonitorCount ?? 0) > 0,
    totalEventCount: totalEventCount ?? 0,
  };
}

export async function getInboxFilterOptions(
  workspaceId: string,
): Promise<InboxFilterOptions> {
  const scoped = requireWorkspaceScope(workspaceId);
  const admin = createAdminSupabaseClient();

  const [{ data: domains }, { data: prompts }, { data: surfaceRows }] =
    await Promise.all([
      admin
        .from("domains")
        .select("id, hostname")
        .eq("workspace_id", scoped)
        .order("hostname", { ascending: true }),
      admin
        .from("monitored_prompts")
        .select("id, name, prompt_text")
        .eq("workspace_id", scoped)
        .order("created_at", { ascending: true }),
      admin
        .from("citation_events")
        .select("ai_surface")
        .eq("workspace_id", scoped)
        .not("ai_surface", "is", null)
        .limit(200),
    ]);

  const surfaces = Array.from(
    new Set(
      (surfaceRows ?? [])
        .map((row) => row.ai_surface as AiSurfaceKey | null)
        .filter((s): s is AiSurfaceKey => Boolean(s)),
    ),
  );

  return {
    domains: (domains ?? []).map((d) => ({
      id: d.id as string,
      hostname: d.hostname as string,
    })),
    prompts: (prompts ?? []).map((p) => ({
      id: p.id as string,
      name: p.name as string,
      promptText: p.prompt_text as string,
    })),
    surfaces,
  };
}

export async function getInboxTabCounts(input: {
  workspaceId: string;
  clerkUserId: string;
}): Promise<InboxTabCounts> {
  const workspaceId = requireWorkspaceScope(input.workspaceId);
  const admin = createAdminSupabaseClient();

  const { data, error } = await admin.rpc("inbox_tab_counts", {
    p_workspace_id: workspaceId,
    p_clerk_user_id: input.clerkUserId,
  });

  if (error) {
    throw new Error(`Failed to load inbox counts: ${error.message}`);
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    return {
      all: 0,
      new: 0,
      citations: 0,
      mentions: 0,
      recommendations: 0,
      opportunities: 0,
      saved: 0,
      archived: 0,
    };
  }

  return {
    all: Number(row.all_count ?? 0),
    new: Number(row.new_count ?? 0),
    citations: Number(row.citations_count ?? 0),
    mentions: Number(row.mentions_count ?? 0),
    recommendations: Number(row.recommendations_count ?? 0),
    opportunities: Number(row.opportunities_count ?? 0),
    saved: Number(row.saved_count ?? 0),
    archived: Number(row.archived_count ?? 0),
  };
}

export async function listInboxEvents(input: {
  workspaceId: string;
  clerkUserId: string;
  filters: InboxFilters;
}): Promise<InboxListResult> {
  const workspaceId = requireWorkspaceScope(input.workspaceId);
  const admin = createAdminSupabaseClient();
  const bounds = resolveDateRangeBounds(input.filters);
  const cursor = decodeInboxCursor(input.filters.cursor);

  const { data, error } = await admin.rpc("inbox_list_events", {
    p_workspace_id: workspaceId,
    p_clerk_user_id: input.clerkUserId,
    p_view: input.filters.view,
    p_event_types:
      input.filters.eventTypes.length > 0 ? input.filters.eventTypes : null,
    p_surfaces:
      input.filters.surfaces.length > 0 ? input.filters.surfaces : null,
    p_domain_id: input.filters.domainId,
    p_prompt_id: input.filters.promptId,
    p_from: bounds.from,
    p_to: bounds.to,
    p_member_states:
      input.filters.memberStates.length > 0
        ? input.filters.memberStates
        : null,
    p_has_source: input.filters.hasSourceCitation,
    p_search: input.filters.search,
    p_cursor_last_seen_at: cursor?.lastSeenAt ?? null,
    p_cursor_id: cursor?.id ?? null,
    p_limit: INBOX_PAGE_SIZE,
  });

  if (error) {
    throw new Error(`Failed to load inbox events: ${error.message}`);
  }

  const rows = (data ?? []) as InboxListRpcRow[];
  const items = rows.map(toListItem);
  const page = buildNextCursor(items);

  return {
    items,
    nextCursor: page.nextCursor,
    hasMore: page.hasMore,
  };
}

export async function getInboxEventPreview(input: {
  workspaceId: string;
  clerkUserId: string;
  eventId: string;
}): Promise<InboxEventPreview | null> {
  const workspaceId = requireWorkspaceScope(input.workspaceId);
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

  const [
    { data: memberState },
    { data: evidenceRows },
    { data: occurrenceRows },
    { data: aiResponse },
    { data: monitorConfig },
    { data: domain },
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
      .limit(20),
    admin
      .from("citation_event_occurrences")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("citation_event_id", input.eventId)
      .order("observed_at", { ascending: false })
      .limit(INBOX_OCCURRENCE_PREVIEW_LIMIT),
    admin
      .from("ai_responses")
      .select("id, prompt_text_snapshot, response_text, ai_surface")
      .eq("workspace_id", workspaceId)
      .eq("id", event.ai_response_id)
      .maybeSingle(),
    event.monitor_configuration_id
      ? admin
          .from("monitor_configurations")
          .select("id, monitored_prompt_id")
          .eq("workspace_id", workspaceId)
          .eq("id", event.monitor_configuration_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    event.domain_id
      ? admin
          .from("domains")
          .select("id, hostname")
          .eq("workspace_id", workspaceId)
          .eq("id", event.domain_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
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

  const listItem = serializeInboxEventListItem({
    event,
    memberState,
    promptId,
    promptText,
    domainHostname: (domain?.hostname as string | undefined) ?? null,
  });

  const evidence = (evidenceRows ?? []).map(serializeEvidenceItem);
  const recentOccurrences = (occurrenceRows ?? []).map((row) =>
    serializeOccurrenceItem(
      row,
      (event.ai_surface as AiSurfaceKey | null) ?? null,
    ),
  );

  // Prefer response_excerpt evidence; otherwise a capped response excerpt.
  const excerptEvidence = evidence.find(
    (item) => item.type === "response_excerpt" && item.text,
  );
  const responseExcerpt =
    excerptEvidence?.text ??
    buildResponseExcerpt(aiResponse?.response_text as string | undefined);

  return {
    event: listItem,
    responseExcerpt,
    evidence,
    recentOccurrences,
  };
}

export async function assertEventInWorkspace(input: {
  workspaceId: string;
  eventId: string;
}): Promise<boolean> {
  const workspaceId = requireWorkspaceScope(input.workspaceId);
  const admin = createAdminSupabaseClient();
  const { data } = await admin
    .from("citation_events")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("id", input.eventId)
    .maybeSingle();
  return Boolean(data);
}

export async function assertEventsInWorkspace(input: {
  workspaceId: string;
  eventIds: string[];
}): Promise<string[]> {
  const workspaceId = requireWorkspaceScope(input.workspaceId);
  if (input.eventIds.length === 0) return [];
  const admin = createAdminSupabaseClient();
  const { data } = await admin
    .from("citation_events")
    .select("id")
    .eq("workspace_id", workspaceId)
    .in("id", input.eventIds);
  return (data ?? []).map((row) => row.id as string);
}
