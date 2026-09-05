import { normalizeCitationSource } from "@/lib/monitoring/hash";
import { normalizeProviderText } from "@/lib/evidence/provider-text";
import type {
  NormalizedAiResult,
  NormalizedCitationSource,
  NormalizedScanRequest,
} from "@/lib/monitoring/types";
import { DataForSeoError, mapDataForSeoEnvelopeStatus } from "@/lib/providers/dataforseo/errors";
import {
  dataForSeoEnvelopeSchema,
  dataForSeoSerpResultSchema,
  type DataForSeoAiOverviewItem,
  type DataForSeoAiOverviewReference,
  type DataForSeoSerpResult,
} from "@/lib/providers/dataforseo/types";

type SerpItem = Record<string, unknown>;

function isRecord(value: unknown): value is SerpItem {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isAiOverviewItem(item: unknown): item is DataForSeoAiOverviewItem {
  if (!isRecord(item)) return false;
  return item.type === "ai_overview";
}

function isMessageItem(item: unknown): item is SerpItem {
  if (!isRecord(item)) return false;
  return item.type === "message";
}

function extractMessageSections(items: unknown[]): {
  responseText: string;
  citations: NormalizedCitationSource[];
} {
  const texts: string[] = [];
  const citations: NormalizedCitationSource[] = [];
  let position = 1;

  for (const item of items) {
    if (!isMessageItem(item)) continue;
    const sections = item.sections;
    if (!Array.isArray(sections)) continue;
    for (const section of sections) {
      if (!isRecord(section)) continue;
      const text = typeof section.text === "string" ? section.text.trim() : "";
      if (text) texts.push(normalizeProviderText(text));
      const annotations = section.annotations;
      if (!Array.isArray(annotations)) continue;
      for (const annotation of annotations) {
        if (!isRecord(annotation)) continue;
        const source = normalizeCitationSource({
          url: typeof annotation.url === "string" ? annotation.url : null,
          title: typeof annotation.title === "string" ? annotation.title : null,
          position,
          metadata: { source: "serp_message_annotation" },
        });
        if (source) {
          citations.push(source);
          position += 1;
        }
      }
    }
  }

  return {
    responseText: texts.join("\n\n").trim(),
    citations,
  };
}

function collectReferences(
  references: DataForSeoAiOverviewReference[] | null | undefined,
  citations: NormalizedCitationSource[],
  seen: Set<string>,
  position: { value: number },
): void {
  for (const reference of references ?? []) {
    const source = normalizeCitationSource({
      url: reference.url,
      title: reference.title ?? reference.source ?? null,
      position: position.value,
      metadata: {
        source: "ai_overview_reference",
        domain: reference.domain ?? null,
        snippet: reference.text ?? null,
      },
    });
    if (!source) continue;
    const dedupeKey =
      source.normalizedUrl ?? source.url ?? source.hostname ?? null;
    if (dedupeKey && seen.has(dedupeKey)) continue;
    if (dedupeKey) seen.add(dedupeKey);
    citations.push({
      ...source,
      snippet: source.snippet ?? reference.text ?? null,
    });
    position.value += 1;
  }
}

function extractAiOverview(result: DataForSeoSerpResult): {
  responseText: string;
  citations: NormalizedCitationSource[];
  missingAiOverview: boolean;
  asynchronousAiOverview?: boolean;
} {
  const items = result.items ?? [];
  const overview = items.find(isAiOverviewItem);
  if (!overview) {
    const messageExtract = extractMessageSections(items);
    if (messageExtract.responseText || messageExtract.citations.length > 0) {
      return {
        responseText: messageExtract.responseText,
        citations: messageExtract.citations,
        missingAiOverview: false,
      };
    }
    return {
      responseText: "",
      citations: [],
      missingAiOverview: true,
    };
  }

  const texts: string[] = [];
  if (overview.markdown?.trim()) {
    texts.push(normalizeProviderText(overview.markdown));
  }

  const citations: NormalizedCitationSource[] = [];
  const seen = new Set<string>();
  const position = { value: 1 };

  collectReferences(overview.references, citations, seen, position);

  for (const element of overview.items ?? []) {
    if (!element || typeof element !== "object") continue;
    const markdown = element.markdown?.trim();
    const text = element.text?.trim();
    if (markdown) texts.push(normalizeProviderText(markdown));
    else if (text) texts.push(normalizeProviderText(text));
    collectReferences(element.references, citations, seen, position);
  }

  return {
    responseText: texts.join("\n\n").trim(),
    citations,
    missingAiOverview: false,
    asynchronousAiOverview: overview.asynchronous_ai_overview,
  };
}

/**
 * DataForSEO Google SERP (AI Overviews / AI Mode) → Cited NormalizedAiResult.
 * Missing AI Overview completes with empty text/citations (not a hard fail).
 */
export function normalizeDataForSeoSerpResponse(input: {
  envelope: unknown;
  request: NormalizedScanRequest;
}): NormalizedAiResult {
  const parsed = dataForSeoEnvelopeSchema.safeParse(input.envelope);
  if (!parsed.success) {
    throw new DataForSeoError({
      code: "provider_invalid_response",
      message: "DataForSEO SERP response failed schema validation.",
      retryable: false,
    });
  }

  const envelope = parsed.data;
  if (envelope.status_code !== 20000) {
    const code = mapDataForSeoEnvelopeStatus(envelope.status_code);
    throw new DataForSeoError({
      code,
      message: `DataForSEO envelope status ${envelope.status_code}`,
      retryable:
        code === "provider_rate_limited" || code === "provider_unavailable",
      providerStatusCode: envelope.status_code,
    });
  }

  const task = envelope.tasks[0];
  if (!task) {
    throw new DataForSeoError({
      code: "provider_invalid_response",
      message: "DataForSEO SERP response contained no tasks.",
      retryable: false,
    });
  }

  if (task.status_code !== 20000) {
    const retryable =
      task.status_code === 40102 ||
      task.status_code === 40201 ||
      task.status_code >= 50000;
    const code =
      task.status_code === 40201
        ? "provider_rate_limited"
        : task.status_code >= 50000
          ? "provider_unavailable"
          : "provider_validation_error";
    throw new DataForSeoError({
      code,
      message: `DataForSEO task status ${task.status_code}${task.status_message ? `: ${task.status_message}` : ""}`,
      retryable,
      providerStatusCode: task.status_code,
    });
  }

  const rawResult = task.result?.[0];
  if (!rawResult) {
    throw new DataForSeoError({
      code: "provider_invalid_response",
      message: "DataForSEO SERP task completed without result payload.",
      retryable: false,
      providerStatusCode: task.status_code,
    });
  }

  const parsedResult = dataForSeoSerpResultSchema.safeParse(rawResult);
  if (!parsedResult.success) {
    throw new DataForSeoError({
      code: "provider_invalid_response",
      message: "DataForSEO SERP result failed schema validation.",
      retryable: false,
    });
  }
  const result: DataForSeoSerpResult = parsedResult.data;

  const extracted = extractAiOverview(result);
  const cost = typeof task.cost === "number" ? task.cost : null;

  return {
    provider: "dataforseo",
    providerTaskId: task.id ?? null,
    providerRequestId: task.id ?? null,
    aiSurface: input.request.aiSurface,
    modelName: null,
    prompt: input.request.prompt,
    responseText: extracted.responseText,
    responseLanguage: input.request.languageCode,
    location: {
      languageCode: input.request.languageCode,
      countryCode: input.request.countryCode,
      city: input.request.city ?? null,
    },
    citations: extracted.citations,
    mentionCandidates: [],
    completedAt: result.datetime ? new Date(result.datetime) : new Date(),
    providerCostUsd: cost,
    providerCostType: cost !== null ? "actual" : "unknown",
    rawPayload: envelope,
    metadata: {
      seType: result.type ?? null,
      itemTypes: result.item_types ?? [],
      missingAiOverview: extracted.missingAiOverview,
      asynchronousAiOverview: extracted.asynchronousAiOverview ?? null,
      locationCode: result.location_code ?? null,
    },
  };
}
