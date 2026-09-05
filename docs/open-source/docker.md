# Docker architecture

Cited self-hosting uses a multi-stage Dockerfile and Compose stack defined in the repository root. Images are built locally; no public registry is configured in this phase.

## Services

| Service | Purpose | Ports |
| --- | --- | --- |
| `db` | PostgreSQL 17 | Internal only |
| `migrate` | Role init + SQL migrations | None |
| `web` | Next.js application | `CITED_WEB_PORT` (default 3000) |
| `worker` | Portable background scheduler | None |
| `mailpit` (profile) | Local SMTP capture | `127.0.0.1:8025`, `127.0.0.1:1025` |

Startup order: `db` healthy → `migrate` success → `web` + `worker`.

## Image stages

1. **deps**: `npm ci` from lockfile
2. **build**: self-hosted production build (`CITED_DOCKER_BUILD=true`, standalone output)
3. **runtime**: non-root `cited` user (UID 1001), minimal copied artifacts

Runtime includes `LICENSE`, `NOTICE`, migrations, scripts, and standalone server output. No `.env` files or credentials are baked into layers.

Base image: `node:22-bookworm-slim` with an explicit tag. Pin by digest in production if your policy requires it:

```dockerfile
FROM node:22-bookworm-slim@sha256:<digest>
```

## Security controls

- Non-root runtime user
- `read_only` root filesystem on app services
- `tmpfs` for `/tmp`
- `no-new-privileges:true`
- `cap_drop: [ALL]`
- Database on internal network only
- Docker secrets mounted as files (`*_FILE` env vars)
- Graceful `SIGTERM` handling in web and worker entrypoints

## Secret files

Compose reads secrets from `.cited/secrets/`. Application code resolves `*_FILE` variables through the allowlisted helper in `lib/env/secret-files.mjs`.

Never mount the private source repository into runtime containers.

## Health checks

- **Web**: `GET /api/health` must report `status: ok` and `database: ready`
- **Worker**: heartbeat file at `/tmp/cited-worker-heartbeat`
- **Database**: `pg_isready`

Health responses never include hostnames, usernames, or credentials.

## Persistent storage

| Data | Location |
| --- | --- |
| PostgreSQL | Named volume `cited_pg_data` |
| Secrets/config | Host `.cited/` |
| Backups | Host `.cited/backups/` (operator chosen) |
| Next.js temp | Container `tmpfs` |

Rebuilding images or restarting web/worker preserves database data.

## Database roles

| Role | Usage |
| --- | --- |
| `postgres` | Bootstrap superuser inside the DB container only |
| `cited_owner` | Migrations and schema ownership |
| `cited_app` | Web and worker runtime (no superuser) |

RLS is not enabled on portable migrations today. Workspace scoping remains in application code. `BYPASSRLS` is not required for the runtime role in the current schema.

## Resource guidance

- Web: 512 MB to 1 GB RAM
- Worker: 256 MB to 512 MB RAM
- PostgreSQL: 512 MB to 2 GB RAM depending on dataset
- Disk: plan for database growth plus timestamped backups

## Reverse proxy and TLS

Terminate TLS at your reverse proxy (Caddy, nginx, Traefik). Set `NEXT_PUBLIC_APP_URL` to the public HTTPS URL and restart web/worker.

## ARM64 status

Native dependencies (`pg`) support amd64 and arm64. Multi-architecture manifests are not published in this phase. Build on your target host to verify.

## Boundary check

```bash
npm run docker:check
```

## Related

- [self-hosting.md](./self-hosting.md)
- [backups-and-upgrades.md](./backups-and-upgrades.md)
