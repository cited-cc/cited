/**
 * Redaction helpers for logs and safe error payloads.
 */
export { redactObject } from "@/lib/security/logger";

const SENSITIVE_SUBSTRINGS = [
  "password",
  "secret",
  "token",
  "authorization",
  "webhook",
  "api_key",
  "apikey",
  "service_role",
] as const;

export function containsSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase();
  return SENSITIVE_SUBSTRINGS.some((part) => lower.includes(part));
}

export function redactString(value: string, max = 0): string {
  if (max > 0 && value.length > max) {
    return "[REDACTED_TRUNCATED]";
  }
  return "[REDACTED]";
}
