export const RECOMMENDATION_CUES = [
  "best",
  "recommend",
  "recommended",
  "top",
  "consider",
  "prefer",
  "go with",
  "choose",
  "strongest option",
  "best overall",
] as const;

export const MIN_RECOMMENDATION_CONFIDENCE = 0.82;
export const MIN_MENTION_CONFIDENCE = 0.8;

/**
 * Explicit recommendation evidence only.
 * Requires brand proximity plus cue words and list/recommend context.
 */
export function hasRecommendationCueNear(
  responseText: string,
  matchIndex: number,
  matchLength: number,
): boolean {
  const windowStart = Math.max(0, matchIndex - 120);
  const windowEnd = Math.min(
    responseText.length,
    matchIndex + matchLength + 120,
  );
  const window = responseText.slice(windowStart, windowEnd).toLowerCase();

  const numberedList =
    /(?:^|\n)\s*\d+[\.)]\s+[^\n]{0,80}/m.test(
      responseText.slice(Math.max(0, matchIndex - 40), matchIndex + matchLength),
    ) || /\b\d+[\.)]\s/.test(window);

  const cueHit = RECOMMENDATION_CUES.some((cue) => window.includes(cue));
  return cueHit && (numberedList || /\brecommend(?:ed|s)?\b/i.test(window));
}
