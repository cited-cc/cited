# Worker

The worker process runs monitoring dispatch, notification delivery, and other background jobs.

## Docker

`npm run self-host:up` starts the worker container automatically.

## Local development

```bash
npm run jobs:worker
```

## Timing

| Variable | Default | Purpose |
| --- | --- | --- |
| `CITED_JOBS_WORKER_TICK_MS` | 30000 | Worker poll interval |

## Authentication

Internal job endpoints authenticate with `MONITORING_CRON_SECRET` (or legacy `CRON_SECRET`).

## Logs

```bash
npm run self-host:logs worker
```

## Related

- [Monitoring lifecycle](../concepts/monitoring-lifecycle.md)
- [Background jobs](../open-source/background-jobs.md)
