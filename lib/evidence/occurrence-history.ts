/**
 * Occurrence history helpers: ordering, selection, pagination cursors.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

import type { Tables } from "@/lib/db/types";
import {
  EVIDENCE_OCCURRENCE_PAGE_SIZE,
  isUuid,
} from "@/lib/evidence/types";

type OccurrenceRow = Tables<"citation_event_occurrences">;

function cursorSecret(): string {
  return (
    process.env.INBOX_CURSOR_SECRET ||
    process.env.CITED_CURSOR_SECRET ||
    "cited-dev-cursor-secret"
  );
}

export type OccurrenceCursor = {
  observedAt: string;
  id: string;
};

export function encodeOccurrenceCursor(cursor: OccurrenceCursor): string {
  const payload = Buffer.from(
    JSON.stringify({ o: cursor.observedAt, i: cursor.id }),
    "utf8",
  ).toString("base64url");
  const sig = createHmac("sha256", cursorSecret())
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

export function decodeOccurrenceCursor(
  raw: string | null | undefined,
): OccurrenceCursor | null {
  if (!raw || typeof raw !== "string") return null;
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
    ) as { o?: string; i?: string };
    if (!parsed.o || !parsed.i || !isUuid(parsed.i)) return null;
    return { observedAt: parsed.o, id: parsed.i };
  } catch {
    return null;
  }
}

/**
 * Select occurrence for detail view.
 * Invalid IDs fall back to latest. Must belong to the provided rows.
 */
export function selectOccurrence(input: {
  occurrencesNewestFirst: OccurrenceRow[];
  requestedId: string | null;
}): OccurrenceRow | null {
  const rows = input.occurrencesNewestFirst;
  if (rows.length === 0) return null;
  if (input.requestedId && isUuid(input.requestedId)) {
    const match = rows.find((row) => row.id === input.requestedId);
    if (match) return match;
  }
  return rows[0] ?? null;
}

export function buildOccurrencePage(input: {
  rows: OccurrenceRow[];
  pageSize?: number;
}): {
  items: OccurrenceRow[];
  hasMore: boolean;
  nextCursor: string | null;
} {
  const pageSize = input.pageSize ?? EVIDENCE_OCCURRENCE_PAGE_SIZE;
  const hasMore = input.rows.length > pageSize;
  const items = hasMore ? input.rows.slice(0, pageSize) : input.rows;
  const last = items[items.length - 1];
  return {
    items,
    hasMore,
    nextCursor:
      hasMore && last
        ? encodeOccurrenceCursor({
            observedAt: last.observed_at,
            id: last.id,
          })
        : null,
  };
}

/** Find the immediately older occurrence for material-change comparison. */
export function findPriorOccurrence(
  newestFirst: OccurrenceRow[],
  currentId: string,
): OccurrenceRow | null {
  const idx = newestFirst.findIndex((row) => row.id === currentId);
  if (idx < 0) return null;
  return newestFirst[idx + 1] ?? null;
}

export function isEarliestOccurrence(
  newestFirst: OccurrenceRow[],
  currentId: string,
): boolean {
  if (newestFirst.length === 0) return true;
  return newestFirst[newestFirst.length - 1]?.id === currentId;
}
