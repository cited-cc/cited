# Database architecture (Phase 7)

Cited supports two database providers:

| Provider | Deployment | Connection |
| --- | --- | --- |
| `supabase` | Cited Cloud (`CITED_DEPLOYMENT_MODE=cloud`) | Supabase service-role admin client |
| `postgres` | Self-hosted (`CITED_DEPLOYMENT_MODE=self_hosted`) | Direct PostgreSQL 17 via `pg` |

Self-hosted installs do not require Supabase Studio, PostgREST, GoTrue, anon keys, or service-role keys when `CITED_DATABASE_PROVIDER=postgres`.

## PostgreSQL version

Use **PostgreSQL 17** (compatible with Supabase local tooling when used for development).

## Required extensions

- `pgcrypto` (UUID and cryptographic helpers)

## Environment variables

### Self-hosted PostgreSQL

```bash
CITED_DATABASE_PROVIDER=postgres
DATABASE_URL=postgresql://user:pass@127.0.0.1:5432/cited
# Optional dedicated migration credentials
# DATABASE_MIGRATION_URL=postgresql://migrate_user:pass@127.0.0.1:5432/cited
# DATABASE_POOL_MAX=10
# DATABASE_IDLE_TIMEOUT_SECONDS=30
# DATABASE_CONNECT_TIMEOUT_SECONDS=10
# DATABASE_SSL_MODE=prefer
```

### Cited Cloud (Supabase)

```bash
CITED_DEPLOYMENT_MODE=cloud
CITED_DATABASE_PROVIDER=supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Rules:

- Cloud mode requires `supabase`.
- Self-hosted mode defaults to `postgres`.
- Unknown provider values fail closed.
- Database URLs never reach the browser or public API responses.

## Migration commands

```bash
npm run db:validate   # offline migration file checks
npm run db:migrate    # apply canonical migrations
npm run db:status     # applied/pending summary (redacted target)
npm run db:seed       # idempotent fictional demo seed
```

Canonical migrations live in `supabase/migrations/`. The runner:

- Uses `DATABASE_MIGRATION_URL` when set, otherwise `DATABASE_URL` with a warning
- Acquires a PostgreSQL advisory lock
- Records filename, checksum, and applied timestamp in `cited_schema_migrations`
- Applies each migration in a transaction
- Fails when an applied migration checksum changes
- Rewrites Supabase-only `service_role` grants conditionally for plain PostgreSQL

## Seed behavior

`supabase/seed.sql` and `npm run db:seed` insert fictional Thrive-style demo fixtures only:

- No customer, prospect, or personal data
- No passwords or bootstrap tokens
- Safe to run twice (`ON CONFLICT DO NOTHING`)
- Never deletes existing user data
- Refuses Cloud production unless `CITED_ALLOW_CLOUD_SEED=true`

## First-owner bootstrap

Self-hosted bootstrap (`/setup`, `npm run auth:bootstrap`) creates users, credentials, workspace, and owner membership transactionally through the provider-neutral admin client. Bootstrap remains independent of seed data.

## Runtime and migration roles

Recommended self-hosted layout:

| Role | Purpose |
| --- | --- |
| Migration role | Owns DDL, runs `npm run db:migrate` |
| `cited_runtime` (optional) | Application DML and RPC execute grants |

The application uses service-level database access with explicit workspace authorization in application code. RLS remains deny-by-default; server operations bypass RLS through privileged connections, same as Cited Cloud today.

Future hardening may tighten PostgreSQL roles per installation. Document your runtime credentials and rotate them independently from migration credentials.

## TLS

- `DATABASE_SSL_MODE=disable` for intentional local non-TLS connections
- `prefer` (default): TLS for remote hosts, plain for localhost
- `require` / `verify-full` for remote production-like hosts (certificate validation enforced)

## Health checks

`/api/health` exposes only:

- `database`: `ready`, `migrations_pending`, or `unavailable`
- `provider`: `supabase` or `postgres`

Hostnames, ports, database names, usernames, and connection URLs are never returned.

## Safe local reset

`npm run db:reset:local` is development-only and requires:

- `CITED_ALLOW_DB_RESET=true`
- `CITED_DEPLOYMENT_MODE=self_hosted`
- A local database target
- Explicit confirmation (unless `CITED_DB_RESET_AUTO_CONFIRM=true` in isolated automation)

It drops and recreates only the named local database.

## Backups and restore

1. Take a logical backup with `pg_dump` from your migration or superuser role.
2. Store backups outside the application host.
3. Restore into a fresh database name first, run `npm run db:status`, then swap application `DATABASE_URL`.
4. Never restore over production without a maintenance window and explicit confirmation.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Self-hosted startup asks for Supabase | `CITED_DATABASE_PROVIDER=postgres` and `DATABASE_URL` set |
| `db:migrate` lock error | Another migration runner is active |
| Checksum mismatch | Do not edit applied migrations; add a forward migration |
| Health `migrations_pending` | Run `npm run db:migrate` |
| Cloud regression | Keep `CITED_DATABASE_PROVIDER=supabase` in Cloud environments |

## Current limitations

- Final repository architecture cleanup arrives in Phase 12
- Full security audit arrives in Phase 13
- Complete CI arrives in Phase 14
- Public container registry images are not published yet

## Boundary checks

```bash
npm run database:check
```
