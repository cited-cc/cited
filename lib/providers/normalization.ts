import { isSafeHttpUrl, sanitizeCitationUrl } from "@/lib/monitoring/hash";
import type {
  NormalizedAiResult,
  NormalizedCitationSource,
  NormalizedMentionCandidate,
} from "@/lib/monitoring/types";
import { ProviderError } from "@/lib/providers/errors";
import {
  NORMALIZATION_VERSION,
  PROVIDER_LIMITS,
  type MonitoringProviderId,
} from "@/lib/providers/types";

function assertUtf8Text(value: string, field: string, providerId: MonitoringProviderId): string {
  if (value.includes("\u0000")) {
    throw new ProviderError({
      code: "invalid_provider_response",
      message: `${field} contains invalid UTF-8.`,
      providerId,
    });
  }
  return value;
}

export function enforceTextLimit(
  value: string,
  limit: number,
  field: string,
  providerId: MonitoringProviderId,
): string {
  const text = assertUtf8Text(value, field, providerId);
  if (text.length > limit) {
    throw new ProviderError({
      code: "invalid_provider_response",
      message: `${field} exceeds the allowed size limit.`,
      providerId,
    });
  }
  return text;
}

export function validateNormalizedCitationSource(
  source: NormalizedCitationSource,
  providerId: MonitoringProviderId,
): NormalizedCitationSource {
  const url = source.url ? sanitizeCitationUrl(source.url) : null;
  if (source.url && !url) {
    throw new ProviderError({
      code: "invalid_provider_response",
      message: "Citation URL failed validation.",
      providerId,
    });
  }
  if (url && !isSafeHttpUrl(url)) {
    throw new ProviderError({
      code: "invalid_provider_response",
      message: "Citation URL uses an unsupported protocol.",
      providerId,
    });
  }
  return {
    ...source,
    url,
    normalizedUrl: url ? sanitizeCitationUrl(url) : source.normalizedUrl ?? null,
    title: source.title
      ? enforceTextLimit(source.title, 500, "citation.title", providerId)
      : source.title,
    snippet: source.snippet
      ? enforceTextLimit(source.snippet, 2_000, "citation.snippet", providerId)
      : source.snippet,
  };
}

export function validateNormalizedMention(
  mention: NormalizedMentionCandidate,
  providerId: MonitoringProviderId,
): NormalizedMentionCandidate {
  return {
    ...mention,
    text: enforceTextLimit(mention.text, 500, "mention.text", providerId),
  };
}

export function validateNormalizedAiResult(
  result: NormalizedAiResult,
  providerId: MonitoringProviderId,
): NormalizedAiResult {
  const prompt = enforceTextLimit(
    result.prompt,
    PROVIDER_LIMITS.maxPromptChars,
    "prompt",
    providerId,
  );
  const responseText = enforceTextLimit(
    result.responseText,
    PROVIDER_LIMITS.maxResponseTextChars,
    "responseText",
    providerId,
  );

  if (result.citations.length > PROVIDER_LIMITS.maxCitationCount) {
    throw new ProviderError({
      code: "invalid_provider_response",
      message: "Citation count exceeds the allowed limit.",
      providerId,
    });
  }

  if (result.mentionCandidates.length > PROVIDER_LIMITS.maxMentionCount) {
    throw new ProviderError({
      code: "invalid_provider_response",
      message: "Mention count exceeds the allowed limit.",
      providerId,
    });
  }

  return {
    ...result,
    provider: providerId,
    prompt,
    responseText,
    citations: result.citations.map((citation) =>
      validateNormalizedCitationSource(citation, providerId),
    ),
    mentionCandidates: result.mentionCandidates.map((mention) =>
      validateNormalizedMention(mention, providerId),
    ),
    metadata: {
      ...(result.metadata ?? {}),
      normalizationVersion: NORMALIZATION_VERSION,
    },
  };
}
