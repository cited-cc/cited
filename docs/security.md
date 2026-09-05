# Security

Cited is multi-tenant. Workspace isolation is non-negotiable.

## Workspace scoping

Every Inbox, evidence, annotation, notebook, revision, filter, search, and pagination query is scoped to the current authorized workspace after Clerk membership checks.

Never trust:

- `workspaceId` from browser input
- `eventId` / `occurrenceId` / `annotationId` / `notebookEntryId` / `revisionId` alone
- `aiResponseId` / `citationEvidenceId` alone without event+workspace verification
- `promptId` / `domainId` alone without membership validation
- Cursor contents as authorization

Cross-workspace resource IDs produce generic not-found outcomes. Do not reveal whether a private note or annotation exists for another member.

## Access model

1. Clerk session via `auth()`
2. `resolveCurrentAccessState()` / `requireWorkspaceRole`
3. Service-role Supabase client (`lib/db/admin.ts`) after membership is proven
4. RLS remains deny-by-default on tenant tables

Role behavior:

| Action | Roles |
| --- | --- |
| View Inbox / Notebook / evidence | viewer+ |
| Mark seen / save | viewer+ |
| Archive / resolve events | member+ |
| Create annotations / notebook notes | member+ |
| Edit own annotations / notes | author |
| Resolve workspace annotations | author, or owner/admin for workspace visibility |
| Private notes / annotations | author only |
| Personal notification prefs | viewer+ (self only) |
| Workspace notification / Slack settings | owner/admin |
| Billing portal / plan changes / cancel | owner/admin |

## Billing safety

- Stripe is the billing source of truth; local fields are a projection
- Never accept client-supplied price IDs, subscription IDs, or return URLs
- Webhooks verify signatures and process idempotently
- Unknown Stripe prices never grant a public plan
- Do not log raw Stripe payloads, card data, or customer emails in billing events
- Past-due / canceled workspaces do not run paid monitoring after grace/period ends

- Slack webhook URLs encrypted server-side; never returned to clients after save
- Unsubscribe tokens hashed; raw tokens never logged
- Notification content escapes untrusted evidence; no full AI responses
- Private notes/annotations excluded from digests and alerts
- Cron routes require timing-safe bearer secret
- Test email only to authenticated user's own address
- `NOTIFICATIONS_ENABLED=false` suppresses external sends without fake delivery

## Cursor safety

Inbox cursors are opaque base64url JSON with HMAC signature over `(lastSeenAt, id)`.

- Invalid or tampered cursors fail safely
- Cursors do not authorize cross-workspace access
- Workspace scope is always applied server-side in RPCs

## Search safety

- Length-limited, whitespace-normalized, control characters stripped
- Parameterized RPC / queries only
- No raw SQL concatenation from search input
- Search queries are not logged by default
- Search never touches external providers
- Search never returns `raw_provider_payload`

## Unsafe URL handling

Provider-derived URLs are untrusted.

- Only absolute `https:` URLs may render as outbound links
- Reject `javascript:`, `data:`, `file:`, malformed URLs
- External links use `rel="noopener noreferrer"`
- No server-side fetches of source URLs (no SSRF enrichment)

## Provider text rendering

- Render response/evidence text as plain text React children
- Never use `dangerouslySetInnerHTML` in evidence or notebook components
- `HighlightedEvidence` / evidence transcript highlights via React nodes, not HTML injection
- Full AI response text is loaded only for the selected occurrence
- Raw provider payloads never reach customer UI

## Annotation selection validation

- Re-validate selected text against immutable stored response text server-side
- Reject mismatched offsets, oversized selections, and cross-event response IDs
- Store only excerpt + bounded local context, never a full response snapshot in annotations

## Notebook and annotation text safety

- Store and render as plain text only
- Preserve line breaks safely; no HTML, iframes, scripts, or unsafe markdown
- Do not put private note bodies in URLs, titles, Open Graph, analytics, or errors

## Analytics privacy

Product analytics may include non-sensitive categories (tab, filter category, annotation target kind, visibility category, revision count bucket). Never send prompts, domains, URLs, note/annotation bodies, event IDs, workspace IDs, or emails.

## Phase 11 hardening

- Security headers and CSP are configured in `next.config.ts` via `lib/security/headers.ts`
- Shared rate limiting lives in `lib/security/rate-limit.ts` (hashed fingerprints; optional DB ledger migration)
- Public legal/policy pages live under `lib/content/legal.ts` and `components/legal/*`
- Production env validation rejects localhost app URLs, mock providers, and missing support/security contacts
- Secret scan: `npm run security:scan`
- Launch checklist: `docs/production-readiness.md`

Internal note: final legal counsel review is recommended before public launch. Do not expose that note in public UI.
