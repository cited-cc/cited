import { matchCompetitor } from "@/lib/classification/match-competitor";
import { matchDomain } from "@/lib/classification/match-domain";
import type { Json } from "@/lib/db/types";
import type {
  NormalizedAiResult,
  NormalizedCitationSource,
} from "@/lib/monitoring/types";
import { toSafeHttpsUrl } from "@/lib/inbox/safe-url";
import type {
  AnswerSourceItem,
  ProviderMetadataSnapshot,
  ScanRunInsightSnapshot,
} from "@/lib/evidence/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function serializeCitationsSnapshot(
  citations: NormalizedCitationSource[],
): Json {
  return citations.map((citation) => ({
    url: citation.url ?? null,
    normalizedUrl: citation.normalizedUrl ?? null,
    hostname: citation.hostname ?? null,
    title: citation.title ?? null,
    snippet: citation.snippet ?? null,
    position: citation.position ?? null,
    providerReferenceId: citation.providerReferenceId ?? null,
    metadata: citation.metadata ?? {},
  })) as Json;
}

export function parseCitationsSnapshot(value: Json | null | undefined): NormalizedCitationSource[] {
  if (!Array.isArray(value)) return [];
  const citations: NormalizedCitationSource[] = [];
  for (const item of value) {
    if (!isRecord(item)) continue;
    citations.push({
      url: typeof item.url === "string" ? item.url : null,
      normalizedUrl:
        typeof item.normalizedUrl === "string" ? item.normalizedUrl : null,
      hostname: typeof item.hostname === "string" ? item.hostname : null,
      title: typeof item.title === "string" ? item.title : null,
      snippet: typeof item.snippet === "string" ? item.snippet : null,
      position: typeof item.position === "number" ? item.position : null,
      providerReferenceId:
        typeof item.providerReferenceId === "string"
          ? item.providerReferenceId
          : null,
      metadata: isRecord(item.metadata) ? item.metadata : {},
    });
  }
  return citations;
}

export function serializeProviderMetadata(
  result: NormalizedAiResult,
): Json {
  const metadata = result.metadata ?? {};
  return {
    provider: result.provider,
    inputTokens:
      typeof metadata.inputTokens === "number" ? metadata.inputTokens : null,
    outputTokens:
      typeof metadata.outputTokens === "number" ? metadata.outputTokens : null,
    webSearch:
      typeof metadata.webSearch === "boolean" ? metadata.webSearch : null,
    moneySpent:
      typeof metadata.moneySpent === "number" ? metadata.moneySpent : null,
    missingAiOverview:
      typeof metadata.missingAiOverview === "boolean"
        ? metadata.missingAiOverview
        : null,
    asynchronousAiOverview:
      typeof metadata.asynchronousAiOverview === "boolean"
        ? metadata.asynchronousAiOverview
        : metadata.asynchronousAiOverview === null
          ? null
          : null,
    seType: typeof metadata.seType === "string" ? metadata.seType : null,
    itemTypes: Array.isArray(metadata.itemTypes)
      ? metadata.itemTypes.filter((item): item is string => typeof item === "string")
      : [],
    locationCode:
      typeof metadata.locationCode === "number" ? metadata.locationCode : null,
    mentionCandidateCount: result.mentionCandidates.length,
    providerCostUsd: result.providerCostUsd ?? null,
    providerCostType: result.providerCostType,
  } as Json;
}

export function parseProviderMetadata(
  value: Json | null | undefined,
): ProviderMetadataSnapshot | null {
  if (!isRecord(value)) return null;
  return {
    inputTokens:
      typeof value.inputTokens === "number" ? value.inputTokens : null,
    outputTokens:
      typeof value.outputTokens === "number" ? value.outputTokens : null,
    webSearch:
      typeof value.webSearch === "boolean" ? value.webSearch : null,
    moneySpent:
      typeof value.moneySpent === "number" ? value.moneySpent : null,
    missingAiOverview:
      typeof value.missingAiOverview === "boolean"
        ? value.missingAiOverview
        : null,
    asynchronousAiOverview:
      typeof value.asynchronousAiOverview === "boolean"
        ? value.asynchronousAiOverview
        : null,
    seType: typeof value.seType === "string" ? value.seType : null,
    itemTypes: Array.isArray(value.itemTypes)
      ? value.itemTypes.filter((item): item is string => typeof item === "string")
      : null,
    locationCode:
      typeof value.locationCode === "number" ? value.locationCode : null,
    mentionCandidateCount:
      typeof value.mentionCandidateCount === "number"
        ? value.mentionCandidateCount
        : null,
    providerCostUsd:
      typeof value.providerCostUsd === "number" ? value.providerCostUsd : null,
    providerCostType:
      value.providerCostType === "actual" ||
      value.providerCostType === "estimated" ||
      value.providerCostType === "unknown"
        ? value.providerCostType
        : null,
  };
}

