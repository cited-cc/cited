# Manual installation

Use this path when developing Cited without Docker Compose.

## Prerequisites

- Node.js 22+
- PostgreSQL 17 (local or container)
- npm (required package manager)

## Setup

```bash
cp .env.self-hosted.example .env.local
# Edit DATABASE_URL, AUTH_SECRET, CITED_BOOTSTRAP_TOKEN
npm ci
npm run db:migrate
npm run db:seed    # optional fictional demo fixtures
npm run dev
```

Open `http://localhost:3000`.

## Worker

Monitoring dispatch requires the background worker in another terminal:

```bash
npm run jobs:worker
```

## Environment

`.env.self-hosted.example` defaults to:

- `CITED_DEPLOYMENT_MODE=self_hosted`
- `CITED_AUTH_PROVIDER=local`
- `CITED_DATABASE_PROVIDER=postgres`
- `CITED_MONITORING_PROVIDER=mock`

Cloud-only variables (Clerk, Stripe, Resend, hosted analytics) are intentionally omitted from community examples.

## Verification

```bash
npm run lint
npm run typecheck
npm run test
npm run deployment:check
npm run auth:check
npm run database:check
```

## Related

- [Local development](../local-development.md)
- [Quickstart (Docker)](quickstart.md)
- [Worker](../operations/worker.md)
