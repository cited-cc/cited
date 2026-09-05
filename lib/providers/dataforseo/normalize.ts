import { normalizeCitationSource } from "@/lib/monitoring/hash";
import type {
  NormalizedAiResult,
  NormalizedCitationSource,
  NormalizedScanRequest,
} from "@/lib/monitoring/types";
import { DataForSeoError, mapDataForSeoEnvelopeStatus } from "@/lib/providers/dataforseo/errors";
import {
  dataForSeoEnvelopeSchema,
  dataForSeoResultItemSchema,
  type DataForSeoResultItem,
} from "@/lib/providers/dataforseo/types";

function extractTextAndCitations(result: DataForSeoResultItem): {
  responseText: string;
  citations: NormalizedCitationSource[];
} {
  const texts: string[] = [];
  const citations: NormalizedCitationSource[] = [];
  let position = 1;

  for (const item of result.items ?? []) {
    if (!item || typeof item !== "object") continue;
    for (const section of item.sections ?? []) {
      if (section.text) {
        texts.push(section.text);
      }
      for (const annotation of section.annotations ?? []) {
        const source = normalizeCitationSource({
          url: annotation.url,
          title: annotation.title,
          position,
          metadata: { source: "annotation" },
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

/**
 * DataForSEO response → Cited NormalizedAiResult.
 * Raw envelope stays on rawPayload for server-only bounded storage; never return to UI.
 */
export function normalizeDataForSeoLiveResponse(input: {
  envelope: unknown;
  request: NormalizedScanRequest;
}): NormalizedAiResult {
  const parsed = dataForSeoEnvelopeSchema.safeParse(input.envelope);
  if (!parsed.success) {
    throw new DataForSeoError({
      code: "provider_invalid_response",
      message: "DataForSEO response failed schema validation.",
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
      message: "DataForSEO response contained no tasks.",
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
      message: `DataForSEO task status ${task.status_code}`,
      retryable,
      providerStatusCode: task.status_code,
    });
  }

  const rawResult = task.result?.[0];
  if (!rawResult) {
    throw new DataForSeoError({
      code: "provider_invalid_response",
      message: "DataForSEO task completed without result payload.",
      retryable: false,
      providerStatusCode: task.status_code,
    });
  }

  const parsedResult = dataForSeoResultItemSchema.safeParse(rawResult);
  if (!parsedResult.success) {
    throw new DataForSeoError({
      code: "provider_invalid_response",
      message: "DataForSEO LLM result failed schema validation.",
      retryable: false,
    });
  }
  const result: DataForSeoResultItem = parsedResult.data;

  const { responseText, citations } = extractTextAndCitations(result);
  if (!responseText) {
    throw new DataForSeoError({
      code: "provider_invalid_response",
      message: "DataForSEO result contained no usable response text.",
      retryable: false,
    });
  }

  const cost =
    typeof task.cost === "number"
      ? task.cost
      : typeof result.money_spent === "number"
        ? result.money_spent
        : null;

  return {
    provider: "dataforseo",
    providerTaskId: task.id ?? null,
    providerRequestId: task.id ?? null,
    aiSurface: input.request.aiSurface,
    modelName: result.model_name ?? null,
    prompt: input.request.prompt,
    responseText,
    responseLanguage: input.request.languageCode,
    location: {
      languageCode: input.request.languageCode,
      countryCode: input.request.countryCode,
      city: input.request.city ?? null,
    },
    citations,
    mentionCandidates: [],
    completedAt: result.datetime ? new Date(result.datetime) : new Date(),
    providerCostUsd: cost,
    providerCostType: cost !== null ? "actual" : "unknown",
    rawPayload: envelope,
    metadata: {
      inputTokens: result.input_tokens,
      outputTokens: result.output_tokens,
      webSearch: result.web_search,
      moneySpent: result.money_spent,
    },
  };
}
