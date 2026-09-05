import { cookies } from "next/headers";

import { createAdminSupabaseClient } from "@/lib/db/admin";
import type { DomainVerificationStatus } from "@/types/product";

export const ACTIVE_DOMAIN_COOKIE = "cited_active_domain";

export type WorkspaceDomainSummary = {
  id: string;
  hostname: string;
  normalizedHostname: string;
  displayName: string | null;
  verificationStatus: DomainVerificationStatus;
  brandName: string | null;
  brandId: string | null;
  createdAt: string;
};

export type ActiveDomainContext = {
  domains: WorkspaceDomainSummary[];
  activeDomain: WorkspaceDomainSummary | null;
  activeDomainId: string | null;
  supportsDomainSwitching: boolean;
};

type DomainRow = {
  id: string;
  hostname: string;
  normalized_hostname: string;
  display_name: string | null;
  verification_status: DomainVerificationStatus;
  created_at: string;
};

function mapDomainRow(
  domain: DomainRow,
  brand?: { id: string; name: string } | null,
): WorkspaceDomainSummary {
  return {
    id: domain.id,
    hostname: domain.hostname,
    normalizedHostname: domain.normalized_hostname,
    displayName: domain.display_name,
    verificationStatus: domain.verification_status,
    brandName: brand?.name ?? domain.display_name,
    brandId: brand?.id ?? null,
    createdAt: domain.created_at,
  };
}

export async function listWorkspaceDomains(
  workspaceId: string,
): Promise<WorkspaceDomainSummary[]> {
  const admin = createAdminSupabaseClient();
  const { data: domains, error } = await admin
    .from("domains")
    .select(
      "id, hostname, normalized_hostname, display_name, verification_status, created_at",
    )
    .eq("workspace_id", workspaceId)
    .neq("verification_status", "disabled")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to list workspace domains: ${error.message}`);
  }

  const rows = (domains ?? []) as DomainRow[];
  if (rows.length === 0) {
    return [];
  }

  const { data: brands } = await admin
    .from("brands")
    .select("id, name, primary_domain_id")
    .eq("workspace_id", workspaceId);

  const brandByDomain = new Map<string, { id: string; name: string }>();
  for (const brand of brands ?? []) {
    const domainId = brand.primary_domain_id as string | null;
    if (domainId) {
      brandByDomain.set(domainId, {
        id: brand.id as string,
        name: brand.name as string,
      });
    }
  }

  return rows.map((domain) =>
    mapDomainRow(domain, brandByDomain.get(domain.id) ?? null),
  );
}

async function readMemberActiveDomainId(input: {
  workspaceId: string;
  clerkUserId: string;
}): Promise<string | null> {
  const admin = createAdminSupabaseClient();
  const { data } = await admin
    .from("workspace_members")
    .select("active_domain_id")
    .eq("workspace_id", input.workspaceId)
    .eq("clerk_user_id", input.clerkUserId)
    .maybeSingle();

  return (data?.active_domain_id as string | null) ?? null;
}

async function readCookieActiveDomainId(
  workspaceId: string,
): Promise<string | null> {
  const jar = await cookies();
  const raw = jar.get(ACTIVE_DOMAIN_COOKIE)?.value;
  if (!raw) return null;
  const [cookieWorkspaceId, domainId] = raw.split(":");
  if (cookieWorkspaceId !== workspaceId || !domainId) {
    return null;
  }
  return domainId;
}

function pickActiveDomain(
  domains: WorkspaceDomainSummary[],
  preferredDomainId: string | null,
): WorkspaceDomainSummary | null {
  if (domains.length === 0) {
    return null;
  }

  if (preferredDomainId) {
    const match = domains.find((domain) => domain.id === preferredDomainId);
    if (match) {
      return match;
    }
  }

  const verified = domains.find(
    (domain) => domain.verificationStatus === "verified",
  );
  return verified ?? domains[0] ?? null;
}

/**
 * Resolve the member's active domain within a workspace.
 * Preference order: membership column, cookie, first verified domain, first domain.
 */
export async function resolveActiveDomainContext(input: {
  workspaceId: string;
  clerkUserId: string;
  planKey?: string;
}): Promise<ActiveDomainContext> {
  const domains = await listWorkspaceDomains(input.workspaceId);
  const memberDomainId = await readMemberActiveDomainId(input);
  const cookieDomainId = await readCookieActiveDomainId(input.workspaceId);
  const activeDomain = pickActiveDomain(
    domains,
    memberDomainId ?? cookieDomainId,
  );

  const supportsDomainSwitching =
    input.planKey === "portfolio" || domains.length > 1;

  return {
    domains,
    activeDomain,
    activeDomainId: activeDomain?.id ?? null,
    supportsDomainSwitching,
  };
}

export async function setActiveDomainForMember(input: {
  workspaceId: string;
  clerkUserId: string;
  domainId: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const admin = createAdminSupabaseClient();

  const { data: domain } = await admin
    .from("domains")
    .select("id")
    .eq("id", input.domainId)
    .eq("workspace_id", input.workspaceId)
    .neq("verification_status", "disabled")
    .maybeSingle();

  if (!domain) {
    return { ok: false, message: "Domain not found in this workspace." };
  }

  const { error } = await admin
    .from("workspace_members")
    .update({
      active_domain_id: input.domainId,
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", input.workspaceId)
    .eq("clerk_user_id", input.clerkUserId);

  if (error) {
    return { ok: false, message: "Could not switch domain. Try again." };
  }

  return { ok: true };
}
