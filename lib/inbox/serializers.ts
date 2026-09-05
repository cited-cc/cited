/**
 * Serialize DB rows into Inbox view models.
 * Never include raw_provider_payload or full response text in list items.
 */

import type { Tables } from "@/lib/db/types";
import { normalizeProviderText } from "@/lib/evidence/provider-text";
import {
  EMPTY_MEMBER_STATE,
  INBOX_RESPONSE_EXCERPT_MAX_LENGTH,
  INBOX_SNIPPET_MAX_LENGTH,
  type InboxEventListItem,
  type InboxEvidenceItem,
  type InboxMemberState,
  type InboxOccurrenceItem,
} from "@/lib/inbox/types";
import { toSafeHttpsUrl, truncateEvidenceText } from "@/lib/inbox/safe-url";
import type {
  AiSurfaceKey,
  CitationEventType,
  CitationEvidenceType,
} from "@/types/product";

type CitationEventRow = Tables<"citation_events">;
type MemberStateRow = Tables<"citation_event_member_states">;
type EvidenceRow = Tables<"citation_evidence">;
type OccurrenceRow = Tables<"citation_event_occurrences">;

export function serializeMemberState(
  row: MemberStateRow | null | undefined,
): InboxMemberState {
  if (!row) return { ...EMPTY_MEMBER_STATE };
  return {
    seenAt: row.seen_at,
    savedAt: row.saved_at,
    archivedAt: row.archived_at,
    resolvedAt: row.resolved_at,
  };
}

export function serializeInboxEventListItem(input: {
  event: CitationEventRow;
  memberState?: MemberStateRow | null;
  promptId?: string | null;
  promptText?: string | null;
  domainHostname?: string | null;
}): InboxEventListItem {
  const { event } = input;
  return {
    id: event.id,
    eventType: event.event_type as CitationEventType,
    aiSurface: (event.ai_surface as AiSurfaceKey | null) ?? null,
    promptId: input.promptId ?? null,
    promptText: truncateEvidenceText(input.promptText, 240),
    domainId: event.domain_id,
    domainHostname: input.domainHostname ?? null,
    citedHostname: event.cited_hostname,
    citedUrl: toSafeHttpsUrl(event.cited_url),
    sourceTitle: truncateEvidenceText(event.source_title, 160),
    sourceSnippet: truncateEvidenceText(
      event.source_snippet,
      INBOX_SNIPPET_MAX_LENGTH,
    ),
    confidenceScore:
      typeof event.confidence_score === "number"
        ? event.confidence_score
        : null,
    firstSeenAt: event.first_seen_at,
    lastSeenAt: event.last_seen_at,
    occurrenceCount: Math.max(1, Number(event.occurrence_count ?? 1)),
    latestOccurrenceAt: event.last_seen_at,
    memberState: serializeMemberState(input.memberState),
  };
}

export function serializeEvidenceItem(row: EvidenceRow): InboxEvidenceItem {
  return {
    type: row.evidence_type as CitationEvidenceType,
    text: truncateEvidenceText(row.evidence_text, INBOX_SNIPPET_MAX_LENGTH),
    url: toSafeHttpsUrl(row.evidence_url),
    title: null,
    position: row.evidence_position,
  };
}

export function serializeOccurrenceItem(
  row: OccurrenceRow,
  aiSurface: AiSurfaceKey | null,
): InboxOccurrenceItem {
  return {
    observedAt: row.observed_at,
    aiSurface,
    sourceHostname: row.source_hostname,
    sourceUrl: toSafeHttpsUrl(row.source_url_normalized ?? null),
    citationPosition: row.citation_position,
  };
}

export function buildEventSummary(item: InboxEventListItem): string {
  const surface = item.aiSurface;
  const surfaceLabel = surfaceLabelFor(surface);
  const host = item.citedHostname;
  const brandOrDomain = item.domainHostname;

  switch (item.eventType) {
    case "citation": {
      if (surfaceLabel && host) {
        return `${surfaceLabel} cited ${host}`;
      }
      if (host) return `Citation found for ${host}`;
      return "Citation found";
    }
    case "mention": {
      if (surfaceLabel && brandOrDomain) {
        return `${surfaceLabel} mentioned ${brandOrDomain}`;
      }
      if (brandOrDomain) return `Mention of ${brandOrDomain}`;
      return "Brand mention found";
    }
    case "recommendation": {
      if (surfaceLabel && brandOrDomain) {
        return `${surfaceLabel} recommended ${brandOrDomain}`;
      }
      if (brandOrDomain) return `Recommendation for ${brandOrDomain}`;
      return "Recommendation found";
    }
    case "competitor_citation": {
      if (surfaceLabel && host) {
        return `${surfaceLabel} cited ${host}`;
      }
      if (host) return `Competitor citation: ${host}`;
      return "Competitor citation found";
    }
    case "missed_opportunity": {
      if (host) {
        return `A competitor appeared while your domain was absent`;
      }
      return "Missed opportunity: your domain was absent";
    }
    default: {
      const _exhaustive: never = item.eventType;
      return _exhaustive;
    }
  }
}

function surfaceLabelFor(surface: AiSurfaceKey | null): string | null {
  if (!surface) return null;
  switch (surface) {
    case "chatgpt":
      return "ChatGPT";
    case "gemini":
      return "Gemini";
    case "google_ai_overviews":
      return "Google AI Overviews";
    case "google_ai_mode":
      return "Google AI Mode";
    case "perplexity":
      return "Perplexity";
    case "claude":
      return "Claude";
    default: {
      const _exhaustive: never = surface;
      return _exhaustive;
    }
  }
}

export function eventTypeLabel(type: CitationEventType): string {
  switch (type) {
    case "citation":
      return "Citation";
    case "mention":
      return "Mention";
    case "recommendation":
      return "Recommendation";
    case "competitor_citation":
      return "Competitor citation";
    case "missed_opportunity":
      return "Missed opportunity";
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

export function buildResponseExcerpt(
  responseText: string | null | undefined,
): string | null {
  return truncateEvidenceText(
    normalizeProviderText(responseText),
    INBOX_RESPONSE_EXCERPT_MAX_LENGTH,
  );
}

export function formatRelativeUtc(iso: string): string {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return "";
  const now = Date.now();
  const diffMs = now - date.getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  if (diffMs < 60_000) return "just now";
  if (diffMs < 60 * 60_000) {
    const mins = Math.floor(diffMs / 60_000);
    return `${mins}m ago`;
  }
  if (diffMs < dayMs) {
    const hours = Math.floor(diffMs / (60 * 60_000));
    return `${hours}h ago`;
  }
  if (diffMs < 14 * dayMs) {
    const days = Math.floor(diffMs / dayMs);
    return days === 1 ? "1 day ago" : `${days} days ago`;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatAbsoluteUtc(iso: string): string {
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return "";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });
}

export function matchConfidenceLabel(
  score: number | null,
  eventType: CitationEventType,
): string | null {
  if (score === null || !Number.isFinite(score)) return null;
  if (eventType === "citation" && score >= 0.9) {
    return "Exact verified-domain source match";
  }
  if (eventType === "mention" && score >= 0.7) {
    return "Brand or domain text match in response";
  }
  if (eventType === "recommendation" && score >= 0.7) {
    return "Deterministic recommendation evidence";
  }
  if (eventType === "competitor_citation" && score >= 0.7) {
    return "Configured competitor source match";
  }
  if (eventType === "missed_opportunity") {
    return "Verified domain absent; competitor present";
  }
  return null;
}
