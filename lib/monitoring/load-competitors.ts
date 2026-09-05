import {
  dedupeHostnames,
  isDomainMatch,
  normalizeHostname,
} from "@/lib/citations/normalize";
import { createAdminSupabaseClient } from "@/lib/db/admin";
import { resolveWorkspaceEntitlements } from "@/lib/entitlements/resolve";
import type { WorkspaceEntitlementInput } from "@/lib/entitlements/provider";

export type LoadedCompetitors = {
  hostnames: string[];
  brandNames: string[];
  source: "none" | "workspace" | "monitor" | "mixed";
};

export type LoadCompetitorsInput = {
  workspaceId: string;
  domainId: string;
  monitorConfigurationId: string;
  verifiedHostname: string;
  approvedAliases: readonly string[];
  workspaceEntitlements: WorkspaceEntitlementInput;
  /** When false, skip entitlement check (e.g. replay from snapshot). */
  enforceEntitlement?: boolean;
};

/**
 * Load configured competitors scoped to workspace + optional monitor/domain.
 * Excludes primary brand domain and approved aliases.
 */
export async function loadCompetitorsForScan(
  input: LoadCompetitorsInput,
): Promise<LoadedCompetitors> {
  if (input.enforceEntitlement !== false) {
    const snapshot = resolveWorkspaceEntitlements(input.workspaceEntitlements);
    if (!snapshot.features.competitorWatch) {
      return { hostnames: [], brandNames: [], source: "none" };
    }
  }

  const admin = createAdminSupabaseClient();
  const { data: rows } = await admin
    .from("competitor_hostnames")
    .select(
      "normalized_hostname, brand_name, monitor_configuration_id, domain_id",
    )
    .eq("workspace_id", input.workspaceId)
    .or(
      `monitor_configuration_id.is.null,monitor_configuration_id.eq.${input.monitorConfigurationId}`,
    );

  const primaryHosts = new Set<string>();
  try {
    primaryHosts.add(normalizeHostname(input.verifiedHostname));
  } catch {
    // verified domain must be valid; skip if not
  }
  for (const alias of input.approvedAliases) {
    try {
      primaryHosts.add(normalizeHostname(alias));
    } catch {
      // skip invalid alias
    }
  }

  const hostnames: string[] = [];
  const brandNames: string[] = [];
  let hasWorkspace = false;
  let hasMonitor = false;

  for (const row of rows ?? []) {
    if (row.domain_id && row.domain_id !== input.domainId) {
      continue;
    }
    if (
      row.monitor_configuration_id &&
      row.monitor_configuration_id !== input.monitorConfigurationId
    ) {
      continue;
    }

    try {
      const host = normalizeHostname(row.normalized_hostname as string);
      if (primaryHosts.has(host)) {
        continue;
      }
      if (
        [...primaryHosts].some((primary) => isDomainMatch(primary, host))
      ) {
        continue;
      }
      hostnames.push(host);
      if (row.brand_name) {
        brandNames.push(String(row.brand_name));
      }
      if (row.monitor_configuration_id) {
        hasMonitor = true;
      } else {
        hasWorkspace = true;
      }
    } catch {
      // skip malformed competitor rows
    }
  }

  const deduped = dedupeHostnames(hostnames);
  const source =
    hasMonitor && hasWorkspace
      ? "mixed"
      : hasMonitor
        ? "monitor"
        : hasWorkspace
          ? "workspace"
          : deduped.length > 0
            ? "workspace"
            : "none";

  return {
    hostnames: deduped,
    brandNames: [...new Set(brandNames.map((n) => n.trim()).filter(Boolean))],
    source,
  };
}

/** Normalize competitor input for persistence. */
export function normalizeCompetitorInput(input: {
  hostname: string;
  brandName?: string | null;
  verifiedHostname: string;
  approvedAliases?: readonly string[];
}): { hostname: string; brandName: string | null } | null {
  try {
    const hostname = normalizeHostname(input.hostname);
    const primary = normalizeHostname(input.verifiedHostname);
    if (hostname === primary) {
      return null;
    }
    for (const alias of input.approvedAliases ?? []) {
      if (isDomainMatch(hostname, alias)) {
        return null;
      }
    }
    return {
      hostname,
      brandName: input.brandName?.trim() || null,
    };
  } catch {
    return null;
  }
}
