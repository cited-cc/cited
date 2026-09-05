import {
  confidenceLabelFromScore,
  type ConfidenceLabel,
} from "@/lib/classification/confidence";
import {
  classificationFingerprint,
  excerptAroundMatch,
} from "@/lib/classification/fingerprints";
import {
  matchBrand,
  normalizeBrandPhrase,
} from "@/lib/classification/match-brand";
import { matchCompetitor } from "@/lib/classification/match-competitor";
import { matchDomain } from "@/lib/classification/match-domain";
import {
  hasRecommendationCueNear,
  MIN_MENTION_CONFIDENCE,
  MIN_RECOMMENDATION_CONFIDENCE,
} from "@/lib/classification/recommendation-rules";
import type {
  ClassifiedCitationEvent,
  NormalizedAiResult,
} from "@/lib/monitoring/types";
import type { CitationEventType } from "@/types/product";

export type ClassificationContext = {
  workspaceId: string;
  domainId: string;
  brandId?: string | null;
  monitorConfigurationId: string;
  verifiedHostname: string;
  approvedAliases: string[];
  brandNames: string[];
  competitorHostnames: string[];
};

export type ClassificationResult = {
  eventType: CitationEventType;
  matchedDomainId?: string;
  matchedBrandId?: string;
  matchedCompetitorId?: string;
  evidenceIds: string[];
  reasonCode: string;
  confidenceLabel: ConfidenceLabel;
};

export type ClassificationReasonCode =
  | "exact_domain_citation"
  | "alias_domain_citation"
  | "brand_mention"
  | "brand_recommendation"
  | "brand_recommendation_with_citation"
  | "configured_competitor_citation"
  | "missed_opportunity_competitor_present";

/**
 * Deterministic citation/mention/recommendation classifier.
 * Precedence: Citation > Recommendation(+citation) > Recommendation > Mention > Competitor > Missed Opportunity
 *
 * Does not claim global absence or business impact.
 */
