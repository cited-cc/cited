# Docker operations

Community edition runs as a Docker Compose stack: PostgreSQL, web, and worker.

## Stack

```bash
npm run self-host:up
```

Builds the image locally. Public container registry images are **not published yet**.

## Services

| Service | Role |
| --- | --- |
| `postgres` | PostgreSQL 17 with separate migration and runtime roles |
| `migrate` | One-shot migration job |
| `web` | Next.js application |
| `worker` | Background jobs and monitoring dispatch |

## Networking

- Web publishes on `CITED_WEB_PORT` (default 3000)
- Internal services communicate on the Compose network
- No outbound provider calls in mock mode

## Mailpit profile

Optional local SMTP capture:

```bash
docker compose --profile mailpit up -d
```

## Related

- [Self-hosting guide](../open-source/self-hosting.md)
- [Docker architecture](../open-source/docker.md)
- [Quickstart](../getting-started/quickstart.md)
