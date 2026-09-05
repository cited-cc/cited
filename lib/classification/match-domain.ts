import {
  isApprovedDomainMatch,
  normalizeHostname,
} from "@/lib/citations/normalize";

export type DomainMatchResult = {
  matched: boolean;
  confidence: number;
  viaAlias: boolean;
  confidenceLabel: "exact" | "strong" | "possible";
};

export function matchDomain(
  hostname: string | null | undefined,
  verifiedHostname: string,
  approvedAliases: string[],
): DomainMatchResult {
  if (!hostname) {
    return {
      matched: false,
      confidence: 0,
      viaAlias: false,
      confidenceLabel: "possible",
    };
  }
  try {
    const normalized = normalizeHostname(hostname);
    if (normalized === normalizeHostname(verifiedHostname)) {
      return {
        matched: true,
        confidence: 1,
        viaAlias: false,
        confidenceLabel: "exact",
      };
    }
    if (isApprovedDomainMatch(normalized, verifiedHostname, approvedAliases)) {
      return {
        matched: true,
        confidence: 0.95,
        viaAlias: true,
        confidenceLabel: "strong",
      };
    }
    return {
      matched: false,
      confidence: 0,
      viaAlias: false,
      confidenceLabel: "possible",
    };
  } catch {
    return {
      matched: false,
      confidence: 0,
      viaAlias: false,
      confidenceLabel: "possible",
    };
  }
}
