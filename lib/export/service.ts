import { AuthError } from "@/lib/auth/errors";
import { resolveCurrentAccessState } from "@/lib/auth/access-state";
import { requireWorkspaceRole } from "@/lib/auth";
import { createAdminSupabaseClient, requireWorkspaceScope } from "@/lib/db/admin";
import type { Json } from "@/lib/db/types";
import {
  parseCitationsSnapshot,
  parseProviderMetadata,
} from "@/lib/evidence/provider-visibility";
import { getPlanLimits } from "@/lib/entitlements/plan-entitlements";
import { canAccessHistoryDate } from "@/lib/entitlements/checks";
import { toCsv } from "@/lib/export/csv";
import { ExportError } from "@/lib/export/errors";
import {
  canExportEvidence,
  canExportWorkspaceArchive,
} from "@/lib/export/permissions";
import { assertExportRateLimit } from "@/lib/export/rate-limit";
import {
  escapeMarkdown,
  markdownField,
  markdownHeading,
} from "@/lib/export/markdown";
import { logger } from "@/lib/security/logger";
import type {
  AiSurfaceKey,
  CitationEventType,
  PlanKey,
  WorkspaceRole,
} from "@/types/product";

export const EXPORT_WORKSPACE_VERSION = 1;
export const EXPORT_MAX_EVENTS = 2_000;
export const EXPORT_MAX_NOTEBOOK = 500;

export type ExportDateRange = {
  from?: string | null;
  to?: string | null;
};

export type ExportOptions = {
  dateRange?: ExportDateRange;
  includeWorkspaceNotes?: boolean;
  includePrivateNotes?: boolean;
  includeResponseExcerpts?: boolean;
};

type ExportActor = {
  workspaceId: string;
  clerkUserId: string;
  role: WorkspaceRole;
  planKey: PlanKey;
  workspaceName: string;
};

async function requireExportActor(
  minimum: "member" | "admin",
): Promise<ExportActor> {
  const access = await resolveCurrentAccessState();
  if (
    access.kind !== "workspace_active"
  ) {
    throw new AuthError("FORBIDDEN", "Export is not available.", 403);
  }

  const allowed =
    minimum === "admin"
      ? (["owner", "admin"] as const)
      : (["owner", "admin", "member"] as const);

  const membership = await requireWorkspaceRole(access.workspaceId, allowed);
  if (minimum === "member" && !canExportEvidence(membership.role)) {
    throw new AuthError(
      "INSUFFICIENT_ROLE",
      "Viewers cannot export evidence.",
      403,
    );
  }
  if (minimum === "admin" && !canExportWorkspaceArchive(membership.role)) {
    throw new AuthError(
      "INSUFFICIENT_ROLE",
      "Workspace evidence export requires an owner or admin.",
      403,
    );
  }

  const admin = createAdminSupabaseClient();
  const { data: workspace } = await admin
    .from("workspaces")
    .select("name, plan_key")
    .eq("id", access.workspaceId)
    .single();

  return {
    workspaceId: access.workspaceId,
    clerkUserId: membership.clerkUserId,
    role: membership.role,
    planKey: (workspace?.plan_key as PlanKey) ?? access.planKey,
    workspaceName: (workspace?.name as string) ?? "Workspace",
  };
}

async function assertExportRateLimitForActor(
  actor: ExportActor,
  kind: string,
): Promise<void> {
  const result = await assertExportRateLimit({
    key: `export:${actor.workspaceId}:${actor.clerkUserId}:${kind}`,
    limit: 10,
    windowMs: 60_000,
  });
  if (!result.ok) {
    throw new ExportError(
      "rate_limited",
      `Export rate limit reached. Try again in ${result.retryAfterSeconds}s.`,
      429,
    );
  }
}

function historyCutoffIso(planKey: PlanKey): string | null {
  const historyDays = getPlanLimits(planKey).historyDays;
  if (historyDays === null) return null;
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - historyDays);
  return cutoff.toISOString();
}

