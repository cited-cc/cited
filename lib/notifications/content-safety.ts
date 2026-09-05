const MAX_PROMPT_CHARS = 160;
const MAX_EVIDENCE_CHARS = 280;
const MAX_SUBJECT_CHARS = 90;
const MAX_TITLE_CHARS = 120;

/**
 * Escape text for HTML email bodies. Never render provider HTML.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Truncate at a word boundary when practical so evidence is not misleading.
 */
export function truncateSafe(
  value: string,
  maxChars: number,
): { text: string; truncated: boolean } {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxChars) {
    return { text: normalized, truncated: false };
  }
  const slice = normalized.slice(0, maxChars);
  const lastSpace = slice.lastIndexOf(" ");
  const cut =
    lastSpace > Math.floor(maxChars * 0.6) ? slice.slice(0, lastSpace) : slice;
  return { text: `${cut.trimEnd()}…`, truncated: true };
}

export function truncatePrompt(value: string): string {
  return truncateSafe(value, MAX_PROMPT_CHARS).text;
}

export function truncateEvidence(value: string): string {
  return truncateSafe(value, MAX_EVIDENCE_CHARS).text;
}

export function truncateSubject(value: string): string {
  return truncateSafe(value, MAX_SUBJECT_CHARS).text;
}

export function truncateTitle(value: string): string {
  return truncateSafe(value, MAX_TITLE_CHARS).text;
}

/**
 * Display hostname/path only. Never use as a clickable external CTA by default.
 */
export function formatSafeSourceDisplay(urlOrHost: string | null | undefined): string | null {
  if (!urlOrHost) return null;
  try {
    const withProtocol = /^https?:\/\//i.test(urlOrHost)
      ? urlOrHost
      : `https://${urlOrHost}`;
    const parsed = new URL(withProtocol);
    const path =
      parsed.pathname === "/" ? "" : parsed.pathname.slice(0, 80);
    return `${parsed.hostname}${path}`;
  } catch {
    return truncateSafe(urlOrHost.replace(/^https?:\/\//i, ""), 100).text;
  }
}

export const PROVENANCE_LINE =
  "Captured from a monitored result in your Cited workspace.";

export const CONTENT_LIMITS = {
  MAX_PROMPT_CHARS,
  MAX_EVIDENCE_CHARS,
  MAX_SUBJECT_CHARS,
  MAX_TITLE_CHARS,
} as const;
