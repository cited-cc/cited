# Building an adapter

Provider adapters implement a narrow interface between Cited's monitoring engine and external AI data sources.

## Boundaries

- Adapters live under `lib/providers/`
- Community edition includes `mock` and `dataforseo` adapters only
- Adapters must not import Cloud-only modules (billing, Clerk, Resend)
- External network calls require explicit operator configuration

## Mock adapter

Use the mock adapter as a reference for:

- Surface coverage
- Deterministic fixtures
- Error simulation (timeouts, rate limits, malformed payloads)

## Adding a provider

1. Implement the provider interface in `lib/providers/`
2. Register the adapter in the provider factory
3. Add environment validation in `lib/env/index.ts`
4. Document credentials and surface support
5. Add boundary tests and `provider:check` coverage

## Verification

```bash
npm run provider:check
npm run provider:doctor
npm run test:boundary
```

## Related

- [Provider adapters](../open-source/provider-adapters.md)
- [Monitoring engine](../monitoring-engine.md)
