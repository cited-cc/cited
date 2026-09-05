# Evidence ledger

The evidence ledger preserves **immutable snapshots** of AI responses and the citations extracted from them.

## Components

| Artifact | Role |
| --- | --- |
| `scan_runs` | Scheduling and provider metadata |
| `ai_responses` | Full response text and hash |
| `citation_events` | Classified outcomes |
| `citation_evidence` | Supporting links and snippets |
| `notebook_entries` | Human notes attached to events |

## Exports

Authenticated workspace members can export evidence:

- CSV and JSON citation events
- Notebook markdown
- Workspace evidence JSON bundle

See [public API](../reference/api.md) for export routes.

## Retention

Self-hosted operators control retention through environment settings. See [retention](../operations/retention.md).

## Related

- [Monitoring lifecycle](monitoring-lifecycle.md)
- [Inbox](../inbox.md)
- [Notebook](../notebook.md)
