import { getAiSurfaceDefinition } from "@/lib/monitoring/surfaces";
import type { NormalizedScanRequest } from "@/lib/monitoring/types";
import { DataForSeoError } from "@/lib/providers/dataforseo/errors";
import { resolveDataForSeoLocationCode } from "@/lib/providers/dataforseo/locations";
import { DATAFORSEO_MAX_KEYWORD_CHARS } from "@/lib/providers/dataforseo/rate-limit";
import type { DataForSeoSerpRequestPayload } from "@/lib/providers/dataforseo/types";

/**
 * Build DataForSEO Google SERP Live Advanced payloads for AI Overviews / AI Mode.
 */
export function buildDataForSeoSerpTask(
  request: NormalizedScanRequest,
): DataForSeoSerpRequestPayload[] {
  const surface = getAiSurfaceDefinition(request.aiSurface);
  if (
    surface.requestStrategy !== "serp_ai_overview" &&
    surface.requestStrategy !== "serp_ai_mode"
  ) {
    throw new DataForSeoError({
      code: "unsupported_surface",
      message: `Surface ${request.aiSurface} is not a SERP strategy.`,
      retryable: false,
    });
  }

  const keyword = request.prompt.trim().slice(0, DATAFORSEO_MAX_KEYWORD_CHARS);
  if (keyword.length < 1) {
    throw new DataForSeoError({
      code: "provider_validation_error",
      message: "Prompt is empty.",
      retryable: false,
    });
  }

  const languageCode = request.languageCode.trim().toLowerCase() || "en";
  if (surface.requestStrategy === "serp_ai_mode" && languageCode !== "en") {
    throw new DataForSeoError({
      code: "provider_validation_error",
      message: "Google AI Mode monitoring currently supports English only.",
      safeMessage: "Google AI Mode monitoring currently supports English only.",
      retryable: false,
    });
  }

  const locationCode = resolveDataForSeoLocationCode({
    countryCode: request.countryCode,
    city: request.city,
  });

  const payload: DataForSeoSerpRequestPayload = {
    keyword,
    language_code: languageCode,
    location_code: locationCode,
    device: "desktop",
    os: "windows",
    tag: request.scanRunId.slice(0, 255),
  };

  if (surface.requestStrategy === "serp_ai_overview") {
    payload.load_async_ai_overview = true;
  }

  return [payload];
}
