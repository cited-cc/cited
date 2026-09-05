# DataForSEO provider

DataForSEO is the only product-data provider in Cited v1.

## Module layout

```text
lib/providers/dataforseo/
  client.ts         HTTP adapter (server-only)
  types.ts          wire schemas
  normalize.ts      LLM → NormalizedAiResult
  normalize-serp.ts SERP → NormalizedAiResult
  locations.ts      country/city → location_code
  serp-tasks.ts     SERP request payload builder
  errors.ts         safe error codes
  rate-limit.ts     timeouts / batch clamps
  surfaces.ts       executable surface map
  tasks.ts          LLM request payload builder
```

Compatibility re-exports remain under `lib/monitoring/providers/dataforseo.ts`.

## Rules

- Credentials (`DATAFORSEO_LOGIN`, `DATAFORSEO_PASSWORD`) are server-only.
- No calls from Client Components, demo routes, marketing pages, or free-scan public forms.
- Calls happen only from monitoring cron / execute-scan-run paths.
- Responses are normalized before persistence.
- Raw payloads are redacted, byte-capped (`MONITORING_MAX_RAW_PAYLOAD_BYTES`), and never returned to UI/exports/logs/email/Slack.
- Timeouts, retries, and batch sizes are bounded by env.
- Provider unavailable states fail the scan run safely; they do not crash the app.

## Supported surfaces (v1)

| Surface | Strategy | Status |
| --- | --- | --- |
| ChatGPT | LLM Responses Live | Enabled |
| Gemini | LLM Responses Live | Enabled |
| Perplexity | LLM Responses Live | Enabled |
| Claude | LLM Responses Live | Enabled |
| Google AI Overviews | SERP Organic Live Advanced | Enabled |
| Google AI Mode | SERP AI Mode Live Advanced | Enabled |

## Error mapping

Provider failures map to safe categories:

- `provider_timeout`
- `provider_rate_limited`
- `provider_unavailable`
- `provider_invalid_response`
- `provider_validation_error`
- `unsupported_surface`

Customer messages never include raw DataForSEO status text.

## Ops

See `docs/runbook-provider-dataforseo.md`.
