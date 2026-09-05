# Cited data model

Migrations:

- `supabase/migrations/20260709000000_cited_phase1_foundation.sql`
- `supabase/migrations/20260709030000_cited_phase3_free_scan.sql`
- `supabase/migrations/20260709040000_cited_phase4_checkout_onboarding.sql`
- `supabase/migrations/20260709050000_cited_phase5_monitoring_engine.sql`
- `supabase/migrations/20260709060000_cited_phase6_inbox_member_states.sql`
- `supabase/migrations/20260709070000_cited_phase7_evidence_ledger.sql`
- `supabase/migrations/20260709080000_cited_phase8_notifications.sql`
- `supabase/migrations/20260709090000_cited_phase9_billing_lifecycle.sql`
- `supabase/migrations/20260709100000_cited_phase10_docs_export_handoff.sql`
- `supabase/migrations/20260709110000_cited_phase11_rate_limit_buckets.sql`
- `supabase/migrations/20260709120000_cited_chatbot_leads.sql`

All tenant tables are workspace-scoped (directly or through a parent that is). RLS is enabled with no permissive policies; the application uses the service-role client after Clerk membership checks.

Immutable evidence tables: `scan_runs` (history), `ai_responses`, `citation_evidence`, `citation_event_occurrences`. Derived event state may update `last_seen_at` / counts. Member triage and notebook content are mutable.

## Enums

| Enum | Values |
| --- | --- |
| `workspace_status` | active, trialing, past_due, canceled, suspended |
| `plan_key` | free, founder, growth, pro, portfolio, enterprise |
| `workspace_role` | owner, admin, member, viewer |
| `domain_verification_status` | pending, verified, failed, disabled |
| `domain_verification_method` | dns_txt, meta_tag, file_upload, manual |
| `domain_alias_type` | www_variant, subdomain, redirected_domain, brand_domain, manual |
| `monitoring_frequency` | twice_weekly, weekly, daily, manual |
| `prompt_priority` | low, normal, high, critical |
| `ai_surface_key` | chatgpt, gemini, google_ai_overviews, google_ai_mode, perplexity, claude |
| `scan_run_status` | queued, running, completed, partial, failed, canceled |
| `citation_event_type` | citation, mention, recommendation, competitor_citation, missed_opportunity |
| `citation_event_status` | new, seen, saved, archived, resolved |
| `citation_evidence_type` | source_link, response_excerpt, brand_match, domain_match, recommendation_excerpt, competitor_match |
| `usage_metric_key` | domains, active_prompts, active_monitors, monthly_scans, team_members, notebook_entries |
| `notebook_body_format` | plain_text |
| `notebook_visibility` | workspace, private |
| `citation_annotation_target_kind` | event, response, evidence |
| `citation_annotation_visibility` | workspace, private |
| `citation_annotation_activity_action` | created, edited, resolved, reopened, deleted, restored |

## Tables

### workspaces

Tenant root.

| Column | Purpose |
| --- | --- |
| id | UUID PK |
| name | Display name |
| slug | Unique URL-safe identifier |
| owner_clerk_user_id | Owning Clerk user |
| plan_key | Entitlement plan |
| status | Billing/lifecycle status |
| stripe_customer_id | Stripe customer reference |
| stripe_subscription_id | Stripe subscription reference |
| current_period_start / current_period_end | Stripe period bounds |
| billing_status | Fine-grained Stripe projection |
| cancel_at_period_end / canceled_at | Cancellation state |
| billing_grace_until | Past-due grace window |
| billing_last_synced_at | Reconciliation freshness |
| billing_sync_error_code / billing_sync_error_at | Safe sync errors |
| stripe_subscription_item_id / stripe_price_id_snapshot | Plan change support |
| billing_updated_at | Last billing sync |
| onboarding_completed_at | Setup finished |
| created_at / updated_at | Timestamps |

Pricing amounts and Stripe price IDs are **not** stored as source of truth. Price IDs live in env config; `stripe_price_id_snapshot` is a projection only.

### Phase 4 billing / setup tables

| Table | Purpose |
| --- | --- |
| `checkout_intents` | Secure checkout lifecycle per Clerk user |
| `plan_inventory` | Legacy Founder inventory (unused by app checkout) |
| `stripe_webhook_events` | Idempotent webhook processing |
| `workspace_onboarding` | Resumable setup steps |
| `domain_verification_attempts` | DNS verification attempt log |

### Phase 9 billing tables

| Table | Purpose |
| --- | --- |
| `billing_events` | Safe billing audit log (no raw Stripe payloads) |
| `plan_change_requests` | Upgrade/downgrade/cancel audit (Stripe remains SoT) |
| `billing_usage_snapshots` | Customer-facing usage meters cache |

### workspace_members

| Column | Purpose |
| --- | --- |
| workspace_id | FK workspaces |
| clerk_user_id | Member identity |
| role | owner/admin/member/viewer |

Unique on `(workspace_id, clerk_user_id)`.

### domains

Verified (or pending) customer domains.

| Column | Purpose |
| --- | --- |
| hostname | Original input host |
| normalized_hostname | Canonical host for matching |
| verification_* | Status/method/token/timestamps |

Unique normalized hostname per workspace.

### domain_aliases

Approved alternate hosts for matching (subdomains, redirects, brand domains).

### brands

Brand/product names for mention classification when no source URL is present.

| Column | Purpose |
| --- | --- |
| primary_domain_id | Optional linked domain |
| name / normalized_name | Primary brand |
| alternate_names | text[] aliases |

### monitored_prompts

Customer prompts under watch.

