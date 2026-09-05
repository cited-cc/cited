/**
 * Safe outbound URL helpers for Inbox evidence rendering.
 * Provider-derived URLs are untrusted.
 */

const BLOCKED_PROTOCOLS = new Set([
  "javascript:",
  "data:",
  "file:",
  "vbscript:",
  "blob:",
]);

/**
 * Returns a safe absolute https URL, or null if the input is unsafe/malformed.
 * http is rejected for outbound customer links (https only).
 */
export function toSafeHttpsUrl(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 2048) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  const protocol = parsed.protocol.toLowerCase();
  if (BLOCKED_PROTOCOLS.has(protocol)) return null;
  if (protocol !== "https:") return null;
  if (!parsed.hostname) return null;

  return parsed.toString();
}

export function truncateEvidenceText(
  value: string | null | undefined,
  max: number,
): string | null {
  if (!value) return null;
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (!cleaned) return null;
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}
