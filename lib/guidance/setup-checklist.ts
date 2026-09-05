"use server";

import { resolveCurrentAccessState } from "@/lib/auth/access-state";
import { requireWorkspaceRole } from "@/lib/auth";
import { createAdminSupabaseClient, requireWorkspaceScope } from "@/lib/db/admin";
import { canManageWorkspaceSettings } from "@/lib/auth/permissions";
import type { SetupChecklistState } from "@/components/guidance/setup-checklist";
import type { WorkspaceRole } from "@/types/product";

export async function getSetupChecklistData(): Promise<{
  state: SetupChecklistState;
  canManageSetup: boolean;
  dismissed: boolean;
  role: WorkspaceRole;
} | null> {
  const access = await resolveCurrentAccessState();
  if (
    access.kind !== "workspace_active"
  ) {
    return null;
  }

  const membership = await requireWorkspaceRole(access.workspaceId, [
    "owner",
    "admin",
    "member",
    "viewer",
  ]);
  const workspaceId = requireWorkspaceScope(access.workspaceId);
  const admin = createAdminSupabaseClient();

  const [
    { data: domain },
    { count: promptCount },
    { count: activeMonitorCount },
    { data: prefs },
    { count: eventCount },
    { data: notifPrefs },
  ] = await Promise.all([
    admin
      .from("domains")
      .select("id, verification_status")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    admin
      .from("monitored_prompts")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId),
    admin
      .from("monitor_configurations")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("activation_status", "active")
      .eq("enabled", true),
    admin
      .from("member_ui_preferences")
      .select("setup_checklist_dismissed_at")
      .eq("workspace_id", workspaceId)
      .eq("clerk_user_id", membership.clerkUserId)
      .maybeSingle(),
    admin
      .from("citation_events")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId),
    admin
      .from("user_notification_preferences")
      .select("email_alerts_enabled, weekly_digest_enabled")
      .eq("workspace_id", workspaceId)
      .eq("clerk_user_id", membership.clerkUserId)
      .maybeSingle(),
  ]);

  let brandReady = false;
  if (domain?.id) {
    const { data: brand } = await admin
      .from("brands")
      .select("id, name")
      .eq("workspace_id", workspaceId)
      .eq("primary_domain_id", domain.id)
      .maybeSingle();
    brandReady = Boolean(brand?.name);
  }

  const { count: surfaceCount } = await admin
    .from("monitor_configurations")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);

  const notificationsConfigured = Boolean(
    notifPrefs &&
      (notifPrefs.email_alerts_enabled || notifPrefs.weekly_digest_enabled),
  );

  return {
    role: membership.role,
    canManageSetup: canManageWorkspaceSettings(membership.role),
    dismissed: Boolean(prefs?.setup_checklist_dismissed_at),
    state: {
      workspace: true,
      domain: Boolean(domain),
      verify: domain?.verification_status === "verified",
      brand: brandReady,
      prompts: (promptCount ?? 0) > 0,
      surfaces: (surfaceCount ?? 0) > 0,
      activate: (activeMonitorCount ?? 0) > 0,
      notifications: notificationsConfigured,
      first_note: (eventCount ?? 0) > 0,
    },
  };
}

export async function dismissSetupChecklist(): Promise<void> {
  const access = await resolveCurrentAccessState();
  if (
    access.kind !== "workspace_active"
  ) {
    return;
  }
  const membership = await requireWorkspaceRole(access.workspaceId, [
    "owner",
    "admin",
    "member",
    "viewer",
  ]);
  const admin = createAdminSupabaseClient();
  await admin.from("member_ui_preferences").upsert(
    {
      workspace_id: access.workspaceId,
      clerk_user_id: membership.clerkUserId,
      setup_checklist_dismissed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "workspace_id,clerk_user_id" },
  );
}

export async function restoreSetupChecklist(): Promise<void> {
  const access = await resolveCurrentAccessState();
  if (
    access.kind !== "workspace_active"
  ) {
    return;
  }
  const membership = await requireWorkspaceRole(access.workspaceId, [
    "owner",
    "admin",
    "member",
    "viewer",
  ]);
  const admin = createAdminSupabaseClient();
  await admin.from("member_ui_preferences").upsert(
    {
      workspace_id: access.workspaceId,
      clerk_user_id: membership.clerkUserId,
      setup_checklist_dismissed_at: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "workspace_id,clerk_user_id" },
  );
}
