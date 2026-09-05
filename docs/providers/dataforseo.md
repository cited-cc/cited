# DataForSEO provider

Live monitoring uses the DataForSEO API with **operator-supplied credentials**.

## Requirements

- DataForSEO account and API login/password
- `CITED_MONITORING_PROVIDER=dataforseo`
- `CITED_ALLOW_MOCK_PROVIDER=false`
- `MONITORING_ENABLED=true`

## Configuration

Set in `.cited/config.env` or via secret files:

- `CITED_MONITORING_PROVIDER` → `dataforseo`
- `CITED_ALLOW_MOCK_PROVIDER` → `false`
- `MONITORING_ENABLED` → `true`
- `DATAFORSEO_LOGIN` and `DATAFORSEO_PASSWORD` (or `DATAFORSEO_PASSWORD_FILE`)
- `DATAFORSEO_API_BASE_URL` → official DataForSEO host (default: `https://api.dataforseo.com`)

Secret file variants (`DATAFORSEO_PASSWORD_FILE`) are supported.

## Surface availability

Supported surfaces depend on DataForSEO API coverage. Cited does not guarantee every surface in every region.

## Restart

Restart the stack after changing credentials or provider settings:

```bash
npm run self-host:down
npm run self-host:up
```

## Diagnostics

```bash
npm run provider:doctor
```

Do not use `--live` against production systems without authorization.

## Related

- [DataForSEO integration](../dataforseo-integration.md)
- [open-source DataForSEO guide](../open-source/providers/dataforseo.md)
