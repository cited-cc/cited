# Notifications

Cited sends quiet, evidence-first notes when monitored AI surfaces cite, mention, recommend, miss, or surface a configured competitor.

## Channels

- **email** via Resend
- **slack** via encrypted incoming webhooks
- **outbox state** in `notification_outbox` / `notification_deliveries` (no full in-app bell center in Phase 8)

## Notification types

### Instant event alerts

`new_citation`, `new_mention`, `new_recommendation`, `new_competitor_citation`, `new_missed_opportunity`, `renewed_citation`

Created when Phase 5 persists a new citation event (or a renewed/material-change occurrence when recurring alerts are enabled).

### Monitor issue alerts

`monitor_blocked`, `monitor_recovered`, `monitor_repeated_failure`, `usage_safety_limit_reached`, `domain_verification_required`

### Weekly digest

`weekly_digest` for email and/or Slack, period-scoped and duplicate-safe.

### Free scan result

`free_scan_result` when a completed free-scan request exists (template + delivery path; no fabricated results).

### Lifecycle / product tips

`welcome_day_0`, `welcome_day_2`, `welcome_day_5`, `welcome_day_10`, `welcome_day_14`, `learn_domains_day_21`

Paid-workspace nurture + Learn Domains promo. Enrolled via `lifecycle_email_enrollments` and queued by `/api/internal/notifications/lifecycle`.

## Preference hierarchy

1. Workspace inactive (`canceled` / `suspended`) suppresses product alerts.
2. Workspace preferences gate channel + category enablement.
3. Per-user preferences and unsubscribe scopes gate email recipients.
4. Slack is workspace-level and ignores personal email unsubscribe.
5. Delivery re-checks preferences at send time.

Defaults:

- Instant email + weekly digest email: on
- Slack: off
- Recurring citation alerts: off
- Empty digest: off (suppress)
- Digest: Monday 09:00, timezone UTC unless configured

Role defaults for personal prefs:

- Owner/admin: instant + digest + monitor emails on
- Member: digest on, instant/monitor off
- Viewer: all email off (digest only if explicitly enabled)

## Outbox lifecycle

`pending` → `processing` → `delivered` | `partially_delivered` | `failed` | `canceled` | `suppressed`

Claiming uses `claim_notification_outbox` (`FOR UPDATE SKIP LOCKED`) with lease recovery via `release_stale_notification_outbox_locks`.

Dedupe keys prevent duplicate alerts across scan retries.

`payload_summary` stores only safe metadata (event type, surface, ids, digest period). No full prompts, responses, emails, webhooks, or note bodies.

## Delivery lifecycle

One `notification_deliveries` row per outbox/channel/recipient. Retries reuse the same row. Provider success is idempotent (already `delivered` skips resend).

Partial success is first-class: email can succeed while Slack fails.

## Retry behavior

Retryable: Resend 5xx/429, Slack 5xx/429, network/timeout.

Non-retryable: invalid email, unsubscribed, revoked Slack webhook, missing source, inactive workspace, render failure.

Backoff: bounded exponential with jitter; respects Slack `Retry-After` when present.

## Digest generation

`/api/internal/notifications/digests` (hourly) and the dispatcher evaluate due workspaces.

Period: previous 7 days ending at configured weekday/hour in workspace timezone (UTC fallback).

Empty weeks are suppressed unless `send_empty_digest` is true.

Private notes and private annotations are never included.

## Suppression

- `NOTIFICATIONS_ENABLED=false`: no external sends; outbox not marked delivered
- No eligible recipients
- Preference gates
- Empty digest disabled

## Cron

- `POST /api/internal/notifications/dispatch` every 15 minutes
- `POST /api/internal/notifications/digests` hourly
- `POST /api/internal/notifications/lifecycle` hourly at :15
- Auth: `NOTIFICATIONS_CRON_SECRET` (falls back to monitoring/cron secret)
- Health: `GET /api/internal/notifications/health`

## Known limitations / later phases

- No full in-app notification center
- No SMS / browser push / customer webhooks
- Free-scan email only when completed result data exists
- Monitor recovered alerts require an explicit recovered outbox enqueue from future activation paths
