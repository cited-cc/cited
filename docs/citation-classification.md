# Citation classification

Deterministic, auditable rules in `lib/classification/`. No LLM classification.

## Definitions

**Citation:** A monitored result includes a source URL/reference whose normalized hostname matches the verified domain or approved alias.

**Mention:** The response mentions the configured brand/product/domain text, but no attributable source citation matches the verified domain.

**Recommendation:** Explicit positive/ranked recommendation with strong deterministic evidence (approved cue words + list/recommend context). Ambiguous cases fall back to mention.

**Competitor Citation:** A source citation matches a configured competitor domain.

**Missed Opportunity:** Competitor configuration exists, competitor appears, and the customer domain is absent.

## Precedence

1. Citation
2. Recommendation with citation
3. Recommendation without citation
4. Mention
5. Competitor Citation
6. Missed Opportunity

A direct citation suppresses duplicate mention events for the same brand appearance.

## Domain matching

Uses `lib/citations/normalize.ts`:

- `example.com` matches `www.example.com`
- Subdomains match only when listed as approved aliases
- Rejects `example.co`, `notexample.com`, `example.com.fake-site.com`

Confidence: exact domain `1.00`, approved alias `0.95`.

## Brand matching

Boundary-aware regex. Skips very short non-phrase tokens. Exact configured brand phrase ~`0.85`, alternate phrase ~`0.80`. Weak ambiguous matches do not create events.

## Recommendation rules

Requires brand match plus nearby approved cues (`best`, `recommend`, `top`, `consider`, …) with numbered-list or explicit recommend context. Confidence threshold ~`0.82`. Otherwise classify as mention.

## Deduplication

Fingerprint inputs: workspace, domain, monitor configuration, AI surface, event type, normalized URL or brand key.

- First observation creates `citation_events`
- Later matches update `last_seen_at` / `occurrence_count`
- Every observation inserts `citation_event_occurrences` (unique per event+scan run)
- Phase 7 persists deterministic `source_fingerprint` / `response_fingerprint` and factual `change_summary` labels for occurrence history (no LLM, no causal language)
- Different surfaces/prompts/URLs remain distinct evidence

## Known limitations

- Recommendation detection is conservative and English-cue oriented
- Competitors are never inferred automatically from arbitrary cited domains
- Provider HTML is never rendered; evidence is plain text only
- Material-change summaries describe what differed between monitored observations, not why an AI surface changed