function resolveExportBounds(
  range?: ExportDateRange,
  historyCutoff?: string | null,
): { from: string | null; to: string | null } {
  return {
    from: range?.from || historyCutoff || null,
    to: range?.to || null,
  };
}

type EventExportRow = {
  id: string;
  event_type: CitationEventType;
  ai_surface: AiSurfaceKey | null;
  cited_hostname: string | null;
  cited_url: string | null;
  source_title: string | null;
  first_seen_at: string;
  last_seen_at: string;
  occurrence_count: number;
  created_at: string;
  domain_id: string | null;
  monitor_configuration_id: string | null;
  ai_response_id: string;
};

async function loadEvents(
  actor: ExportActor,
  options: ExportOptions = {},
): Promise<{
  events: EventExportRow[];
  prompts: Map<string, string>;
  domains: Map<string, string>;
  memberStates: Map<
    string,
    {
      seen_at: string | null;
      saved_at: string | null;
      archived_at: string | null;
      resolved_at: string | null;
    }
  >;
  tooLarge: boolean;
}> {
  const workspaceId = requireWorkspaceScope(actor.workspaceId);
  const admin = createAdminSupabaseClient();
  const historyCutoff = historyCutoffIso(actor.planKey);

  const bounds = resolveExportBounds(options.dateRange, historyCutoff);
  let query = admin
    .from("citation_events")
    .select(
      "id, event_type, ai_surface, cited_hostname, cited_url, source_title, first_seen_at, last_seen_at, occurrence_count, created_at, domain_id, monitor_configuration_id, ai_response_id",
    )
    .eq("workspace_id", workspaceId)
    .order("last_seen_at", { ascending: false })
    .limit(EXPORT_MAX_EVENTS + 1);

  if (bounds.from) {
    query = query.gte("last_seen_at", bounds.from);
  }
  if (bounds.to) {
    query = query.lte("last_seen_at", bounds.to);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to load citation events for export: ${error.message}`);
  }

  const rows = (data ?? []) as EventExportRow[];
  const tooLarge = rows.length > EXPORT_MAX_EVENTS;
  const events = tooLarge ? rows.slice(0, EXPORT_MAX_EVENTS) : rows;

  const domainIds = [
    ...new Set(events.map((e) => e.domain_id).filter(Boolean)),
  ] as string[];
  const monitorIds = [
    ...new Set(events.map((e) => e.monitor_configuration_id).filter(Boolean)),
  ] as string[];
  const eventIds = events.map((e) => e.id);

  const domains = new Map<string, string>();
  if (domainIds.length > 0) {
    const { data: domainRows } = await admin
      .from("domains")
      .select("id, normalized_hostname")
      .eq("workspace_id", workspaceId)
      .in("id", domainIds);
    for (const row of domainRows ?? []) {
      domains.set(row.id, row.normalized_hostname);
    }
  }

  const prompts = new Map<string, string>();
  if (monitorIds.length > 0) {
    const { data: monitors } = await admin
      .from("monitor_configurations")
      .select("id, monitored_prompt_id")
      .eq("workspace_id", workspaceId)
      .in("id", monitorIds);
    const promptIds = [
      ...new Set(
        (monitors ?? [])
          .map((m) => m.monitored_prompt_id)
          .filter(Boolean),
      ),
    ] as string[];
    const monitorToPrompt = new Map(
      (monitors ?? []).map((m) => [m.id, m.monitored_prompt_id as string]),
    );
    if (promptIds.length > 0) {
      const { data: promptRows } = await admin
        .from("monitored_prompts")
        .select("id, prompt_text")
        .eq("workspace_id", workspaceId)
        .in("id", promptIds);
      const promptText = new Map(
        (promptRows ?? []).map((p) => [p.id, p.prompt_text as string]),
      );
      for (const event of events) {
        const promptId = event.monitor_configuration_id
          ? monitorToPrompt.get(event.monitor_configuration_id)
          : null;
        if (promptId && promptText.has(promptId)) {
          prompts.set(event.id, promptText.get(promptId)!);
        }
      }
    }
  }

  const memberStates = new Map<
    string,
    {
      seen_at: string | null;
      saved_at: string | null;
      archived_at: string | null;
      resolved_at: string | null;
    }
  >();
  if (eventIds.length > 0) {
    const { data: states } = await admin
      .from("citation_event_member_states")
      .select(
        "citation_event_id, seen_at, saved_at, archived_at, resolved_at",
      )
      .eq("workspace_id", workspaceId)
      .eq("clerk_user_id", actor.clerkUserId)
      .in("citation_event_id", eventIds);
    for (const state of states ?? []) {
      memberStates.set(state.citation_event_id, {
        seen_at: state.seen_at,
        saved_at: state.saved_at,
        archived_at: state.archived_at,
        resolved_at: state.resolved_at,
      });
    }
  }

  return { events, prompts, domains, memberStates, tooLarge };
}

function memberStateLabel(
  state:
    | {
        seen_at: string | null;
        saved_at: string | null;
        archived_at: string | null;
        resolved_at: string | null;
      }
    | undefined,
): string {
  if (!state) return "new";
  if (state.resolved_at) return "resolved";
  if (state.archived_at) return "archived";
  if (state.saved_at) return "saved";
  if (state.seen_at) return "seen";
  return "new";
}

export async function exportCitationEventsCsv(
  options: ExportOptions = {},
): Promise<{ filename: string; body: string; contentType: string }> {
  const actor = await requireExportActor("member");
  await assertExportRateLimitForActor(actor, "csv");
  const { events, prompts, domains, memberStates, tooLarge } = await loadEvents(
    actor,
    options,
  );
  if (tooLarge && !options.dateRange?.from) {
    throw new ExportError(
      "too_large",
      "This export is too large to generate at once. Narrow the date range and try again.",
      413,
    );
  }

  const headers = [
    "event_type",
    "ai_surface",
    "prompt",
    "domain",
    "cited_hostname",
    "cited_url",
    "source_title",
    "first_seen_by_cited",
    "last_observed_by_cited",
    "occurrence_count",
    "member_state",
    "created_at",
  ];

  const rows = events.map((event) => [
    event.event_type,
    event.ai_surface,
    prompts.get(event.id) ?? "",
    event.domain_id ? domains.get(event.domain_id) ?? "" : "",
    event.cited_hostname,
    event.cited_url,
    event.source_title,
    event.first_seen_at,
    event.last_seen_at,
    event.occurrence_count,
    memberStateLabel(memberStates.get(event.id)),
    event.created_at,
  ]);

  logger.info("export.citation_events_csv", {
    workspaceId: actor.workspaceId,
    userId: actor.clerkUserId,
    event: "export_csv",
    count: events.length,
  });

  return {
    filename: `cited-citation-events-${actor.workspaceId.slice(0, 8)}.csv`,
    body: toCsv(headers, rows),
    contentType: "text/csv; charset=utf-8",
  };
}

export async function exportCitationEventsJson(
  options: ExportOptions = {},
): Promise<{ filename: string; body: string; contentType: string }> {
  const actor = await requireExportActor("member");
  await assertExportRateLimitForActor(actor, "json");
  const { events, prompts, domains, memberStates, tooLarge } = await loadEvents(
    actor,
    options,
  );
  if (tooLarge && !options.dateRange?.from) {
    throw new ExportError(
      "too_large",
      "This export is too large to generate at once. Narrow the date range and try again.",
      413,
    );
  }

  const payload = {
    workspace_export_version: EXPORT_WORKSPACE_VERSION,
    generated_at: new Date().toISOString(),
    workspace_name: actor.workspaceName,
    provenance:
      "This export reflects monitored results stored in Cited.",
    events: events.map((event) => ({
      event_type: event.event_type,
      ai_surface: event.ai_surface,
      prompt: prompts.get(event.id) ?? null,
      domain: event.domain_id ? domains.get(event.domain_id) ?? null : null,
      cited_hostname: event.cited_hostname,
      cited_url: event.cited_url,
      source_title: event.source_title,
      first_seen_by_cited: event.first_seen_at,
      last_observed_by_cited: event.last_seen_at,
      occurrence_count: event.occurrence_count,
      member_state: memberStateLabel(memberStates.get(event.id)),
      created_at: event.created_at,
    })),
  };

  logger.info("export.citation_events_json", {
    workspaceId: actor.workspaceId,
    userId: actor.clerkUserId,
    event: "export_json",
    count: events.length,
  });

  return {
    filename: `cited-citation-events-${actor.workspaceId.slice(0, 8)}.json`,
    body: `${JSON.stringify(payload, null, 2)}\n`,
    contentType: "application/json; charset=utf-8",
  };
}

export async function exportCitationNoteMarkdown(
  eventId: string,
  options: ExportOptions = {},
): Promise<{ filename: string; body: string; contentType: string }> {
  const actor = await requireExportActor("member");
  await assertExportRateLimitForActor(actor, "note-md");
  const workspaceId = requireWorkspaceScope(actor.workspaceId);
  const admin = createAdminSupabaseClient();

  const { data: event, error } = await admin
    .from("citation_events")
    .select(
      "id, event_type, ai_surface, cited_hostname, cited_url, source_title, source_snippet, first_seen_at, last_seen_at, occurrence_count, domain_id, monitor_configuration_id, ai_response_id, workspace_id",
    )
    .eq("id", eventId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load citation note: ${error.message}`);
  }
  if (!event || event.workspace_id !== workspaceId) {
    throw new ExportError("not_found", "Citation note not found.", 404);
  }

  const history = canAccessHistoryDate(
    {
      workspaceId,
      planKey: actor.planKey,
      status: "active",
      billingStatus: "active",
    },
    event.last_seen_at,
  );
  if (!history.allowed) {
    throw new ExportError("forbidden", history.safeMessage, 403);
  }

  let promptText: string | null = null;
  if (event.monitor_configuration_id) {
    const { data: monitor } = await admin
      .from("monitor_configurations")
      .select("monitored_prompt_id")
      .eq("id", event.monitor_configuration_id)
      .eq("workspace_id", workspaceId)
      .maybeSingle();
    if (monitor?.monitored_prompt_id) {
      const { data: prompt } = await admin
        .from("monitored_prompts")
        .select("prompt_text")
        .eq("id", monitor.monitored_prompt_id)
        .eq("workspace_id", workspaceId)
        .maybeSingle();
      promptText = (prompt?.prompt_text as string) ?? null;
    }
  }

  let domainHostname: string | null = null;
  if (event.domain_id) {
    const { data: domain } = await admin
      .from("domains")
      .select("normalized_hostname")
      .eq("id", event.domain_id)
      .eq("workspace_id", workspaceId)
      .maybeSingle();
    domainHostname = (domain?.normalized_hostname as string) ?? null;
  }

  let responseExcerpt: string | null = null;
  let allSourcesMarkdown = "No sources listed.";
  let scanInsightsMarkdown = "";
  if (options.includeResponseExcerpts !== false) {
    const { data: response } = await admin
      .from("ai_responses")
      .select("response_text, citations_snapshot, provider_metadata")
      .eq("id", event.ai_response_id)
      .eq("workspace_id", workspaceId)
      .maybeSingle();
    const text = (response?.response_text as string) ?? "";
    responseExcerpt = text.slice(0, 4_000);

    const citations = parseCitationsSnapshot(
      response?.citations_snapshot as Json | undefined,
    );
    if (citations.length > 0) {
      allSourcesMarkdown = citations
        .map((citation, index) => {
          const position = citation.position ?? index + 1;
          const label = [citation.title, citation.hostname, citation.url]
            .filter(Boolean)
            .join(" | ");
          const snippet = citation.snippet
            ? `\n${escapeMarkdown(citation.snippet)}`
            : "";
          return `${position}. ${escapeMarkdown(label || "Source")}${snippet}`;
        })
        .join("\n");
    }

    const metadata = parseProviderMetadata(
      response?.provider_metadata as Json | undefined,
    );
    if (metadata) {
      const insightParts = [
        metadata.missingAiOverview ? "No AI Overview returned" : null,
        typeof metadata.inputTokens === "number"
          ? `Input tokens: ${metadata.inputTokens}`
          : null,
        typeof metadata.outputTokens === "number"
          ? `Output tokens: ${metadata.outputTokens}`
          : null,
        metadata.webSearch ? "Web search used" : null,
        typeof metadata.providerCostUsd === "number"
          ? `Provider cost: $${metadata.providerCostUsd.toFixed(4)}`
          : null,
      ].filter(Boolean);
      if (insightParts.length > 0) {
        scanInsightsMarkdown = insightParts.join("\n");
      }
    }
  }

  const includeWorkspaceNotes = options.includeWorkspaceNotes !== false;
  const includePrivateNotes = options.includePrivateNotes === true;
  const notes: Array<{ title: string; body: string; visibility: string }> = [];
  if (includeWorkspaceNotes || includePrivateNotes) {
    const { data: noteRows } = await admin
      .from("notebook_entries")
      .select("title, body, visibility, author_clerk_user_id, deleted_at")
      .eq("workspace_id", workspaceId)
      .eq("citation_event_id", event.id)
      .is("deleted_at", null)
      .limit(50);
    for (const note of noteRows ?? []) {
      if (note.visibility === "workspace" && includeWorkspaceNotes) {
        notes.push({
          title: note.title,
          body: note.body,
          visibility: "workspace",
        });
      } else if (
        note.visibility === "private" &&
        includePrivateNotes &&
        note.author_clerk_user_id === actor.clerkUserId
      ) {
        notes.push({
          title: note.title,
          body: note.body,
          visibility: "private",
        });
      }
    }
  }

  const lines = [
    markdownHeading(1, "Citation Note"),
    "",
    markdownField("Event type", event.event_type),
    markdownField("AI surface", event.ai_surface),
    markdownField("Prompt", promptText),
    markdownField("Domain", domainHostname),
    markdownField("Source", event.source_title ?? event.cited_url),
    markdownField("First seen by Cited", event.first_seen_at),
    markdownField("Last observed by Cited", event.last_seen_at),
    markdownField("Occurrence count", String(event.occurrence_count)),
    "",
    markdownHeading(2, "Evidence"),
    escapeMarkdown(responseExcerpt ?? event.source_snippet ?? "No excerpt included."),
    "",
    markdownHeading(2, "Matched source"),
    escapeMarkdown(
      [event.cited_hostname, event.cited_url, event.source_title]
        .filter(Boolean)
        .join(" | ") || "No sources listed.",
    ),
    "",
    markdownHeading(2, "All sources in answer"),
    allSourcesMarkdown,
    "",
    ...(scanInsightsMarkdown
      ? [
          markdownHeading(2, "Scan insights"),
          escapeMarkdown(scanInsightsMarkdown),
          "",
        ]
      : []),
    markdownHeading(2, "Notes"),
    notes.length === 0
      ? "No linked notes included."
      : notes
          .map(
            (note) =>
              `### ${escapeMarkdown(note.title)} (${note.visibility})\n\n${escapeMarkdown(note.body)}`,
          )
          .join("\n\n"),
    "",
    markdownHeading(2, "Provenance"),
    "Captured from a monitored result in Cited.",
    "",
  ];

  logger.info("export.citation_note_md", {
    workspaceId: actor.workspaceId,
    userId: actor.clerkUserId,
    event: "export_note_md",
  });

  return {
    filename: `cited-note-${event.id.slice(0, 8)}.md`,
    body: `${lines.join("\n")}\n`,
    contentType: "text/markdown; charset=utf-8",
  };
}

