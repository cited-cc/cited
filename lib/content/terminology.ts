/**
 * Shared citation terminology used by docs and in-app guidance.
 * Keep definitions consistent across both surfaces.
 */

export type TerminologyKey =
  | "citation"
  | "mention"
  | "recommendation"
  | "competitor_citation"
  | "missed_opportunity"
  | "occurrence"
  | "citation_event"
  | "citation_evidence"
  | "first_seen_by_cited"
  | "last_observed_by_cited"
  | "monitor_check"
  | "history_window";

export type TerminologyDefinition = {
  key: TerminologyKey;
  label: string;
  short: string;
  docsHref: string;
};

export const TERMINOLOGY: Record<TerminologyKey, TerminologyDefinition> = {
  citation: {
    key: "citation",
    label: "Citation",
    short:
      "A monitored response includes your verified domain as a source or linked reference.",
    docsHref: "/docs/citations-vs-mentions#citation",
  },
  mention: {
    key: "mention",
    label: "Mention",
    short:
      "A monitored response names your brand or product without an attributable source link to your verified domain.",
    docsHref: "/docs/citations-vs-mentions#mention",
  },
  recommendation: {
    key: "recommendation",
    label: "Recommendation",
    short:
      "A monitored response explicitly recommends your product, brand, or domain.",
    docsHref: "/docs/citations-vs-mentions#recommendation",
  },
  competitor_citation: {
    key: "competitor_citation",
    label: "Competitor citation",
    short:
      "A monitored response cites or recommends a competitor domain you configured.",
    docsHref: "/docs/citations-vs-mentions#competitor-citation",
  },
  missed_opportunity: {
    key: "missed_opportunity",
    label: "Missed opportunity",
    short:
      "A relevant monitored answer cites a configured competitor while your verified domain is absent.",
    docsHref: "/docs/citations-vs-mentions#missed-opportunity",
  },
  occurrence: {
    key: "occurrence",
    label: "Occurrence",
    short:
      "A single observation of the same citation event during a later monitoring run.",
    docsHref: "/docs/citations-vs-mentions#occurrence",
  },
  citation_event: {
    key: "citation_event",
    label: "Citation event",
    short:
      "A durable Inbox note for a classified citation, mention, recommendation, competitor citation, or missed opportunity.",
    docsHref: "/docs/citations-vs-mentions#citation-event",
  },
  citation_evidence: {
    key: "citation_evidence",
    label: "Citation evidence",
    short:
      "The stored snapshot of prompt, response context, and sources from a monitored result.",
    docsHref: "/docs/evidence-notes",
  },
  first_seen_by_cited: {
    key: "first_seen_by_cited",
    label: "First seen by Cited",
    short:
      "The earliest time Cited recorded this citation event from a configured monitoring run.",
    docsHref: "/docs/evidence-notes#first-seen",
  },
  last_observed_by_cited: {
    key: "last_observed_by_cited",
    label: "Last observed by Cited",
    short:
      "The most recent time Cited observed the same citation event in a monitoring run.",
    docsHref: "/docs/evidence-notes#last-observed",
  },
  monitor_check: {
    key: "monitor_check",
    label: "Monitor check",
    short:
      "One scheduled or manual run of a configured prompt against a selected AI surface.",
    docsHref: "/docs/what-cited-monitors#monitor-checks",
  },
  history_window: {
    key: "history_window",
    label: "History window",
    short:
      "How far back your plan keeps active access to stored citation evidence.",
    docsHref: "/docs/billing-and-limits#history-window",
  },
};

export function getTerminology(key: TerminologyKey): TerminologyDefinition {
  return TERMINOLOGY[key];
}
