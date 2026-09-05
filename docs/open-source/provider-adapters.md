# Monitoring provider adapters

Phase 8 introduces a typed, server-controlled monitoring provider registry for Cited.

## Architecture

```
monitoring engine
  -> provider router (env-selected ID, optional per-surface map)
  -> registered adapter (DataForSEO, mock, future adapters)
  -> normalized request/result contract
  -> local classification and evidence persistence
```

Core monitoring code must never import DataForSEO payload builders directly. Adapters live under `lib/providers/`.

## Normalized contracts

- **Request**: scan run identity, surface, prompt, locale/location, run metadata. No credentials, billing data, or workspace emails.
- **Result**: surface, provider ID, response text, citations, optional usage, bounded raw payload, normalization version.
- Classification (brand, competitor, recommendation, missed opportunity) stays in Cited core.

## Registration

Adapters register statically in `lib/providers/bootstrap.ts`. Environment variables may select registered IDs only. Arbitrary package paths or filesystem imports from configuration are forbidden.

## Surface declarations

Each adapter metadata object lists supported `AiSurfaceKey` values. Unsupported surface and provider combinations fail before any network request.

## Submit vs poll

- DataForSEO live endpoints complete synchronously in Phase 8.
- Mock adapter can return pending tasks to exercise polling paths.

## Error taxonomy

Provider-neutral errors live in `lib/providers/errors.ts` with stable codes, retry hints, and safe public messages. Errors must never include credentials, authorization headers, full prompts, or full provider responses.

## Timeouts and cancellation

Adapters honor `MONITORING_PROVIDER_TIMEOUT_MS` and abort signals. Cancellation is optional per adapter.

## Fixtures

Adapter tests use sanitized JSON fixtures under `tests/fixtures/dataforseo/`. Fixtures must use fictional brands/domains only.

## Credential handling

- DataForSEO: `DATAFORSEO_LOGIN`, `DATAFORSEO_PASSWORD` (server only)
- Provider selection: `CITED_MONITORING_PROVIDER`
- Optional surface map: `CITED_SURFACE_PROVIDER_MAP` JSON object
- Self-hosted mock override: `CITED_ALLOW_MOCK_PROVIDER=true`

Cited does not bundle provider credentials.

## Logging restrictions

Never log authorization headers, credential values, or full prompt/answer bodies in routine logs.

## Raw payload rules

Persist redacted, size-capped raw payloads only. Unknown provider fields must not flow automatically into workspace tables.

## Testing contract

Every adapter must pass `tests/provider-contract.test.ts` and adapter-specific fixture tests.

## Security expectations

- Server-only adapter imports
- Endpoint allowlists for live adapters
- Mock blocked in Cited Cloud production
- No client-controlled provider routing

## Licensing

Adapter dependencies must remain compatible with the repository license. Do not ship unofficial session tokens or scraped credentials.

## Example minimal adapter

1. Define immutable metadata with supported surfaces.
2. Implement `MonitoringProvider` (`validateConfiguration`, `submitScan`, optional `pollTask`).
3. Normalize all external payloads before returning.
4. Register in `lib/providers/bootstrap.ts`.
5. Add sanitized fixtures and contract tests.

Dynamic loading from environment variables is prohibited.
