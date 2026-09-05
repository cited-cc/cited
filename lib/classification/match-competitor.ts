import {
  isDomainMatch,
  isRegistrableDomainMatch,
  normalizeHostname,
} from "@/lib/citations/normalize";

/**
 * Competitor matching uses configured competitor hostnames only.
 * Never infer competitors from arbitrary cited domains.
 *
 * Matches exact host or safe subdomain of configured competitor.
 * Rejects suffix attacks (example.com.evil.test does not match example.com).
 */
export function matchCompetitor(
  hostname: string | null | undefined,
  competitorHostnames: string[],
): string | null {
  if (!hostname || competitorHostnames.length === 0) return null;

  let candidate: string;
  try {
    candidate = normalizeHostname(hostname);
  } catch {
    return null;
  }

  for (const competitor of competitorHostnames) {
    try {
      const normalizedCompetitor = normalizeHostname(competitor);
      if (candidate === normalizedCompetitor) {
        return normalizedCompetitor;
      }
      if (
        candidate.endsWith(`.${normalizedCompetitor}`) &&
        isRegistrableDomainMatch(candidate, normalizedCompetitor)
      ) {
        return normalizedCompetitor;
      }
      if (isDomainMatch(candidate, normalizedCompetitor)) {
        return normalizedCompetitor;
      }
    } catch {
      // skip invalid competitor config
    }
  }
  return null;
}
