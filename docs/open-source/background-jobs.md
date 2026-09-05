# Background jobs and notifications (Phase 10)

Phase 10 separates **transport-neutral job handlers** from **invocation adapters**. The same handlers run in Cited Cloud (Vercel Cron) and in self-hosted deployments (portable worker or one-shot CLI).

## Job registry

Handlers live under `lib/jobs/handlers/` and are registered in `lib/jobs/registry.ts`.

| Job ID | Schedule | Cloud | Self-hosted |
| --- | --- | --- | --- |
| `monitoring.dispatch` | `*/5 * * * *` | yes | yes |
| `scan.dispatch` | `*/5 * * * *` | yes | no |
| `notifications.dispatch` | `*/15 * * * *` | yes | yes |
| `notifications.digests` | `0 * * * *` | yes | yes |
| `notifications.lifecycle` | `15 * * * *` | yes | no |
| `billing.reconcile` | `0 6 * * *` | yes | no |

Lifecycle marketing and hosted billing jobs remain Cloud-only. Self-hosted installs do not send lifecycle campaigns.

## Invocation adapters

### Cited Cloud (Vercel Cron)

`vercel.json` continues to invoke authenticated internal HTTP routes. Route handlers delegate to `runBackgroundJob()` through `handleCronJobRoute()`.

Cron routes require a bearer token from:

- `MONITORING_CRON_SECRET` (monitoring)
- `NOTIFICATIONS_CRON_SECRET` (notifications)
- `BILLING_CRON_SECRET` (billing)
- Legacy fallback: `CRON_SECRET`

### Self-hosted worker

Run the long-lived worker after migrations and env configuration:

```bash
npm run jobs:worker
```

The worker polls on `CITED_JOBS_WORKER_TICK_MS` (default 30 seconds) and runs due jobs for the current deployment mode.

### One-shot CLI

Run a single job locally or in automation:

```bash
npm run jobs:run -- monitoring.dispatch
npm run jobs:run -- notifications.dispatch
```

## Notification providers

Email delivery is selected through `CITED_EMAIL_PROVIDER`:

| Provider | Mode | Notes |
| --- | --- | --- |
| `resend` | Cloud default | Hosted transactional email |
| `smtp` | Self-hosted default when configured | Bring-your-own SMTP |
| `disabled` | Development/tests | Suppresses outbound email |

Slack uses encrypted incoming webhooks stored in `notification_preferences.slack_webhook_url_encrypted`. Slack delivery is wired in the notification dispatcher for instant alerts, monitor issues, and weekly digests when workspace prefs and entitlements allow it.

Self-hosted entitlements include Slack alerts. Cloud plan entitlements may still gate Slack separately.

## Required environment

Self-hosted notifications (minimal):

```bash
NOTIFICATIONS_ENABLED=true
NOTIFICATIONS_CRON_SECRET=...
CITED_EMAIL_PROVIDER=smtp
SMTP_HOST=mail.example.com
SMTP_PORT=587
SMTP_FROM_EMAIL="Cited <alerts@example.com>"
SLACK_WEBHOOK_ENCRYPTION_KEY=...
```

Cloud notifications continue to use Resend variables documented in `.env.example`.

## Operational notes

- Outbox claiming, retries, and idempotency are unchanged. Jobs remain safe to invoke repeatedly.
- `NOTIFICATIONS_ENABLED=false` defers delivery without marking rows delivered.
- Do not send lifecycle marketing from self-hosted installations. The lifecycle job is unavailable in self-hosted mode by design.

See also [deployment-modes.md](./deployment-modes.md) and [monitoring-engine.md](./monitoring-engine.md).
