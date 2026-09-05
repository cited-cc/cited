/**
 * DataForSEO is the reference live monitoring provider adapter.
 *
 * Boundary: DataForSEO response -> normalize -> response snapshot -> evidence -> classification
 *
 * Credentials are server-only. Never call from Client Components, demo, or public renders.
 */

import "@/lib/providers/bootstrap";

export {
  DataForSeoMonitoringProvider,
  DataForSeoCitationMonitoringProvider,
} from "@/lib/providers/dataforseo/client";
export {
  DataForSeoError,
  mapDataForSeoEnvelopeStatus,
  mapDataForSeoHttpStatus,
} from "@/lib/providers/dataforseo/errors";
export {
  DATAFORSEO_ADAPTER_VERSION,
  DATAFORSEO_PROVIDER_METADATA,
} from "@/lib/providers/dataforseo/metadata";
export { resolveDataForSeoLocationCode } from "@/lib/providers/dataforseo/locations";
export { normalizeDataForSeoLiveResponse } from "@/lib/providers/dataforseo/normalize";
export { normalizeDataForSeoSerpResponse } from "@/lib/providers/dataforseo/normalize-serp";
export {
  clampDataForSeoBatchSize,
  DATAFORSEO_DEFAULT_TIMEOUT_MS,
  DATAFORSEO_MAX_CONCURRENT_REQUESTS,
  DATAFORSEO_MAX_KEYWORD_CHARS,
  DATAFORSEO_MAX_OUTPUT_TOKENS,
  DATAFORSEO_MAX_PROMPT_CHARS,
  isDataForSeoRetryableStatus,
} from "@/lib/providers/dataforseo/rate-limit";
export { buildDataForSeoSerpTask } from "@/lib/providers/dataforseo/serp-tasks";
export {
  assertDataForSeoSurfaceExecutable,
  getDataForSeoExecutableSurfaces,
  getDataForSeoLiveEndpoint,
  isDataForSeoSerpSurface,
} from "@/lib/providers/dataforseo/surfaces";
export { buildDataForSeoLiveTask } from "@/lib/providers/dataforseo/tasks";
export type {
  DataForSeoClientOptions,
  DataForSeoEnvelope,
  DataForSeoLiveRequestPayload,
  DataForSeoResultItem,
  DataForSeoSerpRequestPayload,
  DataForSeoSerpResult,
  DataForSeoTask,
} from "@/lib/providers/dataforseo/types";
