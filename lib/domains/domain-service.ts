import {
  HostnameNormalizationError,
  normalizeHostname,
  getRegistrableDomain,
} from "@/lib/citations/normalize";
import { createAdminSupabaseClient } from "@/lib/db/admin";
import { getPlanEntitlements } from "@/lib/entitlements/plan-entitlements";
import { getEffectiveMaxDomains } from "@/lib/entitlements/effective-limits";
import {
  dnsTxtHostLabel,
  formatDnsTxtValue,
  generateVerificationToken,
} from "@/lib/domains/verify-dns-txt";
import type { PlanKey } from "@/types/product";

const MAX_ALTERNATE_NAMES = 8;
const MAX_ALTERNATE_NAME_LENGTH = 80;

export type DomainBrandSetup = {
  domainId: string;
  brandId: string;
  normalizedHostname: string;
  hostname: string;
  brandName: string;
  alternateNames: string[];
  verificationToken: string;
  txtValue: string;
  txtHost: string;
  verificationStatus: string;
};

export function parseAlternateNames(raw: string): string[] {
  const parts = raw
    .split(",")
    .map((part) => part.trim().replace(/\s+/g, " "))
    .filter(Boolean);

  const seen = new Set<string>();
  const result: string[] = [];

  for (const part of parts) {
    if (part.length > MAX_ALTERNATE_NAME_LENGTH) continue;
    if (/[<>{}]/.test(part)) continue;
    const key = part.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(part);
    if (result.length >= MAX_ALTERNATE_NAMES) break;
  }

  return result;
}

export function normalizeBrandName(name: string): string {
  const trimmed = name.trim().replace(/\s+/g, " ");
  if (trimmed.length < 1 || trimmed.length > 80) {
    throw new Error("Brand name must be between 1 and 80 characters.");
  }
  if (/[<>{}]/.test(trimmed)) {
    throw new Error("Brand name contains unsupported characters.");
  }
  return trimmed;
}

export async function upsertDomainAndBrand(input: {
  workspaceId: string;
  planKey: PlanKey;
  portfolioExtraDomains?: number | null;
  domainInput: string;
  brandName: string;
  alternateNamesRaw: string;
}): Promise<
  | { ok: true; data: DomainBrandSetup }
  | { ok: false; code: string; message: string }
