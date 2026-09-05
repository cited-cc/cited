# Evidence ledger

Phase 7 turns `/app/inbox/[eventId]` into a durable citation-note surface.

## Purpose

A citation note is a record of what a monitored AI answer said, why Cited classified it, where the source appeared, and what the team observed afterward.

It is based on monitored output only:

> Cited records evidence from the prompts, locations, schedules, and AI surfaces you choose (ChatGPT, Gemini, Perplexity, Claude, Google AI Overviews, and Google AI Mode based on your plan). Each note reflects one or more monitored results. It does not represent every AI conversation or every citation on the internet.

## Provenance language

Near every response snapshot:

- `Captured from this workspace's monitored result.`
- `This evidence reflects the selected prompt, AI surface, location, and observation time. AI responses can vary across providers, locations, and future runs.`

Labels:

- `First seen by Cited`
- `Last observed by Cited`

Never imply global coverage, causality, or that a missing citation means a site is inferior.

## Immutable writers

All evidence writes go through `lib/evidence/ledger.ts`:

- `appendAiResponseSnapshot()`
- `appendCitationEvidence()`
- `appendCitationOccurrence()`
- `upsertDerivedCitationEvent()`
- `appendScanRunComplete()` / `appendScanRun()`

Do not write evidence tables from ad-hoc route handlers.

## Immutable response snapshots

`ai_responses` rows are append-only evidence. Opening a citation note never re-runs a provider and never overwrites historical response text.

The selected occurrence determines which `ai_response_id` snapshot is shown. Invalid `?occurrence=` values fall back to the latest observation.

## Source evidence

Sources come from `citation_evidence` and occurrence fields. Outbound links must be absolute `https:` only (`toSafeHttpsUrl`). Unsafe protocols are not rendered as active links. External links use `rel="noopener noreferrer"`.

Mention events must not be presented as direct source citations. Missed-opportunity events state that the verified domain was absent; they do not claim why.

## Occurrence selection and timeline

`OccurrenceSelector` and `OccurrenceLedger` use real `citation_event_occurrences` rows, newest first, with bounded pagination (`Load more observations`).

Material-change labels are deterministic (see below). Single-observation events show `Observed once by Cited.`

## Material-change rules

Implemented in `lib/evidence/material-change.ts`. No LLM. No causal language.

| Kind | When |
| --- | --- |
| `first_observation` | No prior occurrence |
| `observed_again` | Comparable fields unchanged |
| `source_url_changed` | Normalized source URL differs |
| `source_hostname_changed` | Hostname differs |
| `citation_position_changed` | Position differs |
| `evidence_text_changed` | Evidence hash differs |
| `response_changed` | Response fingerprint differs while evidence match may be unchanged |
| `comparison_unavailable` | Insufficient prior data |

Forbidden labels include improved, worsened, higher quality, more trusted, declined, lost visibility.

## Known limitations

- Detailed evidence does not imply global AI coverage.
- Historical comparison requires prior occurrence rows with comparable fingerprints.
- Full response text may be collapsed for long snapshots; evidence highlights remain visible.
- Provider payloads and task IDs stay server-only.
