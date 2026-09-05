# Public API and routes

Community edition public HTTP surface. Cloud-only routes (billing, webhooks, free scan) are not included.

## Authentication

| Route | Method | Auth | Description |
| --- | --- | --- | --- |
| `/api/auth/*` | GET, POST | Public | NextAuth local authentication handlers |
| `/setup` | GET, POST | Bootstrap token | First-owner setup (closes after bootstrap) |
| `/sign-in` | GET | Public | Local sign-in page |
| `/sign-up` | GET | Public | Registration when enabled |
| `/accept-invite` | GET | Invite token | Workspace invitation acceptance |

## Health

| Route | Method | Auth | Description |
| --- | --- | --- | --- |
| `/api/health` | GET | Public | Deployment, database, and provider readiness |

Response includes `providerReady`, `monitoringProvider`, and `mockMonitoringProvider` flags.

## Export (authenticated)

| Route | Method | Auth | Description |
| --- | --- | --- | --- |
| `/api/export/citation-events.csv` | GET | Session | CSV export of citation events |
| `/api/export/citation-events.json` | GET | Session | JSON export of citation events |
| `/api/export/citation-note/[eventId]` | GET | Session | Single citation note export |
| `/api/export/notebook.md` | GET | Session | Notebook markdown export |
| `/api/export/workspace-evidence.json` | GET | Session | Workspace evidence bundle |

## Contact and unsubscribe

| Route | Method | Auth | Description |
| --- | --- | --- | --- |
| `/api/contact` | POST | Public (rate limited) | Contact form submission |
| `/api/unsubscribe` | POST | Token | Email unsubscribe handler |
| `/unsubscribe/[token]` | GET | Token | Unsubscribe landing page |

## Internal worker endpoints

Authenticated with `Authorization: Bearer <MONITORING_CRON_SECRET>` (or legacy `CRON_SECRET`).

| Route | Method | Description |
| --- | --- | --- |
| `/api/internal/monitoring/dispatch` | GET, POST | Dispatch monitoring jobs |
| `/api/internal/monitoring/health` | GET | Monitoring subsystem health |
| `/api/internal/notifications/dispatch` | GET, POST | Dispatch notification outbox |
| `/api/internal/notifications/digests` | GET, POST | Send digest notifications |
| `/api/internal/notifications/health` | GET | Notification subsystem health |
| `/api/internal/security/retention` | POST | Retention job (cron secret) |

## Product pages (session)

| Route | Description |
| --- | --- |
| `/app` | Dashboard |
| `/app/monitors` | Monitor management |
| `/app/inbox` | Citation inbox |
| `/app/inbox/[eventId]` | Event detail and evidence |
| `/app/notebook` | Evidence notebook |
| `/app/settings/*` | Workspace, domain, provider, notification settings |

## Error shape

JSON errors generally return:

```json
{
  "error": "Human-readable message",
  "code": "OPTIONAL_CODE"
}
```

## Rate limits

Contact and export routes apply rate limiting in production. Exact limits are configuration-dependent.

## Idempotency

Worker dispatch endpoints are safe to retry when scans remain in queued or stale states. Export endpoints are read-only.

## Related

- [Architecture](architecture.md)
- [Worker operations](../operations/worker.md)