> {
  let normalizedHostname: string;
  try {
    normalizedHostname = normalizeHostname(input.domainInput);
  } catch (error) {
    if (error instanceof HostnameNormalizationError) {
      return {
        ok: false,
        code: "malformed_domain",
        message: "Enter a valid domain such as example.com.",
      };
    }
    throw error;
  }

  const brandName = normalizeBrandName(input.brandName);
  const alternateNames = parseAlternateNames(input.alternateNamesRaw);
  const entitlements = getPlanEntitlements(input.planKey);
  const maxDomains = getEffectiveMaxDomains({
    planKey: input.planKey,
    portfolioExtraDomains: input.portfolioExtraDomains,
  });
  const admin = createAdminSupabaseClient();

  // Cross-workspace ownership: never reveal which workspace owns it.
  const { data: foreignDomain } = await admin
    .from("domains")
    .select("id, workspace_id")
    .eq("normalized_hostname", normalizedHostname)
    .neq("workspace_id", input.workspaceId)
    .limit(1)
    .maybeSingle();

  if (foreignDomain) {
    return {
      ok: false,
      code: "domain_unavailable",
      message: "This domain cannot be added to this workspace.",
    };
  }

  const { data: existingInWorkspace } = await admin
    .from("domains")
    .select(
      "id, hostname, normalized_hostname, verification_token, verification_status",
    )
    .eq("workspace_id", input.workspaceId)
    .eq("normalized_hostname", normalizedHostname)
    .maybeSingle();

  const { count: domainCount } = await admin
    .from("domains")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", input.workspaceId)
    .neq("verification_status", "disabled");

  if (
    !existingInWorkspace &&
    (domainCount ?? 0) >= maxDomains
  ) {
    return {
      ok: false,
      code: "domain_limit",
      message: `This workspace allows up to ${maxDomains} verified domain${maxDomains === 1 ? "" : "s"}. Ask your administrator to raise CITED_SELF_HOSTED_MAX_DOMAINS if needed.`,
    };
  }

  const token =
    (existingInWorkspace?.verification_token as string | null) ??
    generateVerificationToken();

  let domainId: string;

  if (existingInWorkspace) {
    domainId = existingInWorkspace.id as string;
    await admin
      .from("domains")
      .update({
        hostname: normalizedHostname,
        display_name: brandName,
        verification_token: token,
      })
      .eq("id", domainId)
      .eq("workspace_id", input.workspaceId);
  } else {
    const { data: created, error } = await admin
      .from("domains")
      .insert({
        workspace_id: input.workspaceId,
        hostname: normalizedHostname,
        normalized_hostname: normalizedHostname,
        display_name: brandName,
        verification_status: "pending",
        verification_method: "dns_txt",
        verification_token: token,
      })
      .select("id, verification_status")
      .single();

    if (error || !created) {
      return {
        ok: false,
        code: "save_failed",
        message: "Could not save domain. Try again.",
      };
    }
    domainId = created.id as string;
  }

  const normalizedBrand = brandName.toLowerCase();
  const { data: existingBrand } = await admin
    .from("brands")
    .select("id")
    .eq("workspace_id", input.workspaceId)
    .eq("normalized_name", normalizedBrand)
    .maybeSingle();

  let brandId: string;
  if (existingBrand) {
    brandId = existingBrand.id as string;
    await admin
      .from("brands")
      .update({
        name: brandName,
        alternate_names: alternateNames,
        primary_domain_id: domainId,
      })
      .eq("id", brandId)
      .eq("workspace_id", input.workspaceId);
  } else if (entitlements.maxDomains <= 1) {
    const { data: anyBrand } = await admin
      .from("brands")
      .select("id")
      .eq("workspace_id", input.workspaceId)
      .limit(1)
      .maybeSingle();

    if (anyBrand) {
      brandId = anyBrand.id as string;
      await admin
        .from("brands")
        .update({
          name: brandName,
          normalized_name: normalizedBrand,
          alternate_names: alternateNames,
          primary_domain_id: domainId,
        })
        .eq("id", brandId)
        .eq("workspace_id", input.workspaceId);
    } else {
      const { data: createdBrand, error: brandError } = await admin
        .from("brands")
        .insert({
          workspace_id: input.workspaceId,
          primary_domain_id: domainId,
          name: brandName,
          normalized_name: normalizedBrand,
          alternate_names: alternateNames,
        })
        .select("id")
        .single();

      if (brandError || !createdBrand) {
        return {
          ok: false,
          code: "save_failed",
          message: "Could not save brand. Try again.",
        };
      }
      brandId = createdBrand.id as string;
    }
  } else {
    const { data: createdBrand, error: brandError } = await admin
      .from("brands")
      .insert({
        workspace_id: input.workspaceId,
        primary_domain_id: domainId,
        name: brandName,
        normalized_name: normalizedBrand,
        alternate_names: alternateNames,
      })
      .select("id")
      .single();

    if (brandError || !createdBrand) {
      return {
        ok: false,
        code: "save_failed",
        message: "Could not save brand. Try again.",
      };
    }
    brandId = createdBrand.id as string;
  }

  const { data: domain } = await admin
    .from("domains")
    .select(
      "id, hostname, normalized_hostname, verification_token, verification_status",
    )
    .eq("id", domainId)
    .single();

  const registrable = getRegistrableDomain(normalizedHostname);
  const txtHost = dnsTxtHostLabel(normalizedHostname, registrable);
  const verificationToken = domain?.verification_token as string;

  return {
    ok: true,
    data: {
      domainId,
      brandId,
      normalizedHostname,
      hostname: (domain?.hostname as string) ?? normalizedHostname,
      brandName,
      alternateNames,
      verificationToken,
      txtValue: formatDnsTxtValue(verificationToken),
      txtHost,
      verificationStatus:
        (domain?.verification_status as string) ?? "pending",
    },
  };
}

export async function getWorkspaceDomainSetup(
  workspaceId: string,
  domainId?: string | null,
): Promise<DomainBrandSetup | null> {
  const admin = createAdminSupabaseClient();

  let query = admin
    .from("domains")
    .select(
      "id, hostname, normalized_hostname, verification_token, verification_status",
    )
    .eq("workspace_id", workspaceId)
    .neq("verification_status", "disabled");

  if (domainId) {
    query = query.eq("id", domainId);
  } else {
    query = query.order("created_at", { ascending: true }).limit(1);
  }

  const { data: domain } = await query.maybeSingle();

  if (!domain) return null;

  const { data: brand } = await admin
    .from("brands")
    .select("id, name, alternate_names")
    .eq("workspace_id", workspaceId)
    .eq("primary_domain_id", domain.id as string)
    .maybeSingle();

  const normalizedHostname = domain.normalized_hostname as string;
  const registrable = getRegistrableDomain(normalizedHostname);
  const token = (domain.verification_token as string) ?? "";

  return {
    domainId: domain.id as string,
    brandId: (brand?.id as string) ?? "",
    normalizedHostname,
    hostname: domain.hostname as string,
    brandName: (brand?.name as string) ?? "",
    alternateNames: (brand?.alternate_names as string[]) ?? [],
    verificationToken: token,
    txtValue: token ? formatDnsTxtValue(token) : "",
    txtHost: dnsTxtHostLabel(normalizedHostname, registrable),
    verificationStatus: domain.verification_status as string,
  };
}