export function serializeAnswerSources(input: {
  citations: NormalizedCitationSource[];
  verifiedHostname: string | null;
  approvedAliases: string[];
  competitorHostnames: string[];
}): AnswerSourceItem[] {
  return input.citations.map((citation, index) => {
    const hostname = citation.hostname ?? null;
    let relation: AnswerSourceItem["relation"] = "other";

    if (input.verifiedHostname && hostname) {
      const domainMatch = matchDomain(
        hostname,
        input.verifiedHostname,
        input.approvedAliases,
      );
      if (domainMatch.matched) {
        relation = "your_domain";
      } else if (matchCompetitor(hostname, input.competitorHostnames)) {
        relation = "competitor";
      }
    }

    return {
      position: citation.position ?? index + 1,
      hostname,
      url: toSafeHttpsUrl(citation.url ?? citation.normalizedUrl ?? null),
      title: citation.title ?? null,
      snippet: citation.snippet ?? null,
      relation,
    };
  });
}

export function buildScanResultSummary(input: {
  result: NormalizedAiResult;
  eventCount: number;
  eventsCreated: number;
  eventsUpdated: number;
  occurrencesCreated: number;
}): Record<string, unknown> {
  const metadata = input.result.metadata ?? {};
  return {
    citationCount: input.result.citations.length,
    eventCount: input.eventCount,
    eventsCreated: input.eventsCreated,
    eventsUpdated: input.eventsUpdated,
    occurrencesCreated: input.occurrencesCreated,
    modelName: input.result.modelName ?? null,
    mentionCandidateCount: input.result.mentionCandidates.length,
    responseRetained: Boolean(input.result.responseText.trim()),
    missingAiOverview:
      typeof metadata.missingAiOverview === "boolean"
        ? metadata.missingAiOverview
        : null,
    asynchronousAiOverview:
      typeof metadata.asynchronousAiOverview === "boolean"
        ? metadata.asynchronousAiOverview
        : null,
    inputTokens:
      typeof metadata.inputTokens === "number" ? metadata.inputTokens : null,
    outputTokens:
      typeof metadata.outputTokens === "number" ? metadata.outputTokens : null,
    webSearch:
      typeof metadata.webSearch === "boolean" ? metadata.webSearch : null,
    providerCostUsd: input.result.providerCostUsd ?? null,
    providerCostType: input.result.providerCostType,
  };
}

export function parseScanRunInsight(
  summary: Json | null | undefined,
  providerMetadata: ProviderMetadataSnapshot | null,
  citationCount: number,
): ScanRunInsightSnapshot | null {
  const record = isRecord(summary) ? summary : null;
  if (!record && !providerMetadata && citationCount === 0) return null;

  return {
    citationCount:
      typeof record?.citationCount === "number"
        ? record.citationCount
        : citationCount,
    eventCount:
      typeof record?.eventCount === "number" ? record.eventCount : 0,
    modelName:
      typeof record?.modelName === "string" ? record.modelName : null,
    providerCostUsd:
      typeof record?.providerCostUsd === "number"
        ? record.providerCostUsd
        : providerMetadata?.providerCostUsd ?? null,
    missingAiOverview:
      typeof record?.missingAiOverview === "boolean"
        ? record.missingAiOverview
        : providerMetadata?.missingAiOverview ?? undefined,
    inputTokens:
      typeof record?.inputTokens === "number"
        ? record.inputTokens
        : providerMetadata?.inputTokens ?? null,
    outputTokens:
      typeof record?.outputTokens === "number"
        ? record.outputTokens
        : providerMetadata?.outputTokens ?? null,
    mentionCandidateCount:
      typeof record?.mentionCandidateCount === "number"
        ? record.mentionCandidateCount
        : providerMetadata?.mentionCandidateCount ?? undefined,
    responseRetained:
      typeof record?.responseRetained === "boolean"
        ? record.responseRetained
        : true,
  };
}
