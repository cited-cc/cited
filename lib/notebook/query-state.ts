/**
 * Notebook URL query-state parsing and serialization.
 */

import {
  DEFAULT_NOTEBOOK_FILTERS,
  NOTEBOOK_DATE_RANGES,
  NOTEBOOK_SEARCH_MAX_LENGTH,
  NOTEBOOK_VIEWS,
  isUuid,
  type NotebookDateRange,
  type NotebookFilters,
  type NotebookView,
} from "@/lib/notebook/types";
import { AI_SURFACE_KEYS, CITATION_EVENT_TYPES } from "@/types/product";
import type {
  AiSurfaceKey,
  CitationEventType,
  NotebookVisibility,
} from "@/types/product";

function first(
  value: string | string[] | undefined,
): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export function normalizeNotebookSearch(raw: string | null): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(/\s+/g, " ").trim();
  if (!cleaned) return null;
  return cleaned.slice(0, NOTEBOOK_SEARCH_MAX_LENGTH);
}

export function parseNotebookSearchParams(
  params: Record<string, string | string[] | undefined>,
): NotebookFilters {
  const viewRaw = first(params.view);
  const view: NotebookView = NOTEBOOK_VIEWS.includes(viewRaw as NotebookView)
    ? (viewRaw as NotebookView)
    : "all";

  const visibilityRaw = first(params.visibility);
  const visibility: NotebookVisibility | null =
    visibilityRaw === "workspace" || visibilityRaw === "private"
      ? visibilityRaw
      : null;

  const eventTypeRaw = first(params.type);
  const eventType = CITATION_EVENT_TYPES.includes(
    eventTypeRaw as CitationEventType,
  )
    ? (eventTypeRaw as CitationEventType)
    : null;

  const surfaceRaw = first(params.surface);
  const surface = AI_SURFACE_KEYS.includes(surfaceRaw as AiSurfaceKey)
    ? (surfaceRaw as AiSurfaceKey)
    : null;

  const authorRaw = first(params.author);
  const authorId = authorRaw && isUuid(authorRaw) ? authorRaw : null;

  const rangeRaw = first(params.range);
  const range: NotebookDateRange = NOTEBOOK_DATE_RANGES.includes(
    rangeRaw as NotebookDateRange,
  )
    ? (rangeRaw as NotebookDateRange)
    : "all";

  const customFrom = first(params.from);
  const customTo = first(params.to);
  const search = normalizeNotebookSearch(first(params.q));
  const cursor = first(params.cursor);

  return {
    view,
    visibility,
    linkedOnly: view === "linked" ? true : null,
    eventType,
    surface,
    authorId,
    range,
    customFrom: range === "custom" ? customFrom : null,
    customTo: range === "custom" ? customTo : null,
    search,
    cursor,
  };
}

export function serializeNotebookSearchParams(
  filters: NotebookFilters,
): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.view !== "all") params.set("view", filters.view);
  if (filters.visibility) params.set("visibility", filters.visibility);
  if (filters.eventType) params.set("type", filters.eventType);
  if (filters.surface) params.set("surface", filters.surface);
  if (filters.authorId) params.set("author", filters.authorId);
  if (filters.range !== "all") params.set("range", filters.range);
  if (filters.range === "custom") {
    if (filters.customFrom) params.set("from", filters.customFrom);
    if (filters.customTo) params.set("to", filters.customTo);
  }
  if (filters.search) params.set("q", filters.search);
  if (filters.cursor) params.set("cursor", filters.cursor);
  return params;
}

export function buildNotebookHref(
  filters: NotebookFilters,
  overrides: Partial<NotebookFilters> = {},
): string {
  const next = { ...filters, ...overrides };
  const params = serializeNotebookSearchParams(next);
  const qs = params.toString();
  return qs ? `/app/notebook?${qs}` : "/app/notebook";
}

export function resolveNotebookDateBounds(filters: NotebookFilters): {
  from: string | null;
  to: string | null;
} {
  const now = new Date();
  switch (filters.range) {
    case "all":
      return { from: null, to: null };
    case "7d": {
      const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { from: from.toISOString(), to: null };
    }
    case "30d": {
      const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { from: from.toISOString(), to: null };
    }
    case "custom": {
      const from =
        filters.customFrom && !Number.isNaN(Date.parse(filters.customFrom))
          ? new Date(filters.customFrom).toISOString()
          : null;
      const to =
        filters.customTo && !Number.isNaN(Date.parse(filters.customTo))
          ? new Date(filters.customTo).toISOString()
          : null;
      return { from, to };
    }
    default: {
      const _exhaustive: never = filters.range;
      return _exhaustive;
    }
  }
}

export function clearNotebookFilters(
  filters: NotebookFilters,
): NotebookFilters {
  return {
    ...DEFAULT_NOTEBOOK_FILTERS,
    view: filters.view,
    search: filters.search,
  };
}

export function countActiveNotebookFilters(filters: NotebookFilters): number {
  let count = 0;
  if (filters.visibility) count += 1;
  if (filters.eventType) count += 1;
  if (filters.surface) count += 1;
  if (filters.authorId) count += 1;
  if (filters.range !== "all") count += 1;
  return count;
}
