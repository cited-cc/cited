# Citation Inbox

Phase 6 product surface for Cited. The Inbox turns Phase 5 monitoring evidence into a calm, evidence-first note stream.

## Purpose and boundaries

Cited’s promise: **Know when AI cites you.**

The Inbox is a private evidence ledger for meaningful moments in monitored AI answers. It is not:

- A generic analytics dashboard
- A social feed
- A list of provider logs
- A guarantee that Cited sees every AI conversation

Customer-facing framing:

> Cited records what appears in the monitored prompts and AI surfaces you choose (ChatGPT, Gemini, Perplexity, Claude, Google AI Overviews, and Google AI Mode based on your plan). Every note preserves the evidence available from that monitored result: the prompt, response context, source reference, and first-seen history.

Out of scope for this phase: email/Slack alerts, digests, Notebook editing, annotations, billing management, competitor setup UI.

## Routes

| Route | Role |
| --- | --- |
| `/app/inbox` | Primary Inbox: tabs, filters, search, list, desktop preview |
| `/app/inbox/[eventId]` | Focused citation-note page (mobile-friendly deep link) |

URL search params are the source of truth for shareable views. Malformed params fall back safely.

Examples:

```text
/app/inbox?view=new
/app/inbox?view=citations&surface=chatgpt&range=30d&prompt=<uuid>
/app/inbox?event=<uuid>
```

Never put workspace IDs, raw prompt text, or response contents in URLs.

## Event types

| Type | Meaning |
| --- | --- |
| Citation | Verified-domain source match in a monitored response |
| Mention | Brand/product/domain text without attributable source URL |
| Recommendation | Deterministic recommendation evidence for the brand/domain |
| Competitor citation | Configured competitor source appeared |
| Missed opportunity | Verified domain absent while a competitor appeared |

## New vs recurring

- **New** means the current workspace member has not opened or marked the event seen.
- Recurring scans update `last_seen_at` and `occurrence_count` on one primary event.
- Opening the Inbox does **not** mark all events seen.
- Opening a specific event marks only that event seen for the current member.

## Member-level triage

Personal state lives in `citation_event_member_states`, not the legacy workspace-level `citation_events.status`.

| Field | Meaning |
| --- | --- |
| `seen_at` | Member viewed or acknowledged the event |
| `saved_at` | Member wants it in Saved |
| `archived_at` | Removed from default Inbox; evidence retained |
| `resolved_at` | Member considers it handled |

Rules:

- Archive / resolve never delete evidence
- Saved and resolved may coexist
- Archived events remain available via the Archived tab
- Viewers may see/save; members+ may archive/resolve

Optional activity rows (`citation_event_member_activity`) record deliberate actions only.

## Tabs

All · New · Citations · Mentions · Recommendations · Opportunities · Saved · Archived

Counts come from `inbox_tab_counts` (workspace + member scoped). Archived events are excluded from default type tabs.

## Filters

Event type, AI surface, domain, monitored prompt, date range, member state, has source citation.

Advanced filters open in an accessible sheet. Active filters render as removable chips. Clear filters restores the current tab without advanced constraints.

## Search

Workspace-scoped search over:

- Prompt text
- Cited hostname / URL
- Source title / snippet

Strategy:

1. Generated `citation_events.search_document` tsvector (hostname, title, URL, snippet)
2. Parameterized `plainto_tsquery` plus bounded `ilike` on prompt text
3. Never indexes or returns `raw_provider_payload`
4. Query length capped at 120 characters; control characters stripped

## Pagination

Cursor-based: opaque HMAC-signed cursor of `(last_seen_at, id)`.

- Default order: `last_seen_at DESC`, `id DESC`
- Invalid cursors fail safely to the first page
- Load more appends results without resetting filters
- No infinite scroll trap

## Preview and focused note

Desktop: right-side inspector when `?event=` is set. Mobile: navigate to `/app/inbox/[eventId]`.

Preview includes prompt, evidence excerpt, source card, occurrence summary, and triage actions. No raw provider payloads. Unsafe URLs are not rendered as links (`https:` only).

## Accessibility

- Semantic list markup and heading hierarchy
- Keyboard tabs, filters, cards, and load more
- Nested actions do not wrap inside invalid interactive parents
- Visible focus rings; state not color-only
- Reduced-motion respected via existing `motion-*` tokens
- Toasts use `aria-live`

## Performance

- Server-rendered initial list
- Aggregate tab counts in one RPC
- List query joins member state, prompt, and domain without N+1
- Preview limits recent occurrences
- Refresh revalidates persisted data only (never triggers DataForSEO)

## Known limitations / later phases

Phase 7 delivered citation-note annotations, occurrence timeline explorer, and notebook pinning/revisions. See `docs/evidence-ledger.md` and `docs/notebook.md`.

Still later:

- Email / Slack alerts and digests
- Deeper evidence scoring UX beyond deterministic match labels
- Public share links

## Code map

```text
lib/inbox/              types, filters, queries, actions, pagination, serializers
lib/evidence/           citation detail, occurrences, annotations, material-change
lib/notebook/           notebook queries, actions, revisions, permissions
components/inbox/       list, tabs, filters, preview
components/evidence/    citation-note detail surface
components/notebook/    notebook index and entry detail
app/app/inbox/          page, loading, error, [eventId]
app/app/notebook/       page, loading, error, [entryId]
```
