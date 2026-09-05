# Backend performance and cost control

## Decisions

1. **No provider calls on page refresh.** Monitoring runs only via cron dispatch / explicit activation paths.
2. **No provider calls from demo or marketing.** Static fixtures only.
3. **Bounded cron batches.** `MONITORING_DISPATCH_BATCH_SIZE`, `MONITORING_PROCESS_BATCH_SIZE`, `NOTIFICATIONS_DISPATCH_BATCH_SIZE`, `BILLING_RECONCILE_BATCH_SIZE`.
4. **Usage ledger.** Monthly monitor checks increment once per completed real check; safety percent pauses monitors before runaway spend.
5. **Inbox lists omit full response text and raw payloads.** Detail views load stored snapshots only.
6. **Cursor pagination** for inbox and occurrence history.
7. **Raw payload cap.** `MONITORING_MAX_RAW_PAYLOAD_BYTES` (default 256 KiB) with redaction.
8. **Export bounds.** Rate limits + history window + private-note filtering.
9. **Retries bounded.** Max attempts / poll attempts from env; stale leases recover.
10. **Indexes** on `workspace_id` and common inbox/monitor query paths (see migrations).

## Cost levers

| Lever | Control |
| --- | --- |
| Provider spend | Plan monthly check limits + usage safety % |
| Concurrent work | Process batch size + leases |
| Notification fanout | Outbox claim batch + digest dedupe |
| Export abuse | Rate limit presets |
| Free scan | Rate limit + fingerprint dedupe; no live provider in request path |

## Non-goals

- No unbounded `select *` of `ai_responses` for list UIs
- No recursive self-calling cron chains
- No background promises after HTTP response
