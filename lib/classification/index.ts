/**
 * Deterministic citation classification engine.
 * No LLM. No vague AI judgement. Explainable reason codes only.
 */

export {
  classifyNormalizedResult,
  DeterministicCitationClassifier,
  toClassificationResult,
  type ClassificationContext,
  type ClassificationReasonCode,
  type ClassificationResult,
} from "@/lib/classification/classify-citation-event";
export {
  confidenceLabelFromScore,
  scoreForConfidenceLabel,
  type ConfidenceLabel,
} from "@/lib/classification/confidence";
export {
  classificationFingerprint,
  buildEventFingerprint,
  excerptAroundMatch,
} from "@/lib/classification/fingerprints";
export {
  findBrandMatches,
  matchBrand,
  normalizeBrandPhrase,
} from "@/lib/classification/match-brand";
export { matchCompetitor } from "@/lib/classification/match-competitor";
export { matchDomain } from "@/lib/classification/match-domain";
export {
  hasRecommendationCueNear,
  MIN_MENTION_CONFIDENCE,
  MIN_RECOMMENDATION_CONFIDENCE,
  RECOMMENDATION_CUES,
} from "@/lib/classification/recommendation-rules";
