import "server-only";

/**
 * Centralized runtime egress inventory and allowlist enforcement.
 *
 * Allowed runtime HTTP egress:
 * - DataForSEO official API hosts (path-allowlisted in provider client)
 * - Slack incoming webhooks (hooks.slack.com only)
 *
 * SMTP uses raw TCP/TLS to operator-configured hosts (not fetch).
 * No generic URL fetch endpoints. Citation and evidence URLs are never fetched.
 */

export const RUNTIME_FETCH_HOSTS = Object.freeze([
  "api.dataforseo.com",
  "sandbox.dataforseo.com",
  "hooks.slack.com",
] as const);

export const DEVELOPMENT_ONLY_FETCH_HOSTS = Object.freeze([
  "localhost",
  "127.0.0.1",
] as const);

export type EgressCategory =
  | "monitoring_provider"
  | "notification_slack"
  | "development_local";

export type EgressInventoryEntry = Readonly<{
  id: string;
  category: EgressCategory;
  module: string;
  method: "fetch" | "smtp_tcp";
  allowedHosts: readonly string[];
  notes: string;
}>;

/** Static inventory of all runtime network egress locations. */
export const RUNTIME_EGRESS_INVENTORY: readonly EgressInventoryEntry[] =
  Object.freeze([
    Object.freeze({
      id: "dataforseo-api",
      category: "monitoring_provider" as const,
      module: "lib/providers/dataforseo/client.ts",
      method: "fetch" as const,
      allowedHosts: Object.freeze(["api.dataforseo.com", "sandbox.dataforseo.com"]),
      notes: "Path-allowlisted DataForSEO API calls only.",
    }),
    Object.freeze({
      id: "slack-webhook",
      category: "notification_slack" as const,
      module: "lib/notifications/providers/slack.ts",
      method: "fetch" as const,
      allowedHosts: Object.freeze(["hooks.slack.com"]),
      notes: "Slack incoming webhook delivery; redirect: manual.",
    }),
    Object.freeze({
      id: "smtp-delivery",
      category: "notification_slack" as const,
      module: "lib/notifications/providers/smtp.ts",
      method: "smtp_tcp" as const,
      allowedHosts: Object.freeze([]),
      notes: "SMTP host from server configuration only; not fetch-based.",
    }),
  ]);

export function isAllowedRuntimeFetchHost(
  hostname: string,
  options?: { allowDevelopmentHosts?: boolean },
): boolean {
  const normalized = hostname.toLowerCase();
  if ((RUNTIME_FETCH_HOSTS as readonly string[]).includes(normalized)) {
    return true;
  }
  if (options?.allowDevelopmentHosts) {
    return (DEVELOPMENT_ONLY_FETCH_HOSTS as readonly string[]).includes(
      normalized,
    );
  }
  return false;
}

export function assertAllowedRuntimeFetchUrl(
  url: string,
  options?: { allowDevelopmentHosts?: boolean; category?: EgressCategory },
): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new EgressViolationError("invalid_url", "URL is not valid.");
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new EgressViolationError(
      "forbidden_protocol",
      "Only HTTP(S) egress is permitted.",
    );
  }

  if (
    parsed.protocol === "http:" &&
    process.env.NODE_ENV === "production" &&
    !options?.allowDevelopmentHosts
  ) {
    throw new EgressViolationError(
      "insecure_protocol",
      "Production egress must use HTTPS.",
    );
  }

  if (
    !isAllowedRuntimeFetchHost(parsed.hostname, {
      allowDevelopmentHosts: options?.allowDevelopmentHosts,
    })
  ) {
    throw new EgressViolationError(
      "host_not_allowlisted",
      "Destination host is not on the runtime egress allowlist.",
    );
  }
}

export class EgressViolationError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "EgressViolationError";
    this.code = code;
  }
}

/** Returns safe inventory metadata for operators and check scripts. */
export function getEgressInventorySummary(): Readonly<{
  fetchHosts: readonly string[];
  developmentHosts: readonly string[];
  entries: readonly EgressInventoryEntry[];
}> {
  return Object.freeze({
    fetchHosts: RUNTIME_FETCH_HOSTS,
    developmentHosts: DEVELOPMENT_ONLY_FETCH_HOSTS,
    entries: RUNTIME_EGRESS_INVENTORY,
  });
}