export function classifyNormalizedResult(
  result: NormalizedAiResult,
  context: ClassificationContext,
): ClassifiedCitationEvent[] {
  const events: ClassifiedCitationEvent[] = [];
  let customerCited = false;
  let competitorCited = false;
  const competitorHostsFound = new Set<string>();

  for (const citation of result.citations) {
    const domainHit = matchDomain(
      citation.hostname,
      context.verifiedHostname,
      context.approvedAliases,
    );

    if (domainHit.matched) {
      customerCited = true;
      const identity =
        citation.normalizedUrl ?? citation.hostname ?? context.verifiedHostname;
      events.push({
        eventType: "citation",
        confidenceScore: domainHit.confidence,
        fingerprintKey: identity,
        matchedDomainId: context.domainId,
        citedUrl: citation.url ?? null,
        citedUrlNormalized: citation.normalizedUrl ?? null,
        citedHostname: citation.hostname ?? null,
        sourceTitle: citation.title ?? null,
        sourceSnippet: citation.snippet ?? null,
        citationPosition: citation.position ?? null,
        evidence: [
          {
            evidenceType: "source_link",
            evidenceUrl: citation.url ?? null,
            evidenceText: citation.title ?? citation.snippet ?? citation.url,
            evidencePosition: citation.position ?? null,
            metadata: {
              viaAlias: domainHit.viaAlias,
              reasonCode: domainHit.viaAlias
                ? "alias_domain_citation"
                : "exact_domain_citation",
              confidenceLabel: domainHit.confidenceLabel,
            },
          },
          {
            evidenceType: "domain_match",
            evidenceText: citation.hostname ?? context.verifiedHostname,
            evidenceUrl: citation.url ?? null,
          },
        ],
        metadata: {
          reasonCode: domainHit.viaAlias
            ? "alias_domain_citation"
            : "exact_domain_citation",
          confidenceLabel: domainHit.confidenceLabel,
        },
      });
      continue;
    }

    const competitor = matchCompetitor(
      citation.hostname,
      context.competitorHostnames,
    );
    if (competitor) {
      competitorCited = true;
      competitorHostsFound.add(competitor);
      events.push({
        eventType: "competitor_citation",
        confidenceScore: 0.9,
        fingerprintKey: citation.normalizedUrl ?? competitor,
        citedUrl: citation.url ?? null,
        citedUrlNormalized: citation.normalizedUrl ?? null,
        citedHostname: citation.hostname ?? null,
        sourceTitle: citation.title ?? null,
        sourceSnippet: citation.snippet ?? null,
        citationPosition: citation.position ?? null,
        evidence: [
          {
            evidenceType: "competitor_match",
            evidenceUrl: citation.url ?? null,
            evidenceText: citation.title ?? competitor,
            evidencePosition: citation.position ?? null,
            metadata: {
              reasonCode: "configured_competitor_citation",
              confidenceLabel: "strong",
            },
          },
        ],
        metadata: {
          reasonCode: "configured_competitor_citation",
          confidenceLabel: "strong",
          matchedCompetitorHostname: competitor,
        },
      });
    }
  }

  const brandMatches = matchBrand(result.responseText, context.brandNames);

  if (!customerCited) {
    for (const brand of brandMatches) {
      const recommend = hasRecommendationCueNear(
        result.responseText,
        brand.index,
        brand.matched.length,
      );
      const excerpt = excerptAroundMatch(result.responseText, brand.matched);

      if (
        recommend &&
        brand.confidenceScore >= MIN_RECOMMENDATION_CONFIDENCE - 0.05
      ) {
        events.push({
          eventType: "recommendation",
          confidenceScore: Math.max(brand.confidenceScore, 0.85),
          fingerprintKey: `brand:${normalizeBrandPhrase(brand.matched)}`,
          matchedBrandId: context.brandId ?? null,
          matchedDomainId: context.domainId,
          evidence: [
            {
              evidenceType: "recommendation_excerpt",
              evidenceText: excerpt,
            },
            {
              evidenceType: "brand_match",
              evidenceText: brand.matched,
            },
          ],
          metadata: {
            recommendation: true,
            reasonCode: "brand_recommendation",
            confidenceLabel: "strong",
          },
        });
      } else if (brand.confidenceScore >= MIN_MENTION_CONFIDENCE) {
        events.push({
          eventType: "mention",
          confidenceScore: brand.confidenceScore,
          fingerprintKey: `brand:${normalizeBrandPhrase(brand.matched)}`,
          matchedBrandId: context.brandId ?? null,
          matchedDomainId: context.domainId,
          evidence: [
            {
              evidenceType: "brand_match",
              evidenceText: brand.matched,
            },
            {
              evidenceType: "response_excerpt",
              evidenceText: excerpt,
            },
          ],
          metadata: {
            reasonCode: "brand_mention",
            confidenceLabel: brand.confidenceLabel,
          },
        });
      }
    }
  } else {
    for (const brand of brandMatches) {
      const recommend = hasRecommendationCueNear(
        result.responseText,
        brand.index,
        brand.matched.length,
      );
      if (
        recommend &&
        brand.confidenceScore >= MIN_RECOMMENDATION_CONFIDENCE - 0.05
      ) {
        const excerpt = excerptAroundMatch(result.responseText, brand.matched);
        events.push({
          eventType: "recommendation",
          confidenceScore: Math.max(brand.confidenceScore, 0.88),
          fingerprintKey: `brand:${normalizeBrandPhrase(brand.matched)}:rec`,
          matchedBrandId: context.brandId ?? null,
          matchedDomainId: context.domainId,
          evidence: [
            {
              evidenceType: "recommendation_excerpt",
              evidenceText: excerpt,
            },
            {
              evidenceType: "domain_match",
              evidenceText: context.verifiedHostname,
            },
          ],
          metadata: {
            withCitation: true,
            reasonCode: "brand_recommendation_with_citation",
            confidenceLabel: "strong",
          },
        });
      }
    }
  }

  if (
    !customerCited &&
    competitorCited &&
    context.competitorHostnames.length > 0
  ) {
    for (const host of competitorHostsFound) {
      events.push({
        eventType: "missed_opportunity",
        confidenceScore: 0.8,
        fingerprintKey: `missed:${host}`,
        matchedDomainId: context.domainId,
        citedHostname: host,
        evidence: [
          {
            evidenceType: "competitor_match",
            evidenceText: host,
          },
          {
            evidenceType: "response_excerpt",
            evidenceText: excerptAroundMatch(result.responseText, host, 60),
          },
        ],
        metadata: {
          reasonCode: "missed_opportunity_competitor_present",
          confidenceLabel: "possible",
          scope: "monitored_result_only",
        },
      });
    }
  }

  return events.map((event) => ({
    ...event,
    metadata: {
      ...event.metadata,
      fingerprint: classificationFingerprint({
        workspaceId: context.workspaceId,
        domainId: context.domainId,
        monitorConfigurationId: context.monitorConfigurationId,
        aiSurface: result.aiSurface,
        eventType: event.eventType,
        identityKey: event.fingerprintKey,
      }),
    },
  }));
}

/**
 * Typed classification summary for a single event (safe for internal use).
 * evidenceIds are filled after persistence; empty until then.
 */
export function toClassificationResult(
  event: ClassifiedCitationEvent,
  evidenceIds: string[] = [],
): ClassificationResult {
  const reasonCode =
    typeof event.metadata?.reasonCode === "string"
      ? event.metadata.reasonCode
      : "unspecified";
  const label =
    (event.metadata?.confidenceLabel as ConfidenceLabel | undefined) ??
    confidenceLabelFromScore(event.confidenceScore);

  return {
    eventType: event.eventType,
    matchedDomainId: event.matchedDomainId ?? undefined,
    matchedBrandId: event.matchedBrandId ?? undefined,
    matchedCompetitorId:
      typeof event.metadata?.matchedCompetitorHostname === "string"
        ? event.metadata.matchedCompetitorHostname
        : undefined,
    evidenceIds,
    reasonCode,
    confidenceLabel: label,
  };
}

/** Sync classifier implementing the CitationClassifier contract. */
export class DeterministicCitationClassifier {
  classifySync(
    result: NormalizedAiResult,
    context: ClassificationContext,
  ): ClassifiedCitationEvent[] {
    return classifyNormalizedResult(result, context);
  }
}
