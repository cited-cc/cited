/**
 * Soft rate-limit guidance for DataForSEO batching.
 * Hard limits are enforced by MONITORING_* batch env vars and usage ledger.
 */

/** Live LLM Responses can take up to ~120s per DataForSEO docs. */
export const DATAFORSEO_DEFAULT_TIMEOUT_MS = 90_000;
export const DATAFORSEO_MAX_PROMPT_CHARS = 500;
/** Google SERP keyword field limit. */
export const DATAFORSEO_MAX_KEYWORD_CHARS = 700;
export const DATAFORSEO_MAX_OUTPUT_TOKENS = 2048;
export const DATAFORSEO_MAX_CONCURRENT_REQUESTS = 5;

export function clampDataForSeoBatchSize(requested: number): number {
  if (!Number.isFinite(requested) || requested < 1) return 1;
  return Math.min(Math.floor(requested), DATAFORSEO_MAX_CONCURRENT_REQUESTS);
}

export function isDataForSeoRetryableStatus(statusCode: number): boolean {
  return (
    statusCode === 429 ||
    statusCode === 408 ||
    statusCode === 504 ||
    statusCode >= 500 ||
    statusCode === 40201 ||
    statusCode === 40204 ||
    statusCode === 40102 ||
    statusCode >= 50000
  );
}