Partial unique index prevents duplicate **active** prompts for the same workspace/domain/normalized prompt/location combination.

### ai_surfaces

Reference metadata for AI surfaces (seeded). Also mirrored in `lib/monitoring` as `AI_SURFACES`. Status values: planned, beta, ga, disabled. Phase 1 UI must not promise GA support.

### monitor_configurations

Joins a prompt to an AI surface (and optional location overrides). Phase 5 adds activation/scheduling fields: `activation_status`, `next_run_at`, failure streak, pause reason.

### scan_runs

Durable job records with `scheduled_for`, `run_type`, attempts, leases, poll state, cost type, and idempotency key. Unique on `(monitor_configuration_id, scheduled_for, run_type)`.

### ai_responses

Append-oriented evidence snapshots: exact prompt snapshot + response text used for citation derivation. Treat as immutable after insert for auditability.

### citation_events

Classified outcomes with recurrence via `first_seen_at` / `last_seen_at`, plus `event_fingerprint` for dedupe across scans.

`status` remains as a legacy workspace-level compatibility field. Inbox triage uses per-member state (Phase 6).

`search_document` is a generated tsvector over hostname, title, URL, and snippet for Inbox search (never raw provider payload).

### citation_event_occurrences

One row per event observation per scan run. Preserves history without duplicating primary events.

Phase 7 adds optional derived metadata (never rewrites historical evidence text):

| Column | Purpose |
| --- | --- |
| source_fingerprint | Deterministic hash of URL/hostname/position |
| response_fingerprint | Deterministic response/evidence fingerprint |
| is_material_change | Whether comparison found a material difference |
| change_summary | Factual label only (no causal language) |

### citation_event_member_states

Per-member Inbox triage (Phase 6). Unique on `(citation_event_id, clerk_user_id)`.

| Column | Purpose |
| --- | --- |
| seen_at | Member viewed / acknowledged |
| saved_at | Personal Saved view |
| archived_at | Hidden from default Inbox |
| resolved_at | Member considers handled |

Workspace ID must match the parent citation event (enforced by trigger). Archiving/resolving never deletes evidence.

### citation_event_member_activity

Append-only triage actions (`seen`, `saved`, `unsaved`, `archived`, `restored`, `resolved`, `reopened`). No PII or response contents.

### citation_evidence

Supporting excerpts/links for citation detail views.

### Inbox RPCs

| Function | Purpose |
| --- | --- |
| `inbox_list_events` | Member-scoped filtered list + cursor pagination |
| `inbox_tab_counts` | Aggregate tab counts for the current member |

### monitoring_usage_events

Idempotent usage ledger (`scan_run_id` + `metric_key`).

### provider_tasks / monitoring_audit_events / notification_outbox

Async provider reconciliation, safe operational audit, and notification outbox with claim leases, retries, and `payload_summary` (Phase 8 delivery).

### notification_deliveries

Per-channel/recipient delivery attempts. Stores email hash (not raw email), provider message id, and safe failure codes.

### notification_unsubscribe_tokens

Hashed unsubscribe tokens with scope + expiry. Raw tokens never stored.

### notification_digest_runs

Period/channel digest audit trail. Unique per workspace period+channel; empty digests can be `suppressed`.

### user_notification_preferences

Per-member email/digest/monitor prefs and unsubscribe timestamps. One row per workspace member.

### notebook_entries

Workspace notes optionally linked to a citation event.

| Column | Purpose |
| --- | --- |
| title | Required display title (existing rows defaulted to `Untitled note`) |
| body | Plain-text body |
| body_format | `plain_text` only |
| visibility | `workspace` or `private` |
| pinned | Per-note pin (shared for workspace notes; personal for private notes) |
| archived_at | Soft archive; never deletes text |
| deleted_at | Soft delete; revisions retained |
| citation_event_id | Optional FK to citation event |

Indexes: workspace, citation_event, author, visibility, pinned, archived_at, deleted_at, updated_at.

### notebook_entry_revisions

Append-only revision snapshots. Unique on `(notebook_entry_id, revision_number)`. Restore creates a new revision; history is never rewritten.

### citation_annotations

Evidence annotations (`event` / `response` / `evidence`) with plain-text body, optional anchors, workspace/private visibility, soft delete, and resolve state. Structural target-shape constraints enforced in SQL. Workspace must match parent citation event (trigger).

### citation_annotation_activity

Append-only annotation actions. Does not store annotation body or evidence text.

### notification_preferences

Per-workspace alert toggles (instant/digest/monitor/competitor/missed/recurring), digest schedule, and Slack connection metadata. `slack_webhook_url_encrypted` must never be exposed to the client. Masked status only: `not_connected` / `connected` / `needs_attention`.

### workspace_usage

Flexible usage counters for entitlement enforcement (`metric_key` + period window).

## Relationships (simplified)

```text
workspaces
  ├── workspace_members
  ├── domains
  │     └── domain_aliases
  ├── brands
  ├── monitored_prompts
  │     └── monitor_configurations
  │           └── scan_runs
  │                 └── ai_responses
  │                       └── citation_events
  │                             ├── citation_evidence
  │                             ├── citation_event_occurrences
  │                             ├── citation_event_member_states
  │                             ├── citation_event_member_activity
  │                             ├── citation_annotations
  │                             │     └── citation_annotation_activity
  │                             └── notebook_entries
  │                                   └── notebook_entry_revisions
  ├── notification_preferences
  └── workspace_usage
```

## Application types

TypeScript mirrors live in:

- `types/product.ts` (enums + approved language)
- `lib/db/types.ts` (Supabase table typings)
