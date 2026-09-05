# Cited product guardrails

Cited is a lightweight AI citation-monitoring SaaS at cited.cc.

## Product definition

Core promise:

> Know when AI cites you.

Cited monitors a customer's chosen prompts across selected AI-search surfaces and sends a notification when their verified domain is cited, linked, recommended, or mentioned.

Cited is the **signal layer**.

Learn Domains is the product that helps customers act on missed citations through content, authority, structure, schema, and growth operations.

Product thesis:

> A quiet, beautiful citation inbox for the moments AI makes your brand part of the answer.

## What Cited is not

- A full SEO suite
- A backlink tracker
- A content writer
- A site crawler
- A keyword research platform
- A broad AI visibility dashboard
- An agency operating system
- A CRM
- A competitor intelligence platform with dozens of unrelated features

## Truthful monitoring claims

Never imply that Cited sees every AI conversation happening in the world.

### Approved framing

> Cited checks the prompts, models, locations, and schedules you choose, then alerts you when your verified domain appears in a monitored response.

Also approved:

- Know when AI cites you.
- A quiet, beautiful citation inbox for the moments AI makes your brand part of the answer.
- Cited is the signal layer. Learn Domains helps customers act on missed citations.

These constants live in `types/product.ts` as `APPROVED_PRODUCT_LANGUAGE`.

### Disallowed misleading language

Never use:

- "Get notified every time anyone cites you"
- "Track every AI mention"
- "See all AI conversations"
- "Monitor every LLM response"

These live in `types/product.ts` as `DISALLOWED_PRODUCT_LANGUAGE`.

## Event definitions

### Citation

A monitored AI response includes a source URL, linked reference, citation card, source domain, or explicit reference whose normalized hostname matches the customer's verified domain or approved domain alias.

### Mention

The AI response includes the customer's brand name, product name, or domain text, but there is no attributable source URL or citation reference matching the verified domain.

### Recommendation

The AI response explicitly recommends the product, brand, or domain in answer to a monitored prompt.

### Competitor Citation

A monitored AI response cites or recommends a configured competitor domain.

### Missed Opportunity

A monitored prompt returns a relevant AI response, but the customer's verified domain is absent while one or more competitor domains appear.

All data modeling must keep these distinctions first-class (`citation_events.event_type`).

## Boundaries versus Learn Domains

| Concern | Cited | Learn Domains |
| --- | --- | --- |
| Detect citations on monitored prompts | Yes | Consumes signals |
| Notify when verified domain appears | Yes | Optional downstream |
| Content / authority / schema operations | No | Yes |
| Broad SEO or agency OS | No | Adjacent products only if intentional |

## UI language guidance

- Prefer precise verbs: checks, monitors, alerts, records.
- Always qualify scope: prompts you choose, surfaces you enable, schedules you set.
- Distinguish citation vs mention in customer-facing copy.
- Do not invent coverage percentages or "all LLMs" claims.

## Onboarding and monitoring activation (Phase 4)

After checkout and guided setup:

- Domain verification and monitor configuration may be complete.
- Do **not** claim scans are already running before Phase 5 activates monitoring.
- Preferred ready-state copy:

> Your monitoring setup is ready. Cited will begin collecting citation evidence once monitoring is activated.

- Monitor status before Phase 5: `Configured` (not `Active`).
- Inbox and Signal Desk must not show fake citation totals, fake charts, or fabricated evidence.

## Design language

Cited is a **citation evidence notebook**, not a generic analytics tool.

The product should feel like:

- A private research ledger for AI-answer evidence
- A quiet stack of citation slips and annotated notes
- A calm knowledge product with editorial hierarchy

It should not feel like:

- A SEO dashboard wall of charts
- A crypto terminal
- A bright startup landing page inside the authenticated app
- A clone of any reference product

Visual and interaction rules live in `docs/design-system.md`. Future phases must compose from shared primitives (`components/ui`, `components/shared`, `components/app`, `components/marketing`) instead of inventing one-off page styles.
