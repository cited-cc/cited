import { createAdminSupabaseClient } from "@/lib/db/admin";
import { canUseSlackAlerts } from "@/lib/entitlements";
import type { WorkspaceNotificationPreferences } from "@/lib/notifications/preferences";
import {
  isInstantEventNotificationType,
  isLifecycleNotificationType,
  isMonitorNotificationType,
  type NotificationType,
} from "@/lib/notifications/types";

export function workspaceAllowsSlackForType(
  notificationType: NotificationType,
  workspace: WorkspaceNotificationPreferences,
): boolean {
  if (!workspace.slackEnabled || !workspace.slackWebhookConfigured) {
    return false;
  }

  if (isLifecycleNotificationType(notificationType)) {
    return false;
  }

  if (notificationType === "free_scan_result") {
    return false;
  }

  if (notificationType === "weekly_digest") {
    return workspace.weeklyDigestSlackEnabled;
  }

  if (isMonitorNotificationType(notificationType)) {
    return workspace.monitorIssueSlackEnabled;
  }

  if (isInstantEventNotificationType(notificationType)) {
    return workspace.instantSlackEnabled;
  }

  return false;
}

export async function workspaceHasSlackEntitlement(
  workspaceId: string,
): Promise<boolean> {
  const admin = createAdminSupabaseClient();
  const { data: workspace } = await admin
    .from("workspaces")
    .select("id, status, plan_key")
    .eq("id", workspaceId)
    .maybeSingle();

  if (!workspace) {
    return false;
  }

  const planKey =
    (workspace.plan_key as import("@/types/product").PlanKey | null) ?? "free";
  const status =
    (workspace.status as import("@/types/product").WorkspaceStatus | null) ??
    "active";

  return canUseSlackAlerts({
    workspaceId,
    planKey,
    status,
  }).allowed;
}

export async function loadEncryptedSlackWebhook(
  workspaceId: string,
): Promise<string | null> {
  const admin = createAdminSupabaseClient();
  const { data } = await admin
    .from("notification_preferences")
    .select("slack_webhook_url_encrypted")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  return (data?.slack_webhook_url_encrypted as string | null) ?? null;
}
