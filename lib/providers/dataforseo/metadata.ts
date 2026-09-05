import { getDataForSeoExecutableSurfaces } from "@/lib/providers/dataforseo/surfaces";
import type { MonitoringProviderMetadata } from "@/lib/providers/types";
import { NORMALIZATION_VERSION } from "@/lib/providers/types";

export const DATAFORSEO_ADAPTER_VERSION = "2026.09.04";

export const DATAFORSEO_PROVIDER_METADATA: MonitoringProviderMetadata =
  Object.freeze({
    id: "dataforseo",
    displayName: "DataForSEO",
    adapterVersion: DATAFORSEO_ADAPTER_VERSION,
    normalizationVersion: NORMALIZATION_VERSION,
    supportedSurfaces: getDataForSeoExecutableSurfaces(),
    supportedExecutionStrategies: ["live_sync"] as const,
    requiresPolling: false,
    suggestedPollIntervalSeconds: 0,
    operationalNotes: Object.freeze([
      "Bring your own DataForSEO credentials.",
      "LLM Responses for ChatGPT, Gemini, Perplexity, and Claude.",
      "Google SERP Live Advanced for AI Overviews and AI Mode.",
      "Provider charges are billed to your DataForSEO account.",
    ]),
    capabilityStatus: "available",
  });
