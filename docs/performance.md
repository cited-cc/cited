# Performance

Cited prefers server components, bounded queries, and minimal client JavaScript.

## Rendering model

- Marketing, legal, and docs pages are server-rendered and mostly static where auth is not required.
- App routes are dynamic because they depend on Clerk session and workspace data.
- Client components are limited to interactive surfaces: forms, filters, sheets, billing actions, analytics helpers.

## Data-fetching boundaries

- Inbox lists do not ship full AI responses or raw provider payloads.
- Notebook and Inbox queries are paginated and workspace-scoped.
- Exports are capped (`EXPORT_MAX_EVENTS`, `EXPORT_MAX_NOTEBOOK`) and rate-limited.
- Monitoring and notification cron routes use bounded batch sizes from env.

## Known heavier routes

- Citation detail (evidence + occurrences + annotations)
- Workspace evidence export
- Docs search (local metadata only; no external search provider)

## Smoke checklist

1. Home, pricing, and docs load without large unused client bundles.
2. Inbox list remains responsive with many events.
3. Export routes return promptly or fail safely when bounds are exceeded.
4. Open Graph image generation remains efficient.
5. No hydration warnings in production build output.
