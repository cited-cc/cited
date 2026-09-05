/**
 * Domain and URL normalization for citation matching.
 *
 * Matching rules:
 * - example.com matches example.com and www.example.com
 * - example.com matches blog.example.com only when that subdomain is an approved alias
 * - example.com must NOT match example.co, notexample.com, or example.com.fake-site.com
 */

const HOSTNAME_PATTERN =
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

export const MAX_URL_LENGTH = 2048;
export const MAX_HOSTNAME_LENGTH = 253;

const DISALLOWED_SCHEMES = new Set([
  "javascript",
  "data",
  "blob",
  "file",
  "vbscript",
]);

const MULTI_PART_TLDS = new Set([
  "co.uk",
  "org.uk",
  "ac.uk",
  "gov.uk",
  "com.au",
  "net.au",
  "org.au",
  "co.nz",
  "co.jp",
  "com.br",
  "com.mx",
  "co.in",
  "com.sg",
  "com.hk",
  "co.za",
]);

export class HostnameNormalizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HostnameNormalizationError";
  }
}

function stripWww(hostname: string): string {
  return hostname.startsWith("www.") ? hostname.slice(4) : hostname;
}

/**
 * Extract a hostname from a URL-like or host-like string.
 * Returns null when no hostname can be extracted.
 */
export function extractHostname(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > MAX_URL_LENGTH) {
    return null;
  }

  if (trimmed.includes("@") && !trimmed.startsWith("mailto:")) {
    return null;
  }

  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) && !/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) {
    const scheme = trimmed.split(":")[0]?.toLowerCase() ?? "";
    if (DISALLOWED_SCHEMES.has(scheme)) {
      return null;
    }
  }

  try {
    const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    const url = new URL(withProtocol);
    if (DISALLOWED_SCHEMES.has(url.protocol.replace(":", "").toLowerCase())) {
      return null;
    }
    if (url.username || url.password) {
      return null;
    }
    if (!url.hostname) {
      return null;
    }
    return url.hostname.toLowerCase();
  } catch {
    const withoutPath = trimmed.split(/[/?#]/)[0] ?? "";
    const withoutPort = withoutPath.split(":")[0]?.toLowerCase() ?? "";
    if (!withoutPort || withoutPort.includes(" ")) {
      return null;
    }
    return withoutPort || null;
  }
}

/**
 * Normalize a hostname or URL to a registrable-style host without www.
 * Examples:
 * - https://www.thrive.fi/ -> thrive.fi
 * - www.example.com -> example.com
 * - example.com/blog -> example.com
 */
export function normalizeHostname(input: string): string {
  const hostname = extractHostname(input);
  if (!hostname) {
    throw new HostnameNormalizationError("Unable to extract hostname.");
  }

  const cleaned = stripWww(hostname.replace(/\.$/, ""));

  if (!HOSTNAME_PATTERN.test(cleaned) || cleaned.length > MAX_HOSTNAME_LENGTH) {
    throw new HostnameNormalizationError(`Malformed hostname: ${input}`);
  }

  // Reject IP literals for brand domain monitoring.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(cleaned)) {
    throw new HostnameNormalizationError("IP addresses are not valid domains.");
  }

  return cleaned;
}

/**
 * Best-effort registrable domain (eTLD+1) using a small multi-part TLD list.
 * Not a full Public Suffix List; sufficient for Phase 1 matching helpers.
 */
export function getRegistrableDomain(input: string): string {
  const hostname = normalizeHostname(input);
  const parts = hostname.split(".");

  if (parts.length <= 2) {
    return hostname;
  }

  const lastTwo = parts.slice(-2).join(".");
  if (MULTI_PART_TLDS.has(lastTwo) && parts.length >= 3) {
    return parts.slice(-3).join(".");
  }

  return parts.slice(-2).join(".");
}

/**
 * Normalize a URL to a stable comparable form (lowercase host, no hash, no trailing slash).
 */