export async function exportNotebookMarkdown(
  options: ExportOptions = {},
): Promise<{ filename: string; body: string; contentType: string }> {
  const actor = await requireExportActor("member");
  await assertExportRateLimitForActor(actor, "notebook-md");
  const workspaceId = requireWorkspaceScope(actor.workspaceId);
  const admin = createAdminSupabaseClient();

  const { data, error } = await admin
    .from("notebook_entries")
    .select(
      "id, title, body, visibility, author_clerk_user_id, citation_event_id, pinned, updated_at, deleted_at",
    )
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(EXPORT_MAX_NOTEBOOK + 1);

  if (error) {
    throw new Error(`Failed to load notebook for export: ${error.message}`);
  }

  const rows = data ?? [];
  if (rows.length > EXPORT_MAX_NOTEBOOK) {
    throw new ExportError(
      "too_large",
      "This export is too large to generate at once. Narrow the date range and try again.",
      413,
    );
  }

  const includeWorkspaceNotes = options.includeWorkspaceNotes !== false;
  const includePrivateNotes = options.includePrivateNotes === true;

  const allowed = rows.filter((row) => {
    if (row.visibility === "workspace") return includeWorkspaceNotes;
    if (row.visibility === "private") {
      return (
        includePrivateNotes && row.author_clerk_user_id === actor.clerkUserId
      );
    }
    return false;
  });

  const lines = [
    markdownHeading(1, "Cited Notebook Export"),
    "",
    markdownField("Workspace", actor.workspaceName),
    markdownField("Generated at", new Date().toISOString()),
    "",
    "This export reflects notebook context stored in Cited.",
    "",
  ];

  for (const note of allowed) {
    lines.push(markdownHeading(2, note.title));
    lines.push(markdownField("Visibility", note.visibility));
    lines.push(markdownField("Updated", note.updated_at));
    if (note.citation_event_id) {
      lines.push(markdownField("Linked event", note.citation_event_id.slice(0, 8)));
    }
    lines.push("");
    lines.push(escapeMarkdown(note.body));
    lines.push("");
  }

  if (allowed.length === 0) {
    lines.push("No notebook entries included.");
  }

  logger.info("export.notebook_md", {
    workspaceId: actor.workspaceId,
    userId: actor.clerkUserId,
    event: "export_notebook_md",
    count: allowed.length,
  });

  return {
    filename: `cited-notebook-${actor.workspaceId.slice(0, 8)}.md`,
    body: `${lines.join("\n")}\n`,
    contentType: "text/markdown; charset=utf-8",
  };
}

