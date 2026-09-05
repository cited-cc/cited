function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function normalizeBrandPhrase(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export type BrandMatch = {
  matched: string;
  index: number;
  confidenceScore: number;
  confidenceLabel: "exact" | "strong" | "possible";
};

/**
 * Boundary-aware brand match. Rejects partial-word hits.
 * Deterministic only. No LLM.
 */
export function matchBrand(
  responseText: string,
  brandNames: readonly string[],
): BrandMatch[] {
  const matches: BrandMatch[] = [];
  const seen = new Set<string>();

  for (const raw of brandNames) {
    const phrase = raw.trim();
    if (phrase.length < 2) continue;
    if (phrase.length < 4 && !phrase.includes(" ")) continue;

    const pattern = new RegExp(
      `(?<![\\w])${escapeRegExp(phrase)}(?![\\w])`,
      "iu",
    );
    const match = pattern.exec(responseText);
    if (!match || match.index === undefined) continue;
    const key = normalizeBrandPhrase(phrase);
    if (seen.has(key)) continue;
    seen.add(key);
    const multiWord = phrase.includes(" ");
    matches.push({
      matched: match[0],
      index: match.index,
      confidenceScore: multiWord ? 0.85 : 0.8,
      confidenceLabel: multiWord ? "strong" : "possible",
    });
  }

  return matches;
}

/** @deprecated Prefer matchBrand */
export const findBrandMatches = matchBrand;