export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > MAX_URL_LENGTH) {
    throw new HostnameNormalizationError("URL is empty or too long.");
  }

  if (trimmed.includes("@") && !trimmed.startsWith("mailto:")) {
    throw new HostnameNormalizationError("Credential-bearing URLs are rejected.");
  }

  const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  let url: URL;
  try {
    url = new URL(withProtocol);
  } catch {
    throw new HostnameNormalizationError(`Malformed URL: ${input}`);
  }

  if (DISALLOWED_SCHEMES.has(url.protocol.replace(":", "").toLowerCase())) {
    throw new HostnameNormalizationError("Unsupported URL scheme.");
  }
  if (url.username || url.password) {
    throw new HostnameNormalizationError("Credential-bearing URLs are rejected.");
  }

  const hostname = normalizeHostname(url.hostname);
  const pathname =
    url.pathname === "/" ? "" : url.pathname.replace(/\/+$/, "");
  const search = url.search;

  return `https://${hostname}${pathname}${search}`;
}

/**
 * Exact domain match after normalization (www-insensitive).
 * Does not treat subdomains as matches.
 */
export function isDomainMatch(candidate: string, target: string): boolean {
  try {
    return normalizeHostname(candidate) === normalizeHostname(target);
  } catch {
    return false;
  }
}

/**
 * True when candidate is the target domain or a subdomain of it.
 * example.com matches blog.example.com
 * example.com does NOT match example.com.fake-site.com (different registrable domain)
 * example.com does NOT match notexample.com
 */
export function isSubdomainMatch(candidate: string, target: string): boolean {
  try {
    const candidateHost = normalizeHostname(candidate);
    const targetHost = normalizeHostname(target);

    if (candidateHost === targetHost) {
      return true;
    }

    // Candidate must end with .<target>
    if (!candidateHost.endsWith(`.${targetHost}`)) {
      return false;
    }

    // Guard against suffix tricks: ensure registrable domain of candidate
    // is still under or equal to target's registrable domain.
    const candidateRegistrable = getRegistrableDomain(candidateHost);
    const targetRegistrable = getRegistrableDomain(targetHost);

    return (
      candidateRegistrable === targetRegistrable ||
      candidateRegistrable.endsWith(`.${targetRegistrable}`) ||
      candidateHost.endsWith(`.${targetHost}`)
    );
  } catch {
    return false;
  }
}

/**
 * Match against a verified domain plus optional approved aliases/subdomains.
 */
export function isApprovedDomainMatch(
  candidate: string,
  verifiedDomain: string,
  approvedAliases: readonly string[] = [],
): boolean {
  if (isDomainMatch(candidate, verifiedDomain)) {
    return true;
  }

  for (const alias of approvedAliases) {
    if (isDomainMatch(candidate, alias) || isSubdomainMatch(candidate, alias)) {
      return true;
    }
  }

  // Subdomain of verified domain only when explicitly listed as alias,
  // unless caller passes the verified domain itself in aliases.
  // Default: www already handled by normalizeHostname equality.
  return false;
}

/**
 * True when candidate registrable domain equals target (suffix-attack safe).
 */
export function isRegistrableDomainMatch(
  candidate: string,
  target: string,
): boolean {
  try {
    return getRegistrableDomain(candidate) === getRegistrableDomain(target);
  } catch {
    return false;
  }
}
export function dedupeHostnames(inputs: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const input of inputs) {
    try {
      const normalized = normalizeHostname(input);
      if (!seen.has(normalized)) {
        seen.add(normalized);
        result.push(normalized);
      }
    } catch {
      // Skip malformed entries.
    }
  }

  return result;
}

export function dedupeUrls(inputs: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const input of inputs) {
    try {
      const normalized = normalizeUrl(input);
      if (!seen.has(normalized)) {
        seen.add(normalized);
        result.push(normalized);
      }
    } catch {
      // Skip malformed entries.
    }
  }

  return result;
}
