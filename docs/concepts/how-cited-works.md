# How Cited works

Cited monitors **prompts you configure** across **supported AI surfaces**. When your verified brand or domain appears in a monitored response, Cited captures evidence and surfaces alerts.

Cited does **not** claim to monitor every AI answer on the internet.

## Flow

```text
Configure prompts and surfaces
  → Worker schedules scan runs
    → Provider adapter fetches AI responses
      → Classification extracts citations, mentions, recommendations
        → Evidence ledger stores immutable snapshots
          → Inbox, notebook, and notifications deliver outcomes
```

## Deployment modes

Community edition runs in `self_hosted` mode with local authentication and PostgreSQL. Optional [Cited Cloud](https://cited.cc) is a separately operated managed service.

## What you control

- Which prompts to monitor
- Which AI surfaces to include (within provider support)
- Domain verification and brand mapping
- Competitor domains
- Notification preferences

## What Cited stores

- Prompt and monitor configuration
- Scan run metadata
- Immutable AI response snapshots
- Citation events and evidence
- Notebook entries and notification preferences

See [evidence ledger](evidence-ledger.md) and [monitoring lifecycle](monitoring-lifecycle.md).

## Related

- [Prompts and surfaces](prompts-and-surfaces.md)
- [Architecture reference](../reference/architecture.md)
