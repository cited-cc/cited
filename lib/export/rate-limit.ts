/**
 * Export rate limiter uses durable Postgres buckets for multi-process safety.
 */
import {
  RATE_LIMIT_PRESETS,
  assertRateLimitDurable,
  resetRateLimitForTests,
} from "@/lib/security/rate-limit";

export async function assertExportRateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<{ ok: true } | { ok: false; retryAfterSeconds: number }> {
  const result = await assertRateLimitDurable({
    key: input.key,
    limit: input.limit || RATE_LIMIT_PRESETS.export.limit,
    windowMs: input.windowMs || RATE_LIMIT_PRESETS.export.windowMs,
  });
  if (!result.ok) {
    return { ok: false, retryAfterSeconds: result.retryAfterSeconds };
  }
  return { ok: true };
}

export function resetExportRateLimitForTests(): void {
  resetRateLimitForTests();
}
