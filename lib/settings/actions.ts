"use server";

import { revalidatePath } from "next/cache";

import { resolveCurrentAccessState } from "@/lib/auth/access-state";
import { requireWorkspaceRole } from "@/lib/auth";
import { createAdminSupabaseClient, requireWorkspaceScope } from "@/lib/db/admin";
import {
  parseAlternateNames,
  normalizeBrandName,
} from "@/lib/domains/domain-service";
import {
  rotateDomainVerificationToken,
  verifyDomainDnsTxt,
} from "@/lib/domains/verify-dns-txt";

async function requireSettingsAdmin() {
  const access = await resolveCurrentAccessState();
  if (
    access.kind !== "workspace_active"
  ) {
    throw new Error("Settings are not available.");
  }
  const membership = await requireWorkspaceRole(access.workspaceId, [
    "owner",
    "admin",
  ]);
  return { access, membership };
}

export async function updateWorkspaceNameAction(formData: FormData): Promise<void> {
  const { access } = await requireSettingsAdmin();
  const name = String(formData.get("name") ?? "")
    .trim()
    .replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 80) {
    return;
  }
  if (/[<>{}]/.test(name)) {
    return;
  }

  const admin = createAdminSupabaseClient();
  await admin
    .from("workspaces")
    .update({ name, updated_at: new Date().toISOString() })
    .eq("id", requireWorkspaceScope(access.workspaceId));

  revalidatePath("/app/settings");
  revalidatePath("/app/settings/workspace");
}

export async function retryDomainVerificationAction(
  formData: FormData,
): Promise<void> {
  const { access } = await requireSettingsAdmin();
  const domainId = String(formData.get("domainId") ?? "");
  if (!domainId) return;

  await verifyDomainDnsTxt({
    workspaceId: access.workspaceId,
    domainId,
  });

  revalidatePath("/app/settings");
  revalidatePath("/app/settings/domains");
  revalidatePath("/app");
}

export async function regenerateDomainTokenAction(
  formData: FormData,
): Promise<void> {
  const { access } = await requireSettingsAdmin();
  const domainId = String(formData.get("domainId") ?? "");
  const confirmed = String(formData.get("confirm") ?? "") === "1";
  if (!domainId || !confirmed) return;

  await rotateDomainVerificationToken({
    workspaceId: access.workspaceId,
    domainId,
  });

  revalidatePath("/app/settings/domains");
}

export async function updateBrandAliasesAction(
  formData: FormData,
): Promise<void> {
  const { access } = await requireSettingsAdmin();
  const brandId = String(formData.get("brandId") ?? "");
  if (!brandId) return;

  const brandName = normalizeBrandName(String(formData.get("brandName") ?? ""));
  const alternateNames = parseAlternateNames(
    String(formData.get("alternateNames") ?? ""),
  );

  const admin = createAdminSupabaseClient();
  await admin
    .from("brands")
    .update({
      name: brandName,
      normalized_name: brandName.toLowerCase(),
      alternate_names: alternateNames,
      updated_at: new Date().toISOString(),
    })
    .eq("id", brandId)
    .eq("workspace_id", requireWorkspaceScope(access.workspaceId));

  revalidatePath("/app/settings/domains");
}

export async function disableDomainAction(formData: FormData): Promise<void> {
  const { access } = await requireSettingsAdmin();
  const domainId = String(formData.get("domainId") ?? "");
  const confirmed = String(formData.get("confirm") ?? "") === "1";
  if (!domainId || !confirmed) return;

  const workspaceId = requireWorkspaceScope(access.workspaceId);
  const admin = createAdminSupabaseClient();

  const { count: activeMonitors } = await admin
    .from("monitor_configurations")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .eq("activation_status", "active")
    .eq("enabled", true);

  if ((activeMonitors ?? 0) > 0) {
    return;
  }

  await admin
    .from("domains")
    .update({
      verification_status: "disabled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", domainId)
    .eq("workspace_id", workspaceId);

  revalidatePath("/app/settings/domains");
}
