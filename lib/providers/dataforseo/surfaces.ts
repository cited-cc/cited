import {
  getAiSurfaceDefinition,
  isAiSurfaceEnabled,
  isSerpSurfaceStrategy,
  listAiSurfaceDefinitions,
  type AiSurfaceRequestStrategy,
} from "@/lib/monitoring/surfaces";
import type { AiSurfaceKey } from "@/types/product";

function isExecutableStrategy(strategy: AiSurfaceRequestStrategy): boolean {
  return (
    strategy === "llm_response" ||
    strategy === "serp_ai_overview" ||
    strategy === "serp_ai_mode"
  );
}

/**
 * Surfaces Cited can execute through DataForSEO.
 */

export function getDataForSeoExecutableSurfaces(): AiSurfaceKey[] {
  return listAiSurfaceDefinitions()
    .filter(
      (surface) =>
        surface.enabled &&
        isExecutableStrategy(surface.requestStrategy) &&
        Boolean(surface.liveEndpointPath) &&
        isAiSurfaceEnabled(surface.key),
    )
    .map((surface) => surface.key);
}

export function getDataForSeoLiveEndpoint(
  aiSurface: AiSurfaceKey,
): string | null {
  const surface = getAiSurfaceDefinition(aiSurface);
  if (
    !surface.enabled ||
    !isExecutableStrategy(surface.requestStrategy) ||
    !surface.liveEndpointPath
  ) {
    return null;
  }
  return surface.liveEndpointPath;
}

export function assertDataForSeoSurfaceExecutable(
  aiSurface: AiSurfaceKey,
): void {
  if (!getDataForSeoLiveEndpoint(aiSurface)) {
    throw new Error(`AI surface ${aiSurface} is not executable via DataForSEO.`);
  }
}

export function isDataForSeoSerpSurface(aiSurface: AiSurfaceKey): boolean {
  return isSerpSurfaceStrategy(
    getAiSurfaceDefinition(aiSurface).requestStrategy,
  );
}
