import { getAiSurfaceDefinition } from "@/lib/monitoring/surfaces";
import type { NormalizedScanRequest } from "@/lib/monitoring/types";
import { DataForSeoError } from "@/lib/providers/dataforseo/errors";
import {
  DATAFORSEO_MAX_OUTPUT_TOKENS,
  DATAFORSEO_MAX_PROMPT_CHARS,
} from "@/lib/providers/dataforseo/rate-limit";
import type { DataForSeoLiveRequestPayload } from "@/lib/providers/dataforseo/types";

/**
 * Build bounded DataForSEO Live LLM Responses task payloads.
 * Never include secrets, emails, or workspace internals in provider tags.
 */
export function buildDataForSeoLiveTask(
  request: NormalizedScanRequest,
): DataForSeoLiveRequestPayload[] {
  const surface = getAiSurfaceDefinition(request.aiSurface);
  const prompt = request.prompt.trim().slice(0, DATAFORSEO_MAX_PROMPT_CHARS);
  if (prompt.length < 1) {
    throw new DataForSeoError({
      code: "provider_validation_error",
      message: "Prompt is empty.",
      retryable: false,
    });
  }

  const payload: DataForSeoLiveRequestPayload = {
    model_name: surface.defaultModelName,
    user_prompt: prompt,
    max_output_tokens: DATAFORSEO_MAX_OUTPUT_TOKENS,
    tag: request.scanRunId.slice(0, 255),
  };

  // Perplexity Sonar models use web search by default; the live endpoint
  // does not document a web_search request field.
  if (request.aiSurface !== "perplexity") {
    payload.web_search = true;
  }

  if (request.aiSurface === "gemini" || request.aiSurface === "claude") {
    payload.use_reasoning = false;
  }

  if (surface.supportsLocation && request.countryCode) {
    payload.web_search_country_iso_code = request.countryCode.toUpperCase();
    // Perplexity live documents country ISO only, not city.
    if (request.aiSurface !== "perplexity" && request.city?.trim()) {
      payload.web_search_city = request.city.trim().slice(0, 100);
    }
  }

  return [payload];
}
