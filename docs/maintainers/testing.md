# Testing

This document describes the community edition test architecture for Cited.

## Categories

| Category | Command | Scope |
|----------|---------|-------|
| Unit | `npm run test:unit` | Pure logic, contracts, copy, state machines |
| Integration | `npm run test:integration` | PostgreSQL migration and repository contracts |
| Security | `npm run test:security` | Auth, egress, redaction, adversarial input |
| Boundary | `npm run test:boundary` | Publication, deployment, provider, and license guards |
| Browser E2E | `npm run test:e2e` | Self-hosted bootstrap, auth, and admin surfaces |
| Coverage | `npm run test:coverage` | Unit, security, and boundary with thresholds |
| All Vitest | `npm run test:all` | Every Vitest project |

Category definitions live in `tests/categories.mjs`.

## Local commands

```bash
npm run test:unit
npm run test:integration
npm run test:security
npm run test:boundary
npm run test:coverage
npm run test:all
npm run ci:check
```

## PostgreSQL requirements

Integration and migration CI require a synthetic local database:

```bash
export DATABASE_URL='postgresql://postgres:local_dev_only@127.0.0.1:5432/cited_dev'
export CITED_INTEGRATION_DATABASE_URL="$DATABASE_URL"
npm run test:integration
npm run db:migration-ci
```

CI uses PostgreSQL 17 with password `ci_fake_password_not_production_scope`. This password is scoped to ephemeral jobs only.

Integration tests create and drop isolated databases prefixed with `cited_integration_` or `cited_migration_ci_`.

## E2E setup

E2E tests require PostgreSQL, a production build, and explicit opt-in:

```bash
export CITED_E2E_ENABLED=true
export DATABASE_URL='postgresql://postgres:local_dev_only@127.0.0.1:5432/cited_e2e'
npm run build
npm run test:e2e
```

Playwright records traces and screenshots on failure only. Artifacts are gitignored and must never contain bootstrap tokens or session cookies.

## Docker smoke testing

```bash
npm run docker:smoke
```

Requires a local Docker daemon. The smoke test creates an isolated Compose project prefixed with `cited-phase11-test-` and tears it down with `docker compose down -v`.

## Coverage policy

Coverage uses `@vitest/coverage-v8` with global thresholds set at or below the verified baseline. Critical modules have stronger targeted thresholds:

- `lib/auth/**`
- `lib/security/**`
- `lib/monitoring/**`

Reports are written to `coverage/` and are not committed.

### Uncovered critical paths (future work)

- Full browser role matrix and cross-workspace URL denial at the UI layer
- Live worker queue lease recovery under contention
- Notification encryption round-trip through the outbox worker
- End-to-end mock scan evidence persistence with worker restarts

## No-live-service policy

Tests must use:

- Mock monitoring provider only
- Null or local notification adapters only
- Synthetic example.com and cited-test.example domains
- Reserved example emails only

Tests must never contact DataForSEO, SMTP, Slack delivery endpoints, cited.cc runtime services, or remote databases.

## Skipped tests

Integration and E2E suites report a documented skip when PostgreSQL or Docker prerequisites are unavailable. Skips are explicit in CI job output and in `npm run ci:check` summaries.
