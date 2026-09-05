# Cited architecture

Production architecture for cited.cc. See also `docs/backend-architecture.md`.

## App architecture

- **Next.js App Router** with Server Components by default
- **TypeScript** strict mode
- **Tailwind CSS** for restrained Phase 1 shells
- **Clerk** authentication
- **Supabase Postgres** for multi-tenant data
- **Stripe** subscription plumbing (webhooks only in Phase 1)
- **Resend** transactional email (alerts, digests, free-scan results)
- **Slack** incoming webhooks (encrypted at rest)
- **DataForSEO** behind `DataForSeoCitationMonitoringProvider` (Phase 5 Live LLM Responses)
- **Zod** for environment validation

No Redux. No ORM. Server-side Supabase helpers only.

## Route architecture

```text
/                     marketing home
/pricing|/scan|/docs|/security|/privacy|/terms
/sign-in|/sign-up     Clerk auth
/checkout|/checkout/success   paid acquisition
/onboarding           guided setup after payment
/app/*                authenticated product shell (paid + onboarded)
/app/settings/notifications  workspace + personal alert prefs (Phase 8)
/app/settings/notifications/previews  owner/admin template previews
/unsubscribe/[token]      tokenized email unsubscribe
/api/internal/notifications/*  cron dispatch, digests, health
/app/inbox/[eventId]  citation-note evidence ledger (Phase 7)
/app/notebook         evidence notebook index (Phase 7)
/app/notebook/[entryId] notebook entry detail + revisions
/api/health           public health check
/api/billing/*        checkout, portal, plan change, cancel, reactivate
/api/webhooks/clerk   signature-verified Clerk webhook
/api/webhooks/stripe  signature-verified Stripe webhook + lifecycle sync
/api/internal/billing/reconcile  daily billing reconciliation
/api/internal/billing/health     billing health snapshot
/api/internal/monitoring/dispatch  cron-secret monitoring dispatcher
/api/internal/monitoring/health    cron-secret monitoring health
```

`proxy.ts` protects `/app`, `/onboarding`, `/checkout`, and `/api/billing`. Monitoring cron routes authenticate with `MONITORING_CRON_SECRET` (not Clerk). Marketing and webhook routes stay public (webhooks authenticate via signatures). Access gating also uses `resolveCurrentAccessState()` in layouts.

## Authentication model

1. Clerk session via `auth()` on the server.
2. `requireAuthenticatedUser()` fails closed without a user id.
3. Workspace access requires a `workspace_members` row.
4. Role checks use `requireWorkspaceRole(workspaceId, allowedRoles)`.
5. UI hiding is never the only permission boundary.

## Workspace model

Customers are organized as **workspaces**, not single-user accounts.

- `workspaces` owns plan, status, and Stripe ids
- `workspace_members` attaches Clerk users with roles: owner, admin, member, viewer
- v1 may only expose owner flows; roles are established now

## Data model overview

See `docs/data-model.md` for full table documentation.

Core monitoring chain:

```text
monitored_prompts
  -> monitor_configurations (prompt x AI surface x location)
    -> scan_runs
      -> ai_responses (immutable evidence snapshot)
        -> citation_events
          -> citation_evidence
          -> citation_event_occurrences
          -> citation_annotations
          -> notebook_entries
               -> notebook_entry_revisions
```

Domains and brands attach to workspaces for matching citations and mentions.

## Monitoring provider abstraction

`lib/monitoring` defines `CitationMonitoringProvider`:

- `submitScan`
- `pollTask` (optional)

Durable scheduling lives in `dispatcher.ts` + Postgres leases. See `docs/monitoring-engine.md`.

Implementations:

- `MockCitationMonitoringProvider` for local/dev/tests (labeled mock data)
- `DataForSeoCitationMonitoringProvider` for Live ChatGPT/Gemini LLM Responses

Application code must not depend on DataForSEO payload shapes. See `docs/dataforseo-integration.md`.

## Event lifecycle

1. Monitor configuration schedules or requests a scan.
2. Provider returns a normalized result.
3. Classifier (Phase 5) emits `CitationClassification` records.
4. Events persist with `first_seen_at` / `last_seen_at` for recurrence.
5. Evidence rows support the Citation Inbox notebook feel.
6. Members triage events personally via `citation_event_member_states` (Phase 6).
7. Citation detail pages expose occurrence history, annotations, and linked notebook notes (Phase 7).
8. Notification preferences gate later delivery channels.

## Citation Inbox (Phase 6)

- Routes: `/app/inbox`, `/app/inbox/[eventId]`
- Data layer: `lib/inbox/`
- UI: `components/inbox/`
- See `docs/inbox.md` for filters, search, pagination, and triage semantics.

## Evidence ledger and Notebook (Phase 7)

- Citation detail: `lib/evidence/` + `components/evidence/`
- Notebook: `lib/notebook/` + `components/notebook/`
- Docs: `docs/evidence-ledger.md`, `docs/annotations.md`, `docs/notebook.md`

## Security decisions

- Zod-validated env; secrets never use `NEXT_PUBLIC_`
- Service-role Supabase client is server-only (`lib/db/admin.ts`)
- RLS enabled deny-by-default; app uses service role after membership checks
- Webhooks verify signatures and avoid logging raw secret-bearing payloads
- Structured logger redacts tokens, passwords, prompts, and responses by default
- Cron/internal routes can use `CRON_SECRET` bearer comparison
- Inbox queries and triage actions are always workspace-scoped after Clerk membership checks
- Cross-workspace event IDs return generic not-found
- Provider text renders as plain text; outbound links require validated `https:` URLs
- Pagination cursors are opaque and HMAC-signed; they never encode workspace IDs as authorization
- Search uses parameterized queries and never indexes raw provider payloads

See also `docs/security.md`.

## Phase 4 access path

```text
Pricing → Clerk auth → /checkout → Stripe → webhook provisioning
  → /onboarding → /app (empty-ready until Phase 5 monitoring)
```

See `docs/auth-and-access.md`, `docs/stripe-checkout.md`, `docs/onboarding.md`.

## Future extension points

| Phase concern | Extension point |
| --- | --- |
| Live monitoring | `DataForSeoCitationMonitoringProvider` + cron/internal jobs |
| Citation parsing | `CitationClassifier` (Phase 5) |
| Billing lifecycle | Phase 9: portal, upgrades/downgrades, cancel/reactivate, reconciliation |
| Email / Slack | `notification_preferences` + Resend/Slack adapters |
| Meta/file domain verification | Optional later; DNS TXT is production method now |
