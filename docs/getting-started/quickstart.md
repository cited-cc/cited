# Quickstart

Run Cited locally with Docker Compose. This path uses the **mock provider** by default (fictional data, no external AI API calls).

## Prerequisites

- Docker Engine with Compose v2 (`docker compose`)
- Node.js 22+ for repository tooling scripts
- 4 GB RAM recommended for web, worker, and PostgreSQL together

## Start Cited

```bash
npm ci
npm run self-host:up
```

The command:

1. Validates Docker availability
2. Generates cryptographically random secrets in `.cited/secrets/` when missing (never overwrites existing secrets)
3. Builds the application image **locally** (public container images are not published yet)
4. Starts PostgreSQL 17, runs migrations, then starts web and worker services
5. Waits for `/api/health` readiness

Open the printed URL (default `http://localhost:3000`).

## First owner

1. Retrieve the one-time bootstrap token: `npm run self-host:token`
2. Visit `/setup` and create the first workspace owner
3. Sign in at `/sign-in`

The bootstrap token is **never printed automatically** during startup.

## Stop without deleting data

```bash
npm run self-host:down
```

Containers stop. Database volumes and `.cited/secrets/` persist.

## Persistent data

| Location | Contents |
| --- | --- |
| `.cited/secrets/` | Auth, database, cron, and encryption secrets |
| `.cited/config.env` | Non-secret configuration |
| Docker volume `cited_postgres_data` | PostgreSQL database |

## Diagnostics

```bash
npm run self-host:doctor
npm run self-host:status
npm run self-host:logs
```

## Next steps

- [First monitor tutorial](first-monitor.md)
- [Configuration](configuration.md)
- [DataForSEO setup](../providers/dataforseo.md)
