# Monitoring engine

See [open-source monitoring engine](./open-source/monitoring-engine.md) for the Phase 9 lifecycle, state machine, competitor tracking, and operational limits.

## Truthful product frame

Cited monitors the prompts you configure across ChatGPT, Gemini, Perplexity, Claude, Google AI Overviews, and Google AI Mode (based on your plan).

Cited records citation evidence when your verified domain appears in a monitored result.

Results can vary by provider, model, location, timing, and response availability.

## Architecture

```text
Vercel Cron (every 15 minutes)
  -> POST /api/internal/monitoring/dispatch  (MONITORING_CRON_SECRET)
    -> release expired leases
    -> evaluate due monitor_configurations
    -> create scan_runs idempotently
    -> claim bounded batch (FOR UPDATE SKIP LOCKED)
    -> executeScanRun (provider submit/poll + persist + classify)
```

Source of truth is the database, not in-memory timers or browser polling.

## Monitor activation

After onboarding completion (`completeOnboarding`):

1. Workspace must be paid/active (or trialing)
2. Onboarding complete
3. Domain verified
4. Surfaces enabled and plan-eligible
5. Usage safety threshold not exceeded
6. `MONITORING_ENABLED=true`

Eligible `monitor_configurations` move from `configured` to `active`, receive a stable `next_run_at`, and queue one baseline `scan_run` each (idempotent).

When `MONITORING_ENABLED=false`, monitors stay configured and no external provider calls are made.

## Schedule calculation

Implemented in `lib/monitoring/schedule.ts`:

- UTC persistence
- Cadence from plan entitlement / stored `scan_frequency`
- Deterministic stagger from monitor configuration id
- `twice_weekly`: two stable weekday slots
- `daily`: one stable UTC day slot
- Stale due slots skip catch-up storms (`MONITORING_STALE_RUN_MINUTES`)
- No overlapping active scans per monitor

## Run lifecycle

Statuses: `queued` → `running` → `completed` | `partial` | `failed` | `canceled`

Claiming uses `claim_due_scan_runs` with leases. Expired leases are released safely.

Retries use exponential backoff with capped jitter. Max attempts: `MONITORING_MAX_ATTEMPTS`.

## Usage safety

Ledger: `monitoring_usage_events` (idempotent per `scan_run_id` + metric).

When usage reaches `MONITORING_USAGE_SAFETY_PERCENT` of the plan safety limit, active monitors are blocked with `pause_reason=usage_safety_limit_reached`. Prior evidence is preserved. No alerts are sent in Phase 5 (notification outbox only).

## Monitor states (UI)

Configured, Active, Queued, Running, Paused, Blocked, Failed / Unavailable.

## What later phases add

- Phase 6: Citation Inbox filters, member triage, preview, and focused event route (`docs/inbox.md`)
- Phase 8: Resend/Slack delivery from `notification_outbox`

## Cron configuration

`vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/internal/monitoring/dispatch",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

Requires `MONITORING_CRON_SECRET` (or legacy `CRON_SECRET`) on the deployment.
