# Provider overview

Cited queries AI surfaces through **provider adapters**. Community edition ships two public adapters:

| Provider | Purpose | External calls |
| --- | --- | --- |
| [Mock](mock.md) | Demos, tests, offline development | None |
| [DataForSEO](dataforseo.md) | Live monitoring | Requires operator credentials |

Select the active provider with `CITED_MONITORING_PROVIDER`.

## Surface routing

Optional per-surface routing via `CITED_SURFACE_PROVIDER_MAP` (JSON object). When unset, the primary provider handles all enabled surfaces.

## Mock default

Docker quickstart defaults to mock mode:

```bash
CITED_MONITORING_PROVIDER=mock
CITED_ALLOW_MOCK_PROVIDER=true
```

## Live monitoring

DataForSEO requires **bring-your-own credentials**. Cited does not bundle DataForSEO access.

## Related

- [Building an adapter](building-an-adapter.md)
- [Provider adapters (maintainer)](../open-source/provider-adapters.md)
