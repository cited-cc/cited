# Configuration

Self-hosted Cited separates **secrets** from **configuration**.

## Files

| Path | Type | Purpose |
| --- | --- | --- |
| `.cited/secrets/*` | Secret files | Passwords, tokens, encryption keys |
| `.cited/config.env` | Non-secret config | Provider, ports, feature flags |
| `.env.local` | Local dev only | Developer workstation overrides |

Never commit secret files or real credentials.

## Secret file support

Many variables accept a `*_FILE` companion that reads the value from disk (Docker and Compose friendly):

- `AUTH_SECRET` / `AUTH_SECRET_FILE`
- `DATABASE_PASSWORD` / `DATABASE_PASSWORD_FILE`
- `CITED_BOOTSTRAP_TOKEN` / `CITED_BOOTSTRAP_TOKEN_FILE`
- `MONITORING_CRON_SECRET` / `MONITORING_CRON_SECRET_FILE`

See [environment variables reference](../reference/environment-variables.md) for the full list.

## Core settings

```bash
CITED_DEPLOYMENT_MODE=self_hosted
CITED_AUTH_PROVIDER=local
CITED_DATABASE_PROVIDER=postgres
CITED_MONITORING_PROVIDER=mock
CITED_ALLOW_MOCK_PROVIDER=true
MONITORING_ENABLED=true
NOTIFICATIONS_ENABLED=false
CITED_EMAIL_PROVIDER=disabled
```

## Provider switch

Mock (default, offline):

```bash
CITED_MONITORING_PROVIDER=mock
CITED_ALLOW_MOCK_PROVIDER=true
```

Live monitoring with operator-supplied credentials:

- Set `CITED_MONITORING_PROVIDER` to `dataforseo`
- Set `CITED_ALLOW_MOCK_PROVIDER` to `false`
- Add DataForSEO login and password via `.cited/config.env` or secret files (see [DataForSEO guide](../providers/dataforseo.md))

Restart the stack after changing provider configuration.

## Port and URL

```bash
CITED_WEB_PORT=3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Operational limits

Optional self-hosted safety caps (integer or `unlimited`):

```bash
CITED_SELF_HOSTED_MAX_USERS=unlimited
CITED_SELF_HOSTED_MAX_DOMAINS=unlimited
CITED_SELF_HOSTED_MAX_MONITORS=unlimited
CITED_SELF_HOSTED_MAX_PROMPTS=unlimited
CITED_SELF_HOSTED_HISTORY_DAYS=unlimited
```

## Related

- [Environment variables](../reference/environment-variables.md)
- [Docker operations](../operations/docker.md)
- [Notifications](../operations/notifications.md)
