# Local development

## Prerequisites

- Node.js 20+ (22 recommended)
- npm
- Supabase project (or local Supabase CLI)
- Clerk application

Optional later: Stripe, Resend, DataForSEO credentials.

## Environment

1. Copy `.env.self-hosted.example` or `.env.example` to `.env.local`.
2. Set deployment mode explicitly for production. In local development, unset mode defaults to `self_hosted`.
3. For production variable rules, see `docs/production-env.md` and `docs/production-readiness.md`.
4. Fill required values:

| Variable | Required for | Notes |
| --- | --- | --- |
| `CITED_DEPLOYMENT_MODE` | Deployment | `cloud` or `self_hosted`. Required in production. |
| `NEXT_PUBLIC_CITED_DEPLOYMENT_MODE` | Client UI | Mirror server mode at build time. |
| `NEXT_PUBLIC_APP_URL` | App | Defaults to `http://localhost:3000` if unset in validation |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Auth | Public |
| `CLERK_SECRET_KEY` | Auth | Server only |
| `SUPABASE_URL` | DB | Or `NEXT_PUBLIC_SUPABASE_URL` |
| `SUPABASE_ANON_KEY` | DB | Or publishable key aliases from Vercel integration |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin DB / seed | Or `SUPABASE_SECRET_KEY`. Seed can fall back to `POSTGRES_URL` + `psql` |
| `CLERK_WEBHOOK_SECRET` | Clerk webhooks | Optional until Clerk user sync is needed |
| `STRIPE_SECRET_KEY` | Checkout | Cloud mode only. Required for paid acquisition in Cloud deployments |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhooks | From Dashboard or Stripe CLI |
| `STRIPE_FOUNDER_PRICE_ID` / `GROWTH` / `PRO` | Checkout | Server-only price IDs |
| `BILLING_ENABLED` / `STRIPE_BILLING_ENABLED` | Checkout | `false` disables checkout in dev without granting access |
| `STRIPE_CUSTOMER_PORTAL_RETURN_URL` | Portal | Defaults to `{APP_URL}/app/billing` |
| `STRIPE_BILLING_PORTAL_CONFIGURATION_ID` | Portal | Optional Stripe portal config |
| `BILLING_CRON_SECRET` | Reconcile/health | Falls back to monitoring/cron secret |
| `BILLING_RECONCILIATION_ENABLED` | Reconcile | Default on when Stripe configured |
| `BILLING_GRACE_PERIOD_DAYS` | Past due | Default 7 |
| `CHECKOUT_INTENT_TTL_MINUTES` | Checkout intents | Default 30 |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` / `RESEND_REPLY_TO_EMAIL` | Email | Required when `NOTIFICATIONS_ENABLED=true` |
| `NOTIFICATIONS_ENABLED` | Notifications | Default false locally; must be true to send |
| `NOTIFICATIONS_CRON_SECRET` | Cron | Falls back to monitoring/cron secret |
| `NOTIFICATIONS_DISPATCH_BATCH_SIZE` | Dispatcher | Default 25 |
| `NOTIFICATIONS_MAX_ATTEMPTS` | Retries | Default 5 |
| `NOTIFICATIONS_STALE_LOCK_MINUTES` | Leases | Default 15 |
| `NOTIFICATIONS_BASE_URL` | Absolute links | Falls back to `NEXT_PUBLIC_APP_URL` |
| `SLACK_WEBHOOK_ENCRYPTION_KEY` | Slack | 64-char hex preferred |
| `NOTIFICATION_UNSUBSCRIBE_TOKEN_TTL_DAYS` | Unsubscribe | Default 90 |
| `DATAFORSEO_*` | Monitoring | Required when `MONITORING_ENABLED=true` and provider is dataforseo |
| `MONITORING_*` | Monitoring engine | See `.env.example`; keep mock disabled in production |
| `MONITORING_CRON_SECRET` / `CRON_SECRET` | Cron dispatch | Required for `/api/internal/monitoring/*` |
| `SENTRY_DSN` | Observability | Optional |
| `FREE_SCAN_ENABLED` | Free scan funnel | Phase 3 |

Never prefix secrets with `NEXT_PUBLIC_`.

Validation lives in `lib/env/index.ts`.

## Supabase setup

1. Link or create a project (`supabase link` if using CLI).
2. Apply migrations:

```bash
npx supabase db push
# or
npx supabase migration up
```

Migrations:

- `supabase/migrations/20260709000000_cited_phase1_foundation.sql`
- `supabase/migrations/20260709030000_cited_phase3_free_scan.sql`
- `supabase/migrations/20260709040000_cited_phase4_checkout_onboarding.sql`
- `supabase/migrations/20260709050000_cited_phase5_monitoring_engine.sql`
- `supabase/migrations/20260709060000_cited_phase6_inbox_member_states.sql`

### Local monitoring without DataForSEO spend

```bash
MONITORING_ENABLED=true
MONITORING_PROVIDER=mock
MONITORING_ALLOW_MOCK_PROVIDER=true
MONITORING_CRON_SECRET=dev-cron-secret
```

Then:

```bash
curl -X POST http://localhost:3000/api/internal/monitoring/dispatch \
  -H "Authorization: Bearer dev-cron-secret"
```

3. Confirm tables exist in the Supabase SQL editor.

## Seed workflow

Development-only fixtures (fictional `cited-test.example` domain):

```bash
npm run seed
```

Creates one demo workspace (`cited-demo`) with domain, brand, prompts, scan, citation events, and a notebook entry.

Refuses to run when `NODE_ENV=production` unless `ALLOW_PROD_SEED=true`.

Production app code does not depend on seed data.

### Inbox fixtures and manual checks

1. Apply Phase 6 migration (`20260709060000_cited_phase6_inbox_member_states.sql`).
2. Run `npm run seed` (or let Phase 5 monitoring mock produce events).
3. Sign in as a workspace member and open `/app/inbox`.
4. Verify tabs, filters, search, save/archive/resolve, desktop preview, and `/app/inbox/[eventId]`.
5. Confirm opening Inbox does not mark all events seen; opening one event marks only that event.
6. Confirm Refresh reloads persisted data and does not trigger DataForSEO.
7. For isolation: use two workspaces; event IDs from workspace A must 404 in workspace B.

Unit coverage lives in `tests/inbox-*.test.ts` (no live DataForSEO).

### Evidence ledger and Notebook (Phase 7)

1. Apply Phase 7 migration (`20260709070000_cited_phase7_evidence_ledger.sql`).
2. Re-run `npm run seed` so notebook entries include `title` / `visibility`.
3. Open a real citation event at `/app/inbox/[eventId]`.
4. Switch occurrences via selector / ledger (`?occurrence=`). Confirm response snapshot and sources update without re-running providers.
5. Create event, response (selection + accessible), and evidence annotations. Verify private annotations are author-only.
6. Create citation-linked and standalone notebook notes at `/app/notebook`. Verify private notes are hidden from other members in list, search, counts, and direct routes.
7. Edit a note, inspect revision history, restore a prior revision (creates a new revision).
8. Pin, archive, restore notes. Confirm event archive does not delete linked notes.
9. Mobile: citation note and notebook layouts at 375px / 768px.
10. Unit coverage: `tests/evidence-ledger.test.ts`, `tests/notebook.test.ts`.

### Notifications (Phase 8)

1. Apply Phase 8 migration (`20260709080000_cited_phase8_notifications.sql`).
2. Keep `NOTIFICATIONS_ENABLED=false` unless you intend to send real Resend/Slack traffic.
3. With notifications disabled, dispatcher claims are deferred (not marked delivered).
4. Preview templates at `/app/settings/notifications/previews` (owner/admin).
5. Connect Slack only when `SLACK_WEBHOOK_ENCRYPTION_KEY` is set; URL is never shown after save.
6. Cron test (with secret):

```bash
curl -X POST http://localhost:3000/api/internal/notifications/dispatch \
  -H "Authorization: Bearer $NOTIFICATIONS_CRON_SECRET"
```

7. Unsubscribe: send a test email (enabled mode) or create a token in a one-off script; open `/unsubscribe/[token]` and confirm via POST.
8. Unit coverage: `tests/notifications.test.ts` (mocked providers; no live sends).

## Auth setup

1. Create a Clerk application.
2. Set sign-in/sign-up URLs to `/sign-in` and `/sign-up`.
3. Add keys to `.env.local`.
4. Protect `/app`, `/onboarding`, `/checkout` via `proxy.ts` (already configured).
5. See `docs/auth-and-access.md`.

## Stripe setup (Phase 4)

1. Create monthly recurring prices for Founder, Growth, and Pro in Stripe test mode.
2. Put price IDs in `.env.local` (never in client code).
3. Forward webhooks:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`.
5. Manual path: Pricing → Sign up (`?plan=`) → `/checkout` → Stripe → `/checkout/success` → `/onboarding`.

See `docs/stripe-checkout.md`, `docs/onboarding.md`, and `docs/domain-verification.md`.

## Run the app

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Authenticated shell: `http://localhost:3000/app`.

Do not start a second dev server if one is already running.

## Quality commands

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Project scripts

| Script | Purpose |
| --- | --- |
| `dev` | Next.js dev server |
| `build` | Production build |
| `start` | Start production server |
| `lint` | ESLint |
| `typecheck` | `tsc --noEmit` |
| `test` | Vitest unit tests |
| `seed` | Demo fixture seed |

## Notes

- Monitoring uses `MockCitationMonitoringProvider` locally when `MONITORING_ALLOW_MOCK_PROVIDER=true`. Production always uses DataForSEO.
- Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- Test portal: owner opens `/app/billing` → Manage payment
- Test plan change / cancel / reactivate from `/app/billing` (test mode only)
- Reconcile: `curl -H "Authorization: Bearer $BILLING_CRON_SECRET" http://localhost:3000/api/internal/billing/reconcile`
- Health: `curl -H "Authorization: Bearer $BILLING_CRON_SECRET" http://localhost:3000/api/internal/billing/health`
- See `docs/billing.md` and `docs/runbook-billing.md`
- DNS TXT verification is server-side only (`docs/domain-verification.md`).
