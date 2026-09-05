import type { AiSurfaceKey } from "@/types/product";

import {
  getAiSurfaceDefinition,
  isAiSurfaceEnabled,
} from "@/lib/monitoring/surfaces";
import type { AiSurfaceDefinition as SurfaceDef } from "@/lib/monitoring/surfaces";

export type {
  CitationMonitoringProvider,
  CostEstimate,
  CreateScanInput,
  CreateScanResult,
  EstimateCostInput,
  GetScanResultInput,
  NormalizedScanResult,
  NormalizedSource,
} from "@/lib/monitoring/provider";

export type {
  AiSurfaceDefinition,
  AiSurfaceRequestStrategy,
} from "@/lib/monitoring/surfaces";

export type * from "@/lib/monitoring/types";

export { MockCitationMonitoringProvider } from "@/lib/monitoring/providers/mock";
export { createMonitoringProvider, createMonitoringProviderForSurface, createTestMonitoringProvider } from "@/lib/monitoring/factory";
export { runMonitoringDispatcher } from "@/lib/monitoring/dispatcher";
export { activateMonitorsForWorkspace } from "@/lib/monitoring/activate-monitors";
export { classifyNormalizedResult } from "@/lib/classification";
export { getMonitoringHealthSnapshot } from "@/lib/monitoring/health";
export {
  getAiSurfaceDefinition,
  getEnabledAiSurfaces,
  getSelectableAiSurfacesForPlan,
  isAiSurfaceEnabled,
  listAiSurfaceDefinitions,
  getMonitoringSafetyLimits,
  estimateMonthlyChecks,
} from "@/lib/monitoring/surfaces";

/**
 * AI_SURFACES map for product UI.
 * `status` reflects runtime enablement, not marketing promises.
 */
export type LegacyAiSurfaceDefinition = {
  key: AiSurfaceKey;
  displayName: string;
  category: "chat" | "search";
  supportsCitations: boolean;
  supportsMentions: boolean;
  supportsLocation: boolean;
  supportsScheduledMonitoring: boolean;
  status: "planned" | "beta" | "ga" | "disabled";
};

function toLegacy(def: SurfaceDef): LegacyAiSurfaceDefinition {
  return {
    key: def.key,
    displayName: def.displayName,
    category:
      def.key === "google_ai_overviews" ||
      def.key === "google_ai_mode" ||
      def.key === "perplexity"
        ? "search"
        : "chat",
    supportsCitations: def.supportsCitations,
    supportsMentions: def.supportsBrandMentions,
    supportsLocation: def.supportsLocation,
    supportsScheduledMonitoring: def.supportsScheduledMonitoring,
    status: isAiSurfaceEnabled(def.key)
      ? "beta"
      : def.enabled
        ? "planned"
        : "disabled",
  };
}

export const AI_SURFACES: Record<AiSurfaceKey, LegacyAiSurfaceDefinition> = {
  chatgpt: toLegacy(getAiSurfaceDefinition("chatgpt")),
  gemini: toLegacy(getAiSurfaceDefinition("gemini")),
  google_ai_overviews: toLegacy(getAiSurfaceDefinition("google_ai_overviews")),
  google_ai_mode: toLegacy(getAiSurfaceDefinition("google_ai_mode")),
  perplexity: toLegacy(getAiSurfaceDefinition("perplexity")),
  claude: toLegacy(getAiSurfaceDefinition("claude")),
};

export function getAiSurface(key: AiSurfaceKey): LegacyAiSurfaceDefinition {
  return AI_SURFACES[key];
}
