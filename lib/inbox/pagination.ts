/**
 * Opaque cursor encoding for Inbox pagination.
 * Cursor carries last_seen_at + id only. Workspace scope is always applied server-side.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

import { getOptionalServerEnv } from "@/lib/env";
import { INBOX_PAGE_SIZE } from "@/lib/inbox/types";

export type InboxCursorPayload = {
  lastSeenAt: string;
  id: string;
};

type SignedCursor = {
  v: 1;
  lastSeenAt: string;
  id: string;
  sig: string;
};

function cursorSecret(): string {
  const env = getOptionalServerEnv();
  return (
    env.SUPABASE_SERVICE_ROLE_KEY ??
    env.CLERK_SECRET_KEY ??
    "cited-inbox-cursor-dev"
  );
}

function signPayload(lastSeenAt: string, id: string): string {
  return createHmac("sha256", cursorSecret())
    .update(`${lastSeenAt}|${id}`)
    .digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function encodeInboxCursor(payload: InboxCursorPayload): string {
  const signed: SignedCursor = {
    v: 1,
    lastSeenAt: payload.lastSeenAt,
    id: payload.id,
    sig: signPayload(payload.lastSeenAt, payload.id),
  };
  return Buffer.from(JSON.stringify(signed), "utf8").toString("base64url");
}

export function decodeInboxCursor(
  raw: string | null | undefined,
): InboxCursorPayload | null {
  if (!raw || typeof raw !== "string" || raw.length > 512) {
    return null;
  }

  try {
    const json = Buffer.from(raw, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as Partial<SignedCursor>;
    if (
      parsed.v !== 1 ||
      typeof parsed.lastSeenAt !== "string" ||
      typeof parsed.id !== "string" ||
      typeof parsed.sig !== "string"
    ) {
      return null;
    }

    const expected = signPayload(parsed.lastSeenAt, parsed.id);
    if (!safeEqual(parsed.sig, expected)) {
      return null;
    }

    const lastSeen = new Date(parsed.lastSeenAt);
    if (!Number.isFinite(lastSeen.getTime())) {
      return null;
    }

    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        parsed.id,
      )
    ) {
      return null;
    }

    return {
      lastSeenAt: parsed.lastSeenAt,
      id: parsed.id,
    };
  } catch {
    return null;
  }
}

export function buildNextCursor(items: Array<{ lastSeenAt: string; id: string }>): {
  nextCursor: string | null;
  hasMore: boolean;
} {
  if (items.length < INBOX_PAGE_SIZE) {
    return { nextCursor: null, hasMore: false };
  }
  const last = items[items.length - 1];
  if (!last) {
    return { nextCursor: null, hasMore: false };
  }
  return {
    nextCursor: encodeInboxCursor({
      lastSeenAt: last.lastSeenAt,
      id: last.id,
    }),
    hasMore: true,
  };
}
