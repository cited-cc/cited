import { createHash } from "node:crypto";

import {
  extractHostname,
  normalizeHostname,
  normalizeUrl,
} from "@/lib/citations/normalize";
import type { NormalizedCitationSource } from "@/lib/monitoring/types";

const SAFE_URL_PROTOCOLS = new Set(["http:", "https:"]);

export function hashResponseEvidence(input: {
  aiSurface: string;
  prompt: string;
  responseText: string;
  citationUrls: string[];
  languageCode: string;
  countryCode: string;
  city?: string | null;
}): string {
  const canonical = JSON.stringify({
    aiSurface: input.aiSurface,
    prompt: input.prompt.trim(),
    responseText: input.responseText.trim(),
    citationUrls: [...input.citationUrls].sort(),
    languageCode: input.languageCode.toLowerCase(),
    countryCode: input.countryCode.toUpperCase(),
    city: input.city?.trim().toLowerCase() ?? null,
  });
  return createHash("sha256").update(canonical).digest("hex");
}

export function hashEvidenceOccurrence(input: {
  eventType: string;
  citedUrlNormalized?: string | null;
  brandKey?: string | null;
  responseExcerpt?: string | null;
}): string {
  const canonical = JSON.stringify({
    eventType: input.eventType,
    citedUrlNormalized: input.citedUrlNormalized ?? null,
    brandKey: input.brandKey ?? null,
    responseExcerpt: input.responseExcerpt?.slice(0, 240) ?? null,
  });
  return createHash("sha256").update(canonical).digest("hex");
}

export function buildEventFingerprint(input: {
  workspaceId: string;
  domainId: string | null;
  monitorConfigurationId: string;
  aiSurface: string;
  eventType: string;
  identityKey: string;
}): string {
  const canonical = [
    input.workspaceId,
    input.domainId ?? "",
    input.monitorConfigurationId,
    input.aiSurface,
    input.eventType,
    input.identityKey,
  ].join("|");
  return createHash("sha256").update(canonical).digest("hex");
}

export function isSafeHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return SAFE_URL_PROTOCOLS.has(parsed.protocol);
  } catch {
    return false;
  }
}

export function sanitizeCitationUrl(
  url: string | null | undefined,
): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (!isSafeHttpUrl(trimmed) && !/^[a-z0-9.-]+\.[a-z]{2,}/i.test(trimmed)) {
    return null;
  }
  try {
    const normalized = normalizeUrl(trimmed);
    return isSafeHttpUrl(normalized) ? normalized : null;
  } catch {
    return null;
  }
}

export function normalizeCitationSource(input: {
  url?: string | null;
  title?: string | null;
  snippet?: string | null;
  position?: number | null;
  providerReferenceId?: string | null;
  metadata?: Record<string, unknown>;
}): NormalizedCitationSource | null {
  const sanitizedUrl = sanitizeCitationUrl(input.url ?? null);
  let hostname: string | null = null;
  if (sanitizedUrl) {
    try {
      hostname = normalizeHostname(sanitizedUrl);
    } catch {
      hostname = extractHostname(sanitizedUrl);
    }
  }

  if (!sanitizedUrl && !input.title && !input.snippet) {
    return null;
  }

  return {
    url: sanitizedUrl,
    normalizedUrl: sanitizedUrl,
    hostname,
    title: input.title?.trim().slice(0, 500) || null,
    snippet: input.snippet?.trim().slice(0, 1000) || null,
    position:
      typeof input.position === "number" && Number.isFinite(input.position)
        ? input.position
        : null,
    providerReferenceId: input.providerReferenceId ?? null,
    metadata: input.metadata,
  };
}

/**
 * Bound and redact a raw provider payload before persistence.
 * Never stores authorization headers or credential-like keys.
 */
export function redactAndCapPayload(
  payload: unknown,
  maxBytes: number,
): { payload: unknown; truncated: boolean; byteLength: number } {
  const redacted = redactDeep(payload);
  const json = JSON.stringify(redacted);
  const byteLength = Buffer.byteLength(json, "utf8");
  if (byteLength <= maxBytes) {
    return { payload: redacted, truncated: false, byteLength };
  }

  // Truncate response text fields preferentially, then hard-cut JSON.
  const truncatedObject =
    redacted && typeof redacted === "object"
      ? truncateObjectStrings(redacted as Record<string, unknown>, maxBytes)
      : { truncated: true, preview: json.slice(0, Math.max(0, maxBytes - 64)) };

  const truncatedJson = JSON.stringify(truncatedObject);
  if (Buffer.byteLength(truncatedJson, "utf8") <= maxBytes) {
    return {
      payload: truncatedObject,
      truncated: true,
      byteLength: Buffer.byteLength(truncatedJson, "utf8"),
    };
  }

  return {
    payload: {
      truncated: true,
      preview: truncatedJson.slice(0, Math.max(0, maxBytes - 64)),
    },
    truncated: true,
    byteLength: maxBytes,
  };
}

const SENSITIVE_KEYS =
  /(password|authorization|api[_-]?key|secret|token|cookie|credential|login)/i;

function redactDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactDeep(item));
  }
  if (value && typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(
      value as Record<string, unknown>,
    )) {
      if (SENSITIVE_KEYS.test(key)) {
        output[key] = "[REDACTED]";
        continue;
      }
      output[key] = redactDeep(nested);
    }
    return output;
  }
  return value;
}

function truncateObjectStrings(
  value: Record<string, unknown>,
  maxBytes: number,
): Record<string, unknown> {
  const clone: Record<string, unknown> = { ...value, _truncated: true };
  for (const [key, nested] of Object.entries(clone)) {
    if (typeof nested === "string" && nested.length > 2000) {
      clone[key] = `${nested.slice(0, 2000)}…[truncated]`;
    }
  }
  const json = JSON.stringify(clone);
  if (Buffer.byteLength(json, "utf8") <= maxBytes) {
    return clone;
  }
  return {
    truncated: true,
    preview: json.slice(0, Math.max(0, maxBytes - 64)),
  };
}

export function excerptAroundMatch(
  text: string,
  match: string,
  radius = 80,
): string {
  const lower = text.toLowerCase();
  const needle = match.toLowerCase();
  const index = lower.indexOf(needle);
  if (index < 0) {
    return text.slice(0, radius * 2);
  }
  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + match.length + radius);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < text.length ? "…" : "";
  return `${prefix}${text.slice(start, end)}${suffix}`;
}
