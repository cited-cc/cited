"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { resolveCurrentAccessState, accessMemberSubject } from "@/lib/auth/access-state";
import { requireWorkspaceRole } from "@/lib/auth";
import type { BillingStatus } from "@/lib/entitlements/access-types";
import {
  ACTIVE_DOMAIN_COOKIE,
  listWorkspaceDomains,
  setActiveDomainForMember,
} from "@/lib/domains/active-domain";
import { createAdminSupabaseClient } from "@/lib/db/admin";
import { upsertDomainAndBrand } from "@/lib/domains/domain-service";
import { canAddDomain } from "@/lib/entitlements/checks";
import type { WorkspaceStatus } from "@/types/product";

export async function switchActiveDomainAction(
  domainId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const access = await resolveCurrentAccessState();
  if (
    access.kind !== "workspace_active"
  ) {
    return { ok: false, message: "Domain switching is not available." };
  }

  const result = await setActiveDomainForMember({
    workspaceId: access.workspaceId,
    clerkUserId: accessMemberSubject(access),
    domainId,
  });

  if (!result.ok) {
    return result;
  }

  const jar = await cookies();
  jar.set(ACTIVE_DOMAIN_COOKIE, `${access.workspaceId}:${domainId}`, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  revalidatePath("/app");
  revalidatePath("/app/monitors");
  revalidatePath("/app/inbox");
  revalidatePath("/app/notebook");
  revalidatePath("/app/settings/domains");

  return { ok: true };
}

export async function switchActiveDomainFormAction(
  formData: FormData,
): Promise<void> {
  const domainId = String(formData.get("domainId") ?? "");
  if (!domainId) return;
  const result = await switchActiveDomainAction(domainId);
  if (result.ok) {
    redirect(`/app/settings/domains?domain=${domainId}`);
  }
}

export async function addWorkspaceDomainAction(formData: FormData): Promise<
  | { ok: true; domainId: string }
  | { ok: false; message: string }
> {
  const access = await resolveCurrentAccessState();
  if (
    access.kind !== "workspace_active"
  ) {
    return { ok: false, message: "Adding domains is not available." };
  }

  await requireWorkspaceRole(access.workspaceId, ["owner", "admin"]);

  const domainInput = String(formData.get("domain") ?? "").trim();
  const brandName = String(formData.get("brandName") ?? "").trim();
  const alternateNames = String(formData.get("alternateNames") ?? "");

  if (!domainInput || !brandName) {
    return { ok: false, message: "Domain and brand name are required." };
  }

  const admin = createAdminSupabaseClient();
  const { data: workspace } = await admin
    .from("workspaces")
    .select(
      "plan_key, portfolio_extra_domains, status, billing_status, cancel_at_period_end, current_period_end",
    )
    .eq("id", access.workspaceId)
    .maybeSingle();

  const planKey = (workspace?.plan_key ?? access.planKey) as typeof access.planKey;
  const portfolioExtraDomains = workspace?.portfolio_extra_domains as number | null;
  const domains = await listWorkspaceDomains(access.workspaceId);
  const entitlement = canAddDomain(
    {
      workspaceId: access.workspaceId,
      planKey,
      status: (workspace?.status ?? "active") as WorkspaceStatus,
      billingStatus: workspace?.billing_status as BillingStatus | null,
      cancelAtPeriodEnd: Boolean(workspace?.cancel_at_period_end),
      currentPeriodEnd: workspace?.current_period_end as string | null,
      portfolioExtraDomains,
    },
    domains.length,
  );

  if (!entitlement.allowed) {
    return { ok: false, message: entitlement.safeMessage };
  }

  const result = await upsertDomainAndBrand({
    workspaceId: access.workspaceId,
    planKey,
    portfolioExtraDomains,
    domainInput,
    brandName,
    alternateNamesRaw: alternateNames,
  });

  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  const isFirstDomain = domains.length === 0;
  if (isFirstDomain) {
    await switchActiveDomainAction(result.data.domainId);
  }

  revalidatePath("/app/settings/domains");
  revalidatePath("/app");

  return { ok: true, domainId: result.data.domainId };
}

export async function updatePortfolioExtraDomainsAction(
  _targetExtraDomains: number,
): Promise<
  | { ok: true; maxDomains: number }
  | { ok: false; message: string }
> {
  return {
    ok: false,
    message:
      "Domain slot purchases are not available in the self-hosted community edition. Ask your administrator to adjust instance limits.",
  };
}
