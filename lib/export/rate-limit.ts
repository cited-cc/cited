/**
 * Export rate limiter delegates to the shared security rate limiter.
 */
import {
  RATE_LIMIT_PRESETS,
  assertRateLimit,
  resetRateLimitForTests,
} from "@/lib/security/rate-limit";

export function assertExportRateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
}): { ok: true } | { ok: false; retryAfterSeconds: number } {
  const result = assertRateLimit({
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
