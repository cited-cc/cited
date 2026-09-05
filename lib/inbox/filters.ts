/**
 * Inbox URL query parsing and serialization.
 * URL is the source of truth for shareable views. Malformed params fall back safely.
 */

import {
  AI_SURFACE_KEYS,
  type AiSurfaceKey,
  type CitationEventType,
} from "@/types/product";
import {
  DEFAULT_INBOX_FILTERS,
  INBOX_DATE_RANGES,
  INBOX_EVENT_TYPE_FILTERS,
  INBOX_MEMBER_STATE_FILTERS,
  INBOX_SEARCH_MAX_LENGTH,
  INBOX_VIEWS,
  type InboxDateRange,
  type InboxFilters,
  type InboxMemberStateFilter,
  type InboxView,
} from "@/lib/inbox/types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const CONTROL_CHARS_RE = /[\u0000-\u001f\u007f]/g;

function firstParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function asList(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  const raw = Array.isArray(value) ? value.join(",") : value;
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function isInboxView(value: string): value is InboxView {
  return (INBOX_VIEWS as readonly string[]).includes(value);
}

function isDateRange(value: string): value is InboxDateRange {
  return (INBOX_DATE_RANGES as readonly string[]).includes(value);
}

function isEventType(value: string): value is CitationEventType {
  return (INBOX_EVENT_TYPE_FILTERS as readonly string[]).includes(value);
}

function isSurface(value: string): value is AiSurfaceKey {
  return (AI_SURFACE_KEYS as readonly string[]).includes(value);
}

function isMemberState(value: string): value is InboxMemberStateFilter {
  return (INBOX_MEMBER_STATE_FILTERS as readonly string[]).includes(value);
}

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function parseIsoDate(value: string | undefined): string | null {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime())) return null;
  // Reject unreasonable bounds (before 2020 or more than 1 day in the future).
  const min = Date.UTC(2020, 0, 1);
  const max = Date.now() + 24 * 60 * 60 * 1000;
  if (date.getTime() < min || date.getTime() > max) return null;
  return value;
}

export function normalizeInboxSearch(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw
    .replace(CONTROL_CHARS_RE, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, INBOX_SEARCH_MAX_LENGTH);
  return cleaned.length > 0 ? cleaned : null;
}

export function parseInboxSearchParams(
  params: Record<string, string | string[] | undefined>,
): InboxFilters {
  const viewRaw = firstParam(params.view)?.toLowerCase() ?? "all";
  const view = isInboxView(viewRaw) ? viewRaw : "all";

  const eventTypes = asList(params.type)
    .map((v) => v.toLowerCase())
    .filter(isEventType);

  const surfaces = asList(params.surface)
    .map((v) => v.toLowerCase())
    .filter(isSurface);

  const domainRaw = firstParam(params.domain);
  const domainId =
    domainRaw && isUuid(domainRaw) ? domainRaw : null;

  const promptRaw = firstParam(params.prompt);
  const promptId =
    promptRaw && isUuid(promptRaw) ? promptRaw : null;

  const rangeRaw = firstParam(params.range)?.toLowerCase() ?? "all";
  let range: InboxDateRange = isDateRange(rangeRaw) ? rangeRaw : "all";

  let customFrom = parseIsoDate(firstParam(params.from));
  let customTo = parseIsoDate(firstParam(params.to));

  if (range === "custom") {
    if (!customFrom || !customTo) {
      range = "all";
      customFrom = null;
      customTo = null;
    } else if (customFrom > customTo) {
      range = "all";
      customFrom = null;
      customTo = null;
    }
  } else {
    customFrom = null;
    customTo = null;
  }

  const memberStates = asList(params.state)
    .map((v) => v.toLowerCase())
    .filter(isMemberState);

  const hasSourceRaw = firstParam(params.has_source)?.toLowerCase();
  let hasSourceCitation: boolean | null = null;
  if (hasSourceRaw === "1" || hasSourceRaw === "true") {
    hasSourceCitation = true;
  } else if (hasSourceRaw === "0" || hasSourceRaw === "false") {
    hasSourceCitation = false;
  }

  const search = normalizeInboxSearch(firstParam(params.q));

  const selectedRaw = firstParam(params.event);
  const selectedEventId =
    selectedRaw && isUuid(selectedRaw) ? selectedRaw : null;

  const cursorRaw = firstParam(params.cursor);
  const cursor =
    cursorRaw && cursorRaw.length > 0 && cursorRaw.length <= 512
      ? cursorRaw
      : null;

  return {
    view,
    eventTypes,
    surfaces,
    domainId,
    promptId,
    range,
    customFrom,
    customTo,
    memberStates,
    hasSourceCitation,
    search,
    selectedEventId,
    cursor,
  };
}

