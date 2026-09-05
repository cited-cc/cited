# Self-hosting Cited

Phase 11 adds a one-command Docker Compose path for local self-hosted installations. No Cited Cloud account, Stripe subscription, or hosted credentials are required.

## Prerequisites

- Docker Engine with Compose v2 (`docker compose`)
- Node.js 22+ (for local tooling scripts only)
- 4 GB RAM minimum recommended for web, worker, and PostgreSQL together
- Architecture: `linux/amd64` and `linux/arm64` are targeted when native dependencies permit. Verify on your host before production use.

## One-command startup

```bash
npm ci
npm run self-host:up
```

This will:

1. Validate Docker availability
2. Generate local secrets in `.cited/secrets/` when missing
3. Build the application image locally (nothing is published)
4. Start PostgreSQL 17, run migrations, then start web and worker services
5. Wait for `/api/health` readiness

Open the printed URL (default `http://localhost:3000`).

## First owner setup

1. Retrieve the one-time bootstrap token: `npm run self-host:token`
2. Visit `/setup` and create the first workspace owner
3. Sign in at `/sign-in`

The bootstrap token is never printed automatically during startup.

## Secret generation

`npm run self-host:init` creates cryptographically random secret files with `0600` permissions:

| File | Purpose |
| --- | --- |
| `postgres_owner_password` | PostgreSQL superuser bootstrap and migration role |
| `postgres_runtime_password` | Application runtime database role |
| `auth_secret` | Session signing |
| `bootstrap_token` | First-owner setup gate |
| `monitoring_cron_secret` | Internal scheduler authentication |
| `slack_webhook_encryption_key` | Slack webhook encryption at rest |

Existing secrets are never overwritten. Rotate manually by generating new files while the stack is stopped, then restart services.

Non-secret configuration lives in `.cited/config.env` (copied from `.env.docker.example`).

## Defaults

- Monitoring provider: **mock** (no external provider calls)
- Notifications: **disabled**
- Email provider: **disabled**
- Auth: **local** email and password
- Database: **PostgreSQL 17** with separate migration and runtime roles

## Common commands

```bash
npm run self-host:status
npm run self-host:logs
npm run self-host:down
npm run self-host:doctor
npm run self-host:backup
npm run self-host:upgrade
```

`self-host:down` stops containers and preserves database volumes and secret files.

## Mock vs DataForSEO

Keep mock mode for demos and offline use:

```bash
CITED_MONITORING_PROVIDER=mock
CITED_ALLOW_MOCK_PROVIDER=true
```

For live monitoring, set DataForSEO credentials in `.cited/config.env` and switch provider:

```bash
CITED_MONITORING_PROVIDER=dataforseo
CITED_ALLOW_MOCK_PROVIDER=false
MONITORING_ENABLED=true
```

Restart the stack after changing provider configuration.

## SMTP and Slack (optional)

Enable SMTP through `.cited/config.env`:

```bash
NOTIFICATIONS_ENABLED=true
CITED_EMAIL_PROVIDER=smtp
SMTP_HOST=mailpit
SMTP_PORT=1025
SMTP_FROM_EMAIL=cited@example.com
```

Use the Mailpit profile for local capture:

```bash
docker compose --profile mailpit up -d
```

Slack webhooks are configured per workspace in the application UI after startup.

## Cloud vs self-hosted

| Capability | Cloud | Self-hosted Docker |
| --- | --- | --- |
| Auth | Clerk | Local credentials |
| Database | Supabase | PostgreSQL 17 |
| Billing | Stripe | Not required |
| Monitoring provider | DataForSEO | Mock by default |
| Notifications | Resend | Disabled by default |
| Scheduler | Vercel Cron | Portable worker |

See [deployment-modes.md](./deployment-modes.md) for the full matrix.

## Troubleshooting

Run `npm run self-host:doctor` first.

| Symptom | Action |
| --- | --- |
| Health timeout | `npm run self-host:logs web` and `migrate` |
| Missing secrets | `npm run self-host:init` |
| Port conflict | Set `CITED_WEB_PORT` in `.cited/config.env` |
| Permission errors on secrets | `chmod 600 .cited/secrets/*` |

## What not to commit

- `.cited/secrets/*`
- `.cited/backups/*`
- Any `.env` file with real credentials

## Related docs

- [docker.md](./docker.md)
- [backups-and-upgrades.md](./backups-and-upgrades.md)
- [database.md](./database.md)
- [authentication.md](./authentication.md)

Publication remains blocked until later phases complete.
