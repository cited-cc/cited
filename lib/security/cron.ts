import { timingSafeEqual } from "node:crypto";

/**
 * Constant-time string comparison for secrets (cron tokens, etc.).
 */
export function secureCompare(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) {
    return false;
  }
  return timingSafeEqual(aBuf, bBuf);
}

export function requireCronAuthorization(
  headerValue: string | null,
  cronSecret: string | undefined,
): boolean {
  if (!cronSecret) {
    return false;
  }
  if (!headerValue) {
    return false;
  }
  const token = headerValue.startsWith("Bearer ")
    ? headerValue.slice("Bearer ".length)
    : headerValue;
  return secureCompare(token, cronSecret);
}
