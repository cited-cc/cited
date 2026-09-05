# Monitoring engine

Phase 9 hardens the Cited monitoring lifecycle: durable scan runs, provider tasks, classification, competitor tracking, evidence persistence, and internal recurrence calculations. External portable scheduling and notification delivery remain Phase 10.

## Lifecycle

```text
monitor configuration
  -> config snapshot (immutable per scan)
  -> scan_run queued
  -> claim + lease
  -> provider submit (intent recorded first)
  -> provider pending (poll when required)
  -> normalized response
  -> deterministic classification
  -> evidence ledger (transactional, idempotent)
  -> inbox / notebook surfaces
  -> next_run_at advance (recurring)
```

The database is the source of truth. Vercel Cron (or any external dispatcher in Phase 10) only invokes `runMonitoringDispatcher`.

## Scan state machine

Logical phases (`scan_runs.phase`) map onto persisted `scan_runs.status`:

| Phase | DB status | Notes |
| --- | --- | --- |
| `queued` | `queued` | Awaiting claim |
| `claimed` | `running` | Worker holds lease |
| `submitting` | `running` | Provider call in flight |
| `provider_pending` | `running` | Poll scheduled (`next_poll_at`) |
| `processing` | `running` | Persisting evidence |
| `retry_scheduled` | `queued` | Backoff (`next_attempt_at`) |
| `completed` | `completed` | Terminal |
| `failed` | `failed` | Terminal |
| `canceled` | `canceled` | Terminal |

Implementation: `lib/monitoring/state-machine.ts`. Illegal transitions throw `ScanStateTransitionError`. Terminal scans cannot return to active phases without explicit reprocessing (not automatic).

Provider tasks use a parallel state machine in `lib/monitoring/provider-task-state.ts`.

## Provider submission and polling

1. Record submission intent in `provider_tasks` with stable `external_request_key` before external calls.
2. Call provider via registry (`lib/monitoring/factory.ts`).
3. On `pending`, store provider task id and schedule `next_poll_at`.
4. Poll only tasks in pending-like phases, respect provider intervals, enforce `MONITORING_MAX_POLL_ATTEMPTS`.
5. Never poll terminal tasks. Release lease while waiting for poll.

Submission ambiguity (accepted externally but not stored) uses intent rows and capped reconciliation. Internal persistence remains idempotent even if external execution occurs twice.

## Claims and leases

- Primary: Postgres RPC `claim_due_scan_runs` (`FOR UPDATE SKIP LOCKED`)
- Fallback: `lib/monitoring/claim-runs.ts` for local dev
- Default lease: 300 seconds
- Expired leases: `release_expired_scan_run_leases`
- Never recover an active, valid lease

## Retries

Retryable categories (`lib/monitoring/errors.ts`):

- `provider_timeout`
- `provider_rate_limited`
- `provider_unavailable`
- `internal_persistence_error` (when idempotency preserved)

Non-retryable: invalid credentials/config, unsupported surfaces, permanent provider rejection, max attempts, canceled scans.

Backoff: exponential with deterministic jitter (`lib/monitoring/schedule.ts`).

## Idempotency

- Recurring/baseline slots: unique `(monitor_configuration_id, scheduled_for, run_type)`
- Global: unique `idempotency_key` when set
- Manual scans: unique user action or explicit request id (Phase 10 UI)
- Provider results: unique `ai_responses.scan_run_id`, occurrence fingerprints
- Usage: idempotent per `scan_run_id` + metric

## Competitor tracking

Configured competitors live in `competitor_hostnames` (workspace-wide or monitor-specific). `loadCompetitorsForScan` loads scoped rows, excludes primary domain/aliases, dedupes deterministically, and respects `competitorWatch` entitlements.

Classification receives `competitorHostnames` from:

1. Immutable `monitor_config_snapshots` when `scan_runs.config_snapshot_id` is set
2. Live configuration for legacy rows (future scans only; in-flight uses snapshot when present)

Competitors are never sent to providers unless a provider adapter explicitly requires them (none currently do).

## Classification precedence

Contract: `lib/classification/contract.ts` (version `2026-09-04`).

Precedence for primary brand signals:

1. Citation (validated source relationship)
2. Recommendation with citation
3. Recommendation
4. Mention
5. Competitor citation (configured competitors only)
6. Missed opportunity (competitor present, primary domain absent)

Mention and citation remain distinct. Classification is local, deterministic, and makes no provider or billing calls.

## Evidence immutability

All writes go through `lib/monitoring/persist-result.ts` and `lib/evidence/ledger.ts`. Scan completion occurs only after persistence commits. Failed scans do not create zero-result evidence.

## Configuration snapshots

`monitor_config_snapshots` capture prompt, brands, domains, competitors, surface, locale, cadence, classification version, and provider routing at queue time. In-flight scans retain their snapshot; settings changes affect future scans only.

## Recurring due-time calculation

`lib/monitoring/schedule.ts`:

- UTC storage
- Cadences: `daily`, `weekly`, `twice_weekly`, `manual` (no auto schedule)
- Deterministic stagger from monitor id
- Stale slot skip (`MONITORING_STALE_RUN_MINUTES`) prevents catch-up storms
- No overlapping active scans per monitor

External portable scheduling and notification delivery are implemented in Phase 10. See [background-jobs.md](./background-jobs.md).

## Operational limits

`lib/monitoring/limits.ts` (distinct from commercial entitlements):

| Setting | Default env |
| --- | --- |
| Claim batch | `MONITORING_PROCESS_BATCH_SIZE` (20) |
| Max scan attempts | `MONITORING_MAX_ATTEMPTS` (4) |
| Max poll attempts | `MONITORING_MAX_POLL_ATTEMPTS` (12) |
| Provider timeout | `MONITORING_PROVIDER_TIMEOUT_MS` (90000) |
| Raw payload cap | `MONITORING_MAX_RAW_PAYLOAD_BYTES` (524288) |

## Failure recovery

- Expired leases re-enter claim queue
- Retryable failures return to `retry_scheduled`
- Repeated failures increment `failure_streak`; may block monitor
- Usage safety blocks monitors without deleting evidence

## Safe observability

Structured events (`lib/monitoring/observability.ts`) include scan id, surface, provider id, attempt, duration, safe error code. They exclude prompt text, response text, credentials, and raw payloads.

## Mock diagnostics

```bash
npm run monitoring:check
npm run monitoring:doctor
```

`monitoring:doctor --live` is blocked in Phase 9.

## Phase 10 status

- Portable self-hosted worker and CLI (`npm run jobs:worker`, `npm run jobs:run`)
- Notification delivery through Resend (cloud), SMTP (self-hosted), Slack webhooks, or disabled mode
- Docker / final public CI (Phase 11)
- Public release (`publicReleaseBlocked` remains true)
