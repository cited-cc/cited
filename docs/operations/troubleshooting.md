# Troubleshooting

Run diagnostics first:

```bash
npm run self-host:doctor
npm run self-host:status
```

## Common issues

| Symptom | Action |
| --- | --- |
| Health timeout | `npm run self-host:logs web` and check `migrate` logs |
| Missing secrets | `npm run self-host:init` |
| Port conflict | Set `CITED_WEB_PORT` in `.cited/config.env` |
| Permission errors on secrets | `chmod 600 .cited/secrets/*` |
| Mock data in production | Switch to DataForSEO and set `CITED_ALLOW_MOCK_PROVIDER=false` |
| No scan results | Confirm worker is running; check `npm run self-host:logs worker` |
| Database connection errors | Verify `DATABASE_URL` and secret files |

## Doctor commands

```bash
npm run monitoring:doctor
npm run provider:doctor
npm run auth:check
npm run database:check
```

## Related

- [Quickstart](../getting-started/quickstart.md)
- In-app troubleshooting guide at `/docs/troubleshooting`
