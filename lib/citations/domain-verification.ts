/**
 * Domain verification entry points.
 * Production method in Phase 4: DNS TXT (server-side only).
 */

export {
  verifyDomainDnsTxt as checkDomainVerificationDns,
  rotateDomainVerificationToken,
  generateVerificationToken,
  formatDnsTxtValue,
  type DnsVerificationOutcome,
} from "@/lib/domains/verify-dns-txt";

export {
  upsertDomainAndBrand,
  getWorkspaceDomainSetup,
  parseAlternateNames,
} from "@/lib/domains/domain-service";
