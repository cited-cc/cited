# DataForSEO integration

## Endpoints implemented

Official AI Optimization LLM Responses **Live** endpoints:

| Surface | Endpoint | Location support |
| --- | --- | --- |
| ChatGPT | `POST /v3/ai_optimization/chat_gpt/llm_responses/live` | Yes (`web_search_country_iso_code`, `web_search_city`) |
| Gemini | `POST /v3/ai_optimization/gemini/llm_responses/live` | No (not documented on Gemini live) |
| Perplexity | `POST /v3/ai_optimization/perplexity/llm_responses/live` | Country ISO only (no city; web search is default on Sonar) |
| Claude | `POST /v3/ai_optimization/claude/llm_responses/live` | Yes (`web_search_country_iso_code`, `web_search_city`) |

Official Google SERP **Live Advanced** endpoints:

| Surface | Endpoint | Notes |
| --- | --- | --- |
| Google AI Overviews | `POST /v3/serp/google/organic/live/advanced` | `load_async_ai_overview: true`; citations from `ai_overview` references |
| Google AI Mode | `POST /v3/serp/google/ai_mode/live/advanced` | English language only; citations from `ai_overview` references |

Authentication: HTTP Basic with `DATAFORSEO_LOGIN` / `DATAFORSEO_PASSWORD`.

Base URL: `DATAFORSEO_API_BASE_URL` (production allowlisted to `api.dataforseo.com` / `sandbox.dataforseo.com`).

## Surface support matrix

| Surface | Enabled | Strategy | Notes |
| --- | --- | --- | --- |
| chatgpt | yes | `llm_response` | Default model `gpt-4.1-mini`, `web_search=true` |
| gemini | yes | `llm_response` | Default model `gemini-2.5-flash`, `web_search=true` |
| perplexity | yes | `llm_response` | Default model `sonar`; omit `web_search` (Sonar default) |
| claude | yes | `llm_response` | Default model `claude-3-5-sonnet-latest`, `web_search=true` |
| google_ai_overviews | yes | `serp_ai_overview` | Requires `location_code`; missing overview completes with empty evidence |
| google_ai_mode | yes | `serp_ai_mode` | Requires `location_code`; English only |

Runtime allowlist: `MONITORING_ENABLED_SURFACES` (default all six).

Plan entitlements:

| Plan | Surfaces |
| --- | --- |
| Founder | ChatGPT, Gemini |
| Growth | ChatGPT, Gemini, Perplexity |
| Pro | ChatGPT, Gemini, Perplexity, Claude, Google AI Overviews, Google AI Mode |

## Normalization

Adapter: `DataForSeoCitationMonitoringProvider` in `lib/providers/dataforseo/client.ts`.

LLM path extracts:

- response text from `result[].items[].sections[].text`
- citations from section `annotations[].url/title`
- model name, task id, task `cost` / `money_spent`

SERP path extracts:

- response text from `ai_overview.markdown` or element text
- citations from `ai_overview.references[]` (including nested element references)
- `missingAiOverview` metadata when no overview item is present

Application code only consumes `NormalizedAiResult`.

## SERP locations

`lib/providers/dataforseo/locations.ts` maps ISO country codes (and a small city table) to DataForSEO `location_code`. Unsupported countries fail with `provider_validation_error`.

## Task lifecycle

Live endpoints complete in one request. The durable pipeline still supports pending/poll for mock fixtures and future Standard (POST-GET) methods.

Provider task mapping: `provider_tasks` prevents duplicate submissions after crashes.

## Timeouts and retries

- `MONITORING_PROVIDER_TIMEOUT_MS` (default 90000; Live LLM Responses can take up to ~120s)
- `INTERNAL_JOB_TIMEOUT_MS` (default 130000; must exceed provider timeout)
- 429 → retryable `provider_rate_limited`
- 5xx → retryable `provider_unavailable`
- Malformed/empty LLM response → non-retryable `provider_invalid_response`
- Missing SERP AI Overview → completed empty result (not a hard fail)

## Cost handling

If DataForSEO returns `cost` or `money_spent`, store as `provider_cost_type=actual`.

Otherwise `unknown`. Never fabricate pricing. Costs are internal only in Phase 5.

## Feature flags

- `MONITORING_ENABLED` must be true for outbound calls
- `MONITORING_ALLOW_MOCK_PROVIDER` local/test only; rejected in production
- `MONITORING_PROVIDER=mock` rejected in production

## Local mock strategy

`MockCitationMonitoringProvider` returns labeled `[MOCK DATA]` fixtures for citations, mentions, recommendations, competitors, rate limits, timeouts, and pending polls.

## Adding another AI surface

1. Confirm official DataForSEO docs + account access
2. Add adapter parsing + fixtures/tests
3. Set `enabled: true` and request strategy in `lib/monitoring/surfaces.ts`
4. Add surface to `MONITORING_ENABLED_SURFACES`
5. Update plan entitlements only if the public plan includes it
