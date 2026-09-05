import { AI_SURFACE_KEYS } from "@/types/product";

import type { MonitoringProviderMetadata } from "@/lib/providers/types";
import { NORMALIZATION_VERSION } from "@/lib/providers/types";

export const MOCK_ADAPTER_VERSION = "2026.09.04";

export const MOCK_PROVIDER_METADATA: MonitoringProviderMetadata = Object.freeze({
  id: "mock",
  displayName: "Mock (demo and test)",
  adapterVersion: MOCK_ADAPTER_VERSION,
  normalizationVersion: NORMALIZATION_VERSION,
  supportedSurfaces: AI_SURFACE_KEYS,
  supportedExecutionStrategies: ["fixture_sync", "live_async"] as const,
  requiresPolling: true,
  suggestedPollIntervalSeconds: 1,
  operationalNotes: Object.freeze([
    "Deterministic fictional fixtures only.",
    "Never contacts external networks.",
    "Blocked in Cited Cloud production.",
  ]),
  capabilityStatus: "available",
});
