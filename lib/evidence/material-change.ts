/**
 * Deterministic material-change detection for occurrence history.
 *
 * Rules (no LLM, no causal language):
 * 1. No prior occurrence → first_observation
 * 2. Missing comparable fingerprints/fields → comparison_unavailable
 * 3. Source URL differs → source_url_changed
 * 4. Hostname differs (URL same or absent) → source_hostname_changed
 * 5. Citation position differs → citation_position_changed
 * 6. Evidence hash / relevant evidence fingerprint differs → evidence_text_changed
 * 7. Response fingerprint differs while evidence match unchanged → response_changed
 * 8. Otherwise → observed_again
 *
 * Never claim improved/worsened/higher quality/more trusted.
 */

import { createHash } from "node:crypto";

import type {
  MaterialChangeKind,
  MaterialChangeResult,
} from "@/lib/evidence/types";

export type OccurrenceCompareFields = {
  sourceUrlNormalized: string | null;
  sourceHostname: string | null;
  citationPosition: number | null;
  evidenceHash: string | null;
  sourceFingerprint: string | null;
  responseFingerprint: string | null;
};

export function buildSourceFingerprint(input: {
  sourceUrlNormalized: string | null;
  sourceHostname: string | null;
  citationPosition: number | null;
}): string {
  return createHash("md5")
    .update(
      [
        input.sourceUrlNormalized ?? "",
        input.sourceHostname ?? "",
        input.citationPosition == null ? "" : String(input.citationPosition),
      ].join("|"),
    )
    .digest("hex");
}

export function buildResponseFingerprint(input: {
  evidenceHash: string;
  responseHash?: string | null;
}): string {
  if (input.responseHash) return input.responseHash;
  return input.evidenceHash;
}

const LABELS: Record<MaterialChangeKind, { label: string; summary: string }> = {
  first_observation: {
    label: "First observed by Cited",
    summary: "This is the first monitored observation for this citation note.",
  },
  observed_again: {
    label: "Observed again",
    summary: "No material evidence change was detected between observations.",
  },
  source_url_changed: {
    label: "Source URL changed",
    summary:
      "This observation used a different source URL than the prior monitored result.",
  },
  source_hostname_changed: {
    label: "Source hostname changed",
    summary:
      "This observation used a different source hostname than the prior monitored result.",
  },
  citation_position_changed: {
    label: "Citation position changed",
    summary:
      "The citation position changed between this observation and the prior monitored result.",
  },
  evidence_text_changed: {
    label: "Evidence changed",
    summary:
      "The matched evidence for this citation note changed between observations.",
  },
  response_changed: {
    label: "Response changed",
    summary:
      "The monitored response text changed between observations. Matched evidence may be unchanged.",
  },
  comparison_unavailable: {
    label: "Historical comparison unavailable",
    summary: "No prior observation is available for comparison.",
  },
};

export function materialChangeResult(
  kind: MaterialChangeKind,
): MaterialChangeResult {
  const copy = LABELS[kind];
  return {
    kind,
    label: copy.label,
    summary: copy.summary,
    isMaterialChange:
      kind !== "first_observation" &&
      kind !== "observed_again" &&
      kind !== "comparison_unavailable",
  };
}

/**
 * Compare selected occurrence against the immediately prior occurrence
 * (older by observed_at). Pass prior=null for the earliest observation.
 */
export function detectMaterialChange(input: {
  current: OccurrenceCompareFields;
  prior: OccurrenceCompareFields | null;
  isFirstObservation: boolean;
}): MaterialChangeResult {
  if (input.isFirstObservation || !input.prior) {
    return materialChangeResult("first_observation");
  }

  const current = input.current;
  const prior = input.prior;

  const hasComparable =
    Boolean(current.sourceFingerprint || current.sourceUrlNormalized || current.sourceHostname) ||
    Boolean(current.evidenceHash) ||
    Boolean(current.responseFingerprint);

  const priorComparable =
    Boolean(prior.sourceFingerprint || prior.sourceUrlNormalized || prior.sourceHostname) ||
    Boolean(prior.evidenceHash) ||
    Boolean(prior.responseFingerprint);

  if (!hasComparable || !priorComparable) {
    return materialChangeResult("comparison_unavailable");
  }

  const currentUrl = current.sourceUrlNormalized ?? null;
  const priorUrl = prior.sourceUrlNormalized ?? null;
  if (currentUrl && priorUrl && currentUrl !== priorUrl) {
    return materialChangeResult("source_url_changed");
  }

  const currentHost = current.sourceHostname ?? null;
  const priorHost = prior.sourceHostname ?? null;
  if (currentHost && priorHost && currentHost !== priorHost) {
    return materialChangeResult("source_hostname_changed");
  }

  if (
    current.citationPosition != null &&
    prior.citationPosition != null &&
    current.citationPosition !== prior.citationPosition
  ) {
    return materialChangeResult("citation_position_changed");
  }

  if (
    current.evidenceHash &&
    prior.evidenceHash &&
    current.evidenceHash !== prior.evidenceHash
  ) {
    return materialChangeResult("evidence_text_changed");
  }

  const currentResponse =
    current.responseFingerprint ?? current.evidenceHash ?? null;
  const priorResponse =
    prior.responseFingerprint ?? prior.evidenceHash ?? null;
  if (
    currentResponse &&
    priorResponse &&
    currentResponse !== priorResponse
  ) {
    return materialChangeResult("response_changed");
  }

  return materialChangeResult("observed_again");
}

/** Human labels must never include causal or quality language. */
export const FORBIDDEN_CHANGE_LANGUAGE = [
  "improved",
  "worsened",
  "higher quality",
  "more trusted",
  "declined",
  "lost visibility",
] as const;

export function assertSafeChangeLabel(label: string): boolean {
  const lower = label.toLowerCase();
  return !FORBIDDEN_CHANGE_LANGUAGE.some((word) => lower.includes(word));
}
