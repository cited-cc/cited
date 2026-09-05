# Monitoring lifecycle

## States

```text
Monitor enabled
  → Scan run queued
    → Provider fetch (mock or DataForSEO)
      → Response stored
        → Events classified
          → Notifications enqueued (if enabled)
```

## Worker

The self-hosted **worker** process dispatches monitoring jobs on a tick interval (`CITED_JOBS_WORKER_TICK_MS`). Docker Compose starts the worker alongside the web service.

## Scan outcomes

| Status | Meaning |
| --- | --- |
| Completed | Response captured and classified |
| Failed | Provider or internal error; may retry |
| Blocked | Monitor paused by safety limits or eligibility |

## Safety limits

Self-hosted installations can cap users, domains, monitors, prompts, and history. Cloud billing limits do not apply in community edition.

## Diagnostics

```bash
npm run monitoring:doctor
npm run provider:doctor
npm run self-host:logs worker
```

## Related

- [Worker operations](../operations/worker.md)
- [Monitoring engine](../monitoring-engine.md)