export async function exportWorkspaceEvidenceJson(
  options: ExportOptions = {},
): Promise<{ filename: string; body: string; contentType: string }> {
  const actor = await requireExportActor("admin");
  await assertExportRateLimitForActor(actor, "workspace-json");
  const workspaceId = requireWorkspaceScope(actor.workspaceId);
  const admin = createAdminSupabaseClient();
  const { events, prompts, domains, tooLarge } = await loadEvents(
    actor,
    options,
  );
  if (tooLarge && !options.dateRange?.from) {
    throw new ExportError(
      "too_large",
      "This export is too large to generate at once. Narrow the date range and try again.",
      413,
    );
  }

  const [{ data: monitors }, { data: domainRows }, { data: notebookRows }, { data: annotations }] =
    await Promise.all([
      admin
        .from("monitor_configurations")
        .select("id, ai_surface, activation_status, enabled, monitored_prompt_id")
        .eq("workspace_id", workspaceId)
        .limit(500),
      admin
        .from("domains")
        .select("id, normalized_hostname, verification_status, verified_at")
        .eq("workspace_id", workspaceId)
        .limit(50),
      admin
        .from("notebook_entries")
        .select(
          "id, title, body, visibility, author_clerk_user_id, citation_event_id, updated_at, deleted_at",
        )
        .eq("workspace_id", workspaceId)
        .is("deleted_at", null)
        .limit(EXPORT_MAX_NOTEBOOK),
      admin
        .from("citation_annotations")
        .select(
          "id, citation_event_id, body, visibility, author_clerk_user_id, created_at, deleted_at",
        )
        .eq("workspace_id", workspaceId)
        .is("deleted_at", null)
        .limit(1_000),
    ]);

  const includeWorkspaceNotes = options.includeWorkspaceNotes !== false;
  const includePrivateNotes = options.includePrivateNotes === true;

  const notebook_entries = (notebookRows ?? [])
    .filter((row) => {
      if (row.visibility === "workspace") return includeWorkspaceNotes;
      if (row.visibility === "private") {
        return (
          includePrivateNotes && row.author_clerk_user_id === actor.clerkUserId
        );
      }
      return false;
    })
    .map((row) => ({
      id: row.id,
      title: row.title,
      body: row.body,
      visibility: row.visibility,
      citation_event_id: row.citation_event_id,
      updated_at: row.updated_at,
    }));

  const annotation_entries = (annotations ?? [])
    .filter((row) => {
      if (row.visibility === "workspace") return includeWorkspaceNotes;
      if (row.visibility === "private") {
        return (
          includePrivateNotes && row.author_clerk_user_id === actor.clerkUserId
        );
      }
      return false;
    })
    .map((row) => ({
      id: row.id,
      citation_event_id: row.citation_event_id,
      body: row.body,
      visibility: row.visibility,
      created_at: row.created_at,
    }));

  const payload = {
    workspace_export_version: EXPORT_WORKSPACE_VERSION,
    generated_at: new Date().toISOString(),
    workspace_name: actor.workspaceName,
    provenance:
      "This export reflects monitored results stored in Cited.",
    events: events.map((event) => ({
      event_type: event.event_type,
      ai_surface: event.ai_surface,
      prompt: prompts.get(event.id) ?? null,
      domain: event.domain_id ? domains.get(event.domain_id) ?? null : null,
      cited_hostname: event.cited_hostname,
      cited_url: event.cited_url,
      source_title: event.source_title,
      first_seen_by_cited: event.first_seen_at,
      last_observed_by_cited: event.last_seen_at,
      occurrence_count: event.occurrence_count,
      created_at: event.created_at,
    })),
    monitors: (monitors ?? []).map((monitor) => ({
      id: monitor.id,
      ai_surface: monitor.ai_surface,
      activation_status: monitor.activation_status,
      enabled: monitor.enabled,
    })),
    domains: (domainRows ?? []).map((domain) => ({
      hostname: domain.normalized_hostname,
      verification_status: domain.verification_status,
      verified_at: domain.verified_at,
    })),
    notebook_entries,
    annotations: annotation_entries,
  };

  logger.info("export.workspace_evidence_json", {
    workspaceId: actor.workspaceId,
    userId: actor.clerkUserId,
    event: "export_workspace_json",
    count: events.length,
  });

  return {
    filename: `cited-workspace-evidence-${actor.workspaceId.slice(0, 8)}.json`,
    body: `${JSON.stringify(payload, null, 2)}\n`,
    contentType: "application/json; charset=utf-8",
  };
}

export function exportResponseHeaders(input: {
  filename: string;
  contentType: string;
}): HeadersInit {
  return {
    "Content-Type": input.contentType,
    "Content-Disposition": `attachment; filename="${input.filename}"`,
    "Cache-Control": "no-store",
  };
}
