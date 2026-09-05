/**
 * Explainable confidence labels. No fake precision scores for customers.
 * Internal numeric scores remain for ordering/thresholds only.
 */

export type ConfidenceLabel = "exact" | "strong" | "possible";

export function confidenceLabelFromScore(score: number): ConfidenceLabel {
  if (score >= 0.99) return "exact";
  if (score >= 0.9) return "strong";
  return "possible";
}

export function scoreForConfidenceLabel(label: ConfidenceLabel): number {
  switch (label) {
    case "exact":
      return 1;
    case "strong":
      return 0.95;
    case "possible":
      return 0.8;
    default: {
      const _exhaustive: never = label;
      return _exhaustive;
    }
  }
}
