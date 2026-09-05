# DataForSEO monitoring adapter

DataForSEO is the reference live monitoring provider in Cited Phase 8.

## Bring your own credentials

Self-hosted and Cloud operators supply their own DataForSEO account:

```env
CITED_MONITORING_PROVIDER=dataforseo
DATAFORSEO_LOGIN=
DATAFORSEO_PASSWORD=
```

Cited does not bundle DataForSEO credentials. Provider usage is billed to your DataForSEO account.

## Supported surfaces

| Surface | Strategy |
| --- | --- |
| ChatGPT | LLM Responses Live |
| Gemini | LLM Responses Live |
| Perplexity | LLM Responses Live |
| Claude | LLM Responses Live |
| Google AI Overviews | Google SERP Live Advanced |
| Google AI Mode | Google SERP Live Advanced |

Surface availability still depends on plan entitlements and `MONITORING_ENABLED_SURFACES`.

## Configuration

| Variable | Purpose |
| --- | --- |
| `CITED_MONITORING_PROVIDER` | Select `dataforseo` |
| `DATAFORSEO_LOGIN` | API login (server only) |
| `DATAFORSEO_PASSWORD` | API password (server only) |
| `DATAFORSEO_API_BASE_URL` | Official API host only in production |
| `MONITORING_PROVIDER_TIMEOUT_MS` | Request timeout (default 90000) |

Custom API hosts are limited to official DataForSEO domains in production.

## Operational notes

- Live endpoints complete synchronously; polling is not used for DataForSEO in Phase 8.
- Consumer-product answers may differ from direct model APIs.
- Validate offline with `npm run provider:doctor` (no live calls by default).

## Security

Credentials never appear in logs, browser bundles, or provider task rows.
