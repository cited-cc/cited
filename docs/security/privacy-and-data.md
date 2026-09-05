# Privacy and data (community edition)

This document describes what the self-hosted Cited community edition stores.
It is not legal advice and does not claim GDPR or HIPAA compliance.

## Stored data categories

| Category | Examples | Purpose |
| --- | --- | --- |
| Users | Email (normalized), display name, status | Authentication and membership |
| Workspace membership | Role, join date | Authorization |
| Prompts | Monitored prompt text | Monitoring configuration |
| Domains and brands | Verified domains, brand names | Citation matching |
| Competitors | Hostnames | Competitive tracking |
| Provider responses | Normalized AI text, metadata | Evidence source |
| Citations and evidence | URLs, snippets, classification | Inbox and exports |
| Notebook | Notes, annotations, revisions | Team knowledge |
| Notifications | Preferences, encrypted Slack URL | Alert delivery |
| Operational events | Audit events, job metadata | Security and operations |
| Worker status | Heartbeats (when enabled) | Health monitoring |

## Data not stored in community edition

- Clerk, Stripe, or Resend credentials (Cloud-only integrations removed)
- Hosted analytics identifiers tied to cited.cc
- Raw provider payloads in customer UI (redacted/capped server-side)

## Retention

Retention is **conservative by default**. Most deletion scopes are disabled
until an administrator sets positive day counts.

| Scope | Default | Environment variable |
| --- | --- | --- |
| Expired invitations | Disabled (0) | `CITED_RETENTION_EXPIRED_INVITATIONS_DAYS` |
| Rate limit buckets | 7 days | `CITED_RETENTION_RATE_LIMIT_BUCKETS_DAYS` |
| Failed notification history | Disabled (0) | `CITED_RETENTION_FAILED_NOTIFICATIONS_DAYS` |

Retention runs through the portable background worker job
`security.retention`. Use dry-run mode before enabling deletion:

```bash
CITED_RETENTION_DRY_RUN=true npm run jobs:run -- security.retention
```

Retention never deletes:

- Active users or workspaces
- In-progress scan runs or notification outbox items
- Evidence required by plan history entitlements without explicit scope

### Evidence immutability

Citation evidence is treated as an append-only ledger for audit purposes.
Configured retention does not silently purge active evidence rows. Operators
who need to remove data must perform explicit workspace deletion (see below).

## Workspace deletion

Deleting a workspace is a **destructive administrator operation**. It requires
confirmation, backup awareness, and is not exposed as casual one-click purging.
Document your backup procedure before deletion.

## Logging

Structured logs redact passwords, tokens, prompts, response bodies, webhook
URLs, and database connection strings. Do not enable verbose HTTP body logging
in production.

## Operator responsibilities

- Classify data under your jurisdiction's privacy rules
- Configure retention to match your policy
- Restrict database and backup access
- Use TLS for all external access
