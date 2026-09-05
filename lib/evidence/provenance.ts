/**
 * Truthful provenance copy for evidence surfaces.
 * Present near evidence, not buried in a legal footer.
 */

export const EVIDENCE_PROVENANCE = {
  short: "Captured from this workspace's monitored result.",
  detail:
    "This evidence reflects the selected prompt, AI surface, location, and observation time. AI responses can vary across providers, locations, and future runs.",
  firstSeenLabel: "First seen by Cited",
  lastObservedLabel: "Last observed by Cited",
  singleObservation: "Observed once by Cited.",
  scopeNote:
    "Cited records evidence from the prompts, locations, schedules, and AI surfaces you choose (ChatGPT, Gemini, Perplexity, Claude, Google AI Overviews, and Google AI Mode based on your plan). Each note reflects one or more monitored results. It does not represent every AI conversation or every citation on the internet.",
} as const;

export function getProvenanceCopy() {
  return {
    short: EVIDENCE_PROVENANCE.short,
    detail: EVIDENCE_PROVENANCE.detail,
  };
}
