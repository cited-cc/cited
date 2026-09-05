/** Immutable classification contract version. Historical scans retain their snapshot version. */
export const CLASSIFICATION_VERSION = "2026-09-04";

export type ClassificationPrecedenceRule =
  | "citation"
  | "recommendation_with_citation"
  | "recommendation"
  | "mention"
  | "competitor_citation"
  | "missed_opportunity";

/**
 * Documented precedence (highest wins for primary event selection per citation pass).
 * Multiple secondary events may coexist (e.g. competitor_citation + missed_opportunity).
 */
export const CLASSIFICATION_PRECEDENCE: readonly ClassificationPrecedenceRule[] =
  [
    "citation",
    "recommendation_with_citation",
    "recommendation",
    "mention",
    "competitor_citation",
    "missed_opportunity",
  ] as const;

export type ClassificationContract = {
  version: typeof CLASSIFICATION_VERSION;
  precedence: readonly ClassificationPrecedenceRule[];
  rules: {
    citationRequiresValidatedSource: true;
    mentionDistinctFromCitation: true;
    recommendationDeterministic: true;
    competitorDoesNotOverridePrimaryCitation: true;
    missedOpportunityRequiresCompetitorPresentWithoutPrimaryCitation: true;
    noProviderNetworkCalls: true;
    noBillingOrAuthState: true;
  };
};

export const CLASSIFICATION_CONTRACT: ClassificationContract = {
  version: CLASSIFICATION_VERSION,
  precedence: CLASSIFICATION_PRECEDENCE,
  rules: {
    citationRequiresValidatedSource: true,
    mentionDistinctFromCitation: true,
    recommendationDeterministic: true,
    competitorDoesNotOverridePrimaryCitation: true,
    missedOpportunityRequiresCompetitorPresentWithoutPrimaryCitation: true,
    noProviderNetworkCalls: true,
    noBillingOrAuthState: true,
  },
};

export type ClassificationReasonCode =
  | "exact_domain_citation"
  | "alias_domain_citation"
  | "brand_mention"
  | "brand_recommendation"
  | "brand_recommendation_with_citation"
  | "configured_competitor_citation"
  | "missed_opportunity_competitor_present"
  | "empty_or_malformed_result"
  | "unspecified";

export function mapReasonToPrecedence(
  reasonCode: string,
): ClassificationPrecedenceRule | null {
  switch (reasonCode) {
    case "exact_domain_citation":
    case "alias_domain_citation":
      return "citation";
    case "brand_recommendation_with_citation":
      return "recommendation_with_citation";
    case "brand_recommendation":
      return "recommendation";
    case "brand_mention":
      return "mention";
    case "configured_competitor_citation":
      return "competitor_citation";
    case "missed_opportunity_competitor_present":
      return "missed_opportunity";
    default:
      return null;
  }
}
