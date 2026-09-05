/**
 * Citation helpers: domain normalization, verification, and classification re-exports.
 * Dead Phase 1 NotImplementedCitationClassifier removed.
 */

export type {
  ClassificationContext,
  ClassificationResult,
  ClassificationReasonCode,
} from "@/lib/classification";

export {
  classifyNormalizedResult,
  DeterministicCitationClassifier,
  findBrandMatches,
  matchBrand,
  matchCompetitor,
  matchDomain,
  toClassificationResult,
} from "@/lib/classification";

export {
  HostnameNormalizationError,
  dedupeHostnames,
  dedupeUrls,
  extractHostname,
  getRegistrableDomain,
  isApprovedDomainMatch,
  isDomainMatch,
  isSubdomainMatch,
  normalizeHostname,
  normalizeUrl,
} from "@/lib/citations/normalize";

export {
  checkDomainVerificationDns,
  rotateDomainVerificationToken,
  generateVerificationToken,
  formatDnsTxtValue,
  upsertDomainAndBrand,
  getWorkspaceDomainSetup,
  parseAlternateNames,
  type DnsVerificationOutcome,
} from "@/lib/citations/domain-verification";