export function serializeInboxSearchParams(
  filters: InboxFilters,
  options?: { includeCursor?: boolean; includeEvent?: boolean },
): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.view !== "all") {
    params.set("view", filters.view);
  }
  if (filters.eventTypes.length > 0) {
    params.set("type", filters.eventTypes.join(","));
  }
  if (filters.surfaces.length > 0) {
    params.set("surface", filters.surfaces.join(","));
  }
  if (filters.domainId) {
    params.set("domain", filters.domainId);
  }
  if (filters.promptId) {
    params.set("prompt", filters.promptId);
  }
  if (filters.range !== "all") {
    params.set("range", filters.range);
  }
  if (filters.range === "custom" && filters.customFrom && filters.customTo) {
    params.set("from", filters.customFrom);
    params.set("to", filters.customTo);
  }
  if (filters.memberStates.length > 0) {
    params.set("state", filters.memberStates.join(","));
  }
  if (filters.hasSourceCitation === true) {
    params.set("has_source", "1");
  } else if (filters.hasSourceCitation === false) {
    params.set("has_source", "0");
  }
  if (filters.search) {
    params.set("q", filters.search);
  }
  if (options?.includeEvent !== false && filters.selectedEventId) {
    params.set("event", filters.selectedEventId);
  }
  if (options?.includeCursor && filters.cursor) {
    params.set("cursor", filters.cursor);
  }

  return params;
}

export function buildInboxHref(
  filters: InboxFilters,
  overrides?: Partial<InboxFilters>,
): string {
  const next: InboxFilters = {
    ...filters,
    ...overrides,
    cursor: overrides && "cursor" in overrides ? overrides.cursor ?? null : null,
  };
  const params = serializeInboxSearchParams(next, {
    includeCursor: Boolean(next.cursor),
  });
  const qs = params.toString();
  return qs ? `/app/inbox?${qs}` : "/app/inbox";
}

export function countActiveAdvancedFilters(filters: InboxFilters): number {
  let count = 0;
  if (filters.eventTypes.length > 0) count += 1;
  if (filters.surfaces.length > 0) count += 1;
  if (filters.domainId) count += 1;
  if (filters.promptId) count += 1;
  if (filters.range !== "all") count += 1;
  if (filters.memberStates.length > 0) count += 1;
  if (filters.hasSourceCitation !== null) count += 1;
  return count;
}

export function clearAdvancedFilters(filters: InboxFilters): InboxFilters {
  return {
    ...DEFAULT_INBOX_FILTERS,
    view: filters.view,
    search: filters.search,
    selectedEventId: filters.selectedEventId,
  };
}

export function resolveDateRangeBounds(filters: InboxFilters): {
  from: string | null;
  to: string | null;
} {
  const now = new Date();
  const endOfToday = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      23,
      59,
      59,
      999,
    ),
  );

  switch (filters.range) {
    case "all":
      return { from: null, to: null };
    case "today": {
      const start = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate(),
          0,
          0,
          0,
          0,
        ),
      );
      return { from: start.toISOString(), to: endOfToday.toISOString() };
    }
    case "7d": {
      const start = new Date(endOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { from: start.toISOString(), to: endOfToday.toISOString() };
    }
    case "30d": {
      const start = new Date(endOfToday.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { from: start.toISOString(), to: endOfToday.toISOString() };
    }
    case "custom": {
      if (!filters.customFrom || !filters.customTo) {
        return { from: null, to: null };
      }
      return {
        from: `${filters.customFrom}T00:00:00.000Z`,
        to: `${filters.customTo}T23:59:59.999Z`,
      };
    }
    default: {
      const _exhaustive: never = filters.range;
      return _exhaustive;
    }
  }
}
