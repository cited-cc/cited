import { createHash } from "node:crypto";

import { createAdminSupabaseClient } from "@/lib/db/admin";
import { logger } from "@/lib/security/logger";

/**
 * Durable rate limiter for sensitive routes.
 *
 * Memory bucket for warm instances + Supabase `rate_limit_buckets` for
 * cross-instance enforcement. Privacy-preserving fingerprints only.
 */

type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSeconds: number; remaining: number };

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

const memoryBuckets = new Map<string, number[]>();

export function hashRateLimitFingerprint(parts: string[]): string {
  return createHash("sha256")
    .update(parts.filter(Boolean).join("|"))
    .digest("hex");
}

function memoryCheck(options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const windowStart = now - options.windowMs;
  const existing = memoryBuckets.get(options.key) ?? [];
  const recent = existing.filter((ts) => ts > windowStart);

  if (recent.length >= options.limit) {
    const oldest = recent[0] ?? now;
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((oldest + options.windowMs - now) / 1000),
    );
    memoryBuckets.set(options.key, recent);
    return { ok: false, retryAfterSeconds, remaining: 0 };
  }

  recent.push(now);
  memoryBuckets.set(options.key, recent);
  return {
    ok: true,
    remaining: Math.max(0, options.limit - recent.length),
  };
}

/**
 * Sync in-memory check. Prefer `assertRateLimitDurable` on public/expensive routes.
 */
export function assertRateLimit(options: RateLimitOptions): RateLimitResult {
  return memoryCheck(options);
}

/**
 * Durable rate limit using hashed bucket keys in Postgres.
 * Falls back to memory-only if the admin client is unavailable.
 */
export async function assertRateLimitDurable(
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  const memory = memoryCheck(options);
  if (!memory.ok) return memory;

  try {
    const admin = createAdminSupabaseClient();
    const now = Date.now();
    const windowStartIso = new Date(now - options.windowMs).toISOString();
    const nowIso = new Date(now).toISOString();

    const { data: existing } = await admin
      .from("rate_limit_buckets")
      .select("bucket_key, window_started_at, hit_count")
      .eq("bucket_key", options.key)
      .maybeSingle();

    if (!existing) {
      await admin.from("rate_limit_buckets").upsert(
        {
          bucket_key: options.key,
          window_started_at: nowIso,
          hit_count: 1,
          updated_at: nowIso,
        },
        { onConflict: "bucket_key" },
      );
      return memory;
    }

    const windowStarted = new Date(existing.window_started_at as string).getTime();
    const windowExpired = windowStarted < now - options.windowMs;

    if (windowExpired) {
      await admin
        .from("rate_limit_buckets")
        .update({
          window_started_at: nowIso,
          hit_count: 1,
          updated_at: nowIso,
        })
        .eq("bucket_key", options.key);
      return memory;
    }

    const hitCount = Number(existing.hit_count ?? 0);
    if (hitCount >= options.limit) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((windowStarted + options.windowMs - now) / 1000),
      );
      return { ok: false, retryAfterSeconds, remaining: 0 };
    }

    await admin
      .from("rate_limit_buckets")
      .update({
        hit_count: hitCount + 1,
        updated_at: nowIso,
      })
      .eq("bucket_key", options.key)
      .gte("window_started_at", windowStartIso);

    return {
      ok: true,
      remaining: Math.max(0, options.limit - (hitCount + 1)),
    };
  } catch (error) {
    logger.warn("Durable rate limit unavailable; using memory fallback", {
      event: "security.rate_limit.fallback",
      safeErrorCode: "rate_limit_store_unavailable",
    });
    void error;
    return memory;
  }
}

/**
 * Prefer hashed request fingerprints over raw IPs.
 * Uses x-forwarded-for only as an input to a one-way hash.
 */
export function fingerprintFromRequest(
  request: Request,
  namespace: string,
  extra: string[] = [],
): string {
  const forwarded =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  const userAgent = request.headers.get("user-agent") ?? "";
  return hashRateLimitFingerprint([namespace, forwarded, userAgent, ...extra]);
}

/**
 * Hash client IP only (no user-agent) for daily free-scan limits.
 * Still one-way. Never store the raw IP.
 */
export function ipFingerprintFromRequest(
  request: Request,
  namespace: string,
): string {
  const forwarded =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip")?.trim() ??
    "";
  const day = new Date().toISOString().slice(0, 10);
  return hashRateLimitFingerprint([namespace, "ip", forwarded || "unknown", day]);
}

export function resetRateLimitForTests(): void {
  memoryBuckets.clear();
}

/** Common presets for sensitive surfaces. */
export const RATE_LIMIT_PRESETS = {
  freeScan: { limit: 5, windowMs: 60_000 },
  /** One free scan per client IP per calendar day (durable). */
  freeScanIpDaily: { limit: 1, windowMs: 24 * 60 * 60 * 1000 },
  domainVerification: { limit: 10, windowMs: 60_000 },
  verificationTokenRegen: { limit: 5, windowMs: 60_000 },
  checkout: { limit: 8, windowMs: 60_000 },
  billingPortal: { limit: 8, windowMs: 60_000 },
  planChange: { limit: 6, windowMs: 60_000 },
  portfolioAddon: { limit: 6, windowMs: 60_000 },
  export: { limit: 10, windowMs: 60_000 },
  notificationTest: { limit: 3, windowMs: 60_000 },
  unsubscribe: { limit: 20, windowMs: 60_000 },
  learnDomainsHandoff: { limit: 5, windowMs: 60_000 },
  contact: { limit: 5, windowMs: 60_000 },
  chatbotLead: { limit: 5, windowMs: 60_000 },
  chatbotChat: { limit: 20, windowMs: 60_000 },
  monitorManualAction: { limit: 20, windowMs: 60_000 },
  cronAbuse: { limit: 120, windowMs: 60_000 },
} as const;
