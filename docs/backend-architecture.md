# Cited backend architecture

Cited is the citation inbox for AI search.

## Product principle

```text
Evidence is immutable. Product state is derived. Customer access is gated.
Monitoring is scheduled. Delivery is durable.
```

## Systems

| System | Responsibility |
| --- | --- |
| Identity | Clerk auth, workspace membership, roles |
| Workspace | Multi-tenant ownership boundary |
| Billing | Stripe lifecycle, plan sync |
| Domain verification | DNS TXT proof before monitoring |
| Prompt monitoring | Scheduled checks for configured prompts/surfaces |
| Provider ingestion | DataForSEO only (v1) |
| Evidence storage | Immutable `ai_responses`, evidence, occurrences |
| Event classification | Deterministic citation/mention/recommendation rules |
| Inbox state | Member triage separate from evidence |
| Notebook/annotations | Mutable notes with revisions |
| Notifications | Durable outbox → Resend / Slack |
| Exports | Workspace-scoped, payload-free exports |
| Observability | Redacted logs, health endpoints, runbooks |

## External dependencies (v1)

| Service | Role |
| --- | --- |
| Clerk | Auth |
| Supabase | Postgres + service-role server access |
| Stripe | Billing |
| DataForSEO | AI surface monitoring data |
| Resend | Transactional email |
| Slack | Optional incoming webhooks |
| Vercel | Hosting + cron |

No OpenAI, Anthropic, Firecrawl, Apify, SerpAPI, Ahrefs, Semrush, or crawling stacks in v1 product flows.

## Provider boundary

```text
DataForSEO response
  → normalize (`lib/providers/dataforseo`)
  → response snapshot (`appendAiResponseSnapshot`)
  → evidence + classification
  → derived citation_events + occurrences
  → notification outbox candidates
```

UI, exports, emails, and Slack never receive raw provider payloads.

## Key modules

```text
lib/providers/dataforseo/   provider client, normalize, errors
lib/classification/         deterministic event classification
lib/evidence/ledger.ts      immutable evidence writers
lib/monitoring/             eligibility, dispatch, runs, usage
lib/entitlements/           plan gates
lib/billing/                Stripe lifecycle
lib/notifications/          outbox + delivery
lib/security/               rate limit, cron auth, encryption, logger
lib/observability/          safe errors, redaction re-exports
lib/validation/             Zod schemas for sensitive mutations
```

## Internal jobs

| Route | Purpose |
| --- | --- |
| `/api/internal/monitoring/dispatch` | Schedule + execute scan runs |
| `/api/internal/notifications/dispatch` | Deliver outbox |
| `/api/internal/notifications/digests` | Digest aggregation |
| `/api/internal/billing/reconcile` | Stripe drift repair |
| `/api/*/health` | Safe aggregate health |

All require cron secrets with timing-safe comparison. Responses return counts only.

## Related docs

- `docs/provider-dataforseo.md`
- `docs/monitoring-engine.md`
- `docs/citation-classification.md`
- `docs/evidence-ledger.md`
- `docs/entitlements.md`
- `docs/backend-security-audit.md`
- `docs/backend-performance.md`
- `docs/observability.md`
