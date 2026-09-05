import { createAdminSupabaseClient } from "@/lib/db/admin";
import type { WorkspaceRole } from "@/types/product";
import type { SlackConnectionStatus } from "@/lib/notifications/types";

export type WorkspaceNotificationPreferences = {
  id: string;
  workspaceId: string;
  instantEmailEnabled: boolean;
  instantSlackEnabled: boolean;
  weeklyDigestEmailEnabled: boolean;
  weeklyDigestSlackEnabled: boolean;
  monitorIssueEmailEnabled: boolean;
  monitorIssueSlackEnabled: boolean;
  competitorAlertsEnabled: boolean;
  missedOpportunityAlertsEnabled: boolean;
  recurringCitationAlertsEnabled: boolean;
  productTipsEmailEnabled: boolean;
  sendEmptyDigest: boolean;
  digestWeekday: number;
  digestHour: number;
  digestTimezone: string;
  slackEnabled: boolean;
  slackWebhookConfigured: boolean;
  slackStatus: SlackConnectionStatus;
  slackLastSuccessAt: string | null;
  slackLastFailureAt: string | null;
  slackLastFailureCode: string | null;
  slackLastTestedAt: string | null;
};

export type UserNotificationPreferences = {
  id: string;
  workspaceId: string;
  clerkUserId: string;
  emailAlertsEnabled: boolean;
  weeklyDigestEnabled: boolean;
  monitorIssueAlertsEnabled: boolean;
  productTipsEnabled: boolean;
  slackMentionsEnabled: boolean;
  unsubscribedAllAt: string | null;
  emailUnsubscribedAt: string | null;
  digestUnsubscribedAt: string | null;
  productTipsUnsubscribedAt: string | null;
};

function defaultUserPrefsForRole(role: WorkspaceRole): {
  emailAlertsEnabled: boolean;
  weeklyDigestEnabled: boolean;
  monitorIssueAlertsEnabled: boolean;
  productTipsEnabled: boolean;
} {
  switch (role) {
    case "owner":
    case "admin":
      return {
        emailAlertsEnabled: true,
        weeklyDigestEnabled: true,
        monitorIssueAlertsEnabled: true,
        productTipsEnabled: true,
      };
    case "member":
      return {
        emailAlertsEnabled: false,
        weeklyDigestEnabled: true,
        monitorIssueAlertsEnabled: false,
        productTipsEnabled: false,
      };
    case "viewer":
      return {
        emailAlertsEnabled: false,
        weeklyDigestEnabled: false,
        monitorIssueAlertsEnabled: false,
        productTipsEnabled: false,
      };
    default: {
      const _exhaustive: never = role;
      return _exhaustive;
    }
  }
}

function mapWorkspacePrefs(row: Record<string, unknown>): WorkspaceNotificationPreferences {
  const encrypted = row.slack_webhook_url_encrypted as string | null;
  const slackStatus = (row.slack_status as SlackConnectionStatus) ?? "not_connected";
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    instantEmailEnabled: Boolean(
      row.instant_email_enabled ?? row.instant_citation_alerts_enabled ?? true,
    ),
    instantSlackEnabled: Boolean(row.instant_slack_enabled ?? false),
    weeklyDigestEmailEnabled: Boolean(
      row.weekly_digest_email_enabled ?? row.weekly_digest_enabled ?? true,
    ),
    weeklyDigestSlackEnabled: Boolean(row.weekly_digest_slack_enabled ?? false),
    monitorIssueEmailEnabled: Boolean(row.monitor_issue_email_enabled ?? true),
    monitorIssueSlackEnabled: Boolean(row.monitor_issue_slack_enabled ?? false),
    competitorAlertsEnabled: Boolean(row.competitor_alerts_enabled ?? false),
    missedOpportunityAlertsEnabled: Boolean(
      row.missed_opportunity_alerts_enabled ?? true,
    ),
    recurringCitationAlertsEnabled: Boolean(
      row.recurring_citation_alerts_enabled ?? false,
    ),
    productTipsEmailEnabled: Boolean(row.product_tips_email_enabled ?? true),
    sendEmptyDigest: Boolean(row.send_empty_digest ?? false),
    digestWeekday: Number(row.digest_weekday ?? 1),
    digestHour: Number(row.digest_hour ?? 9),
    digestTimezone: (row.digest_timezone as string) ?? "UTC",
    slackEnabled: Boolean(row.slack_enabled ?? false),
    slackWebhookConfigured: Boolean(encrypted),
    slackStatus: encrypted
      ? slackStatus === "not_connected"
        ? "connected"
        : slackStatus
      : "not_connected",
    slackLastSuccessAt: (row.slack_last_success_at as string | null) ?? null,
    slackLastFailureAt: (row.slack_last_failure_at as string | null) ?? null,
    slackLastFailureCode: (row.slack_last_failure_code as string | null) ?? null,
    slackLastTestedAt: (row.slack_last_tested_at as string | null) ?? null,
  };
}

function mapUserPrefs(row: Record<string, unknown>): UserNotificationPreferences {
  return {
    id: row.id as string,
    workspaceId: row.workspace_id as string,
    clerkUserId: row.clerk_user_id as string,
    emailAlertsEnabled: Boolean(row.email_alerts_enabled ?? true),
    weeklyDigestEnabled: Boolean(row.weekly_digest_enabled ?? true),
    monitorIssueAlertsEnabled: Boolean(row.monitor_issue_alerts_enabled ?? true),
    productTipsEnabled: Boolean(row.product_tips_enabled ?? true),
    slackMentionsEnabled: Boolean(row.slack_mentions_enabled ?? false),
    unsubscribedAllAt: (row.unsubscribed_all_at as string | null) ?? null,
    emailUnsubscribedAt: (row.email_unsubscribed_at as string | null) ?? null,
    digestUnsubscribedAt: (row.digest_unsubscribed_at as string | null) ?? null,
    productTipsUnsubscribedAt:
      (row.product_tips_unsubscribed_at as string | null) ?? null,
  };
}

export async function ensureWorkspaceNotificationPreferences(
  workspaceId: string,
): Promise<WorkspaceNotificationPreferences> {
  const admin = createAdminSupabaseClient();
  const { data: existing } = await admin
    .from("notification_preferences")
    .select("*")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (existing) {
    return mapWorkspacePrefs(existing as Record<string, unknown>);
  }

  const { data: inserted, error } = await admin
    .from("notification_preferences")
    .insert({
      workspace_id: workspaceId,
      email_enabled: true,
      weekly_digest_enabled: true,
      instant_citation_alerts_enabled: true,
      competitor_alerts_enabled: false,
      missed_opportunity_alerts_enabled: true,
      slack_enabled: false,
      instant_email_enabled: true,
      instant_slack_enabled: false,
      weekly_digest_email_enabled: true,
      weekly_digest_slack_enabled: false,
      monitor_issue_email_enabled: true,
      monitor_issue_slack_enabled: false,
      recurring_citation_alerts_enabled: false,
      send_empty_digest: false,
      digest_weekday: 1,
      digest_hour: 9,
      digest_timezone: "UTC",
      slack_status: "not_connected",
    })
    .select("*")
    .single();

  if (error || !inserted) {
    throw new Error(
      `Failed to create workspace notification preferences: ${error?.message ?? "unknown"}`,
    );
  }

  return mapWorkspacePrefs(inserted as Record<string, unknown>);
}

export async function getWorkspaceNotificationPreferences(
  workspaceId: string,
): Promise<WorkspaceNotificationPreferences> {
  return ensureWorkspaceNotificationPreferences(workspaceId);
}

export async function ensureUserNotificationPreferences(input: {
  workspaceId: string;
  clerkUserId: string;
  role: WorkspaceRole;
}): Promise<UserNotificationPreferences> {
  const admin = createAdminSupabaseClient();
  const { data: existing } = await admin
    .from("user_notification_preferences")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .eq("clerk_user_id", input.clerkUserId)
    .maybeSingle();

  if (existing) {
    return mapUserPrefs(existing as Record<string, unknown>);
  }

  const defaults = defaultUserPrefsForRole(input.role);
  const { data: inserted, error } = await admin
    .from("user_notification_preferences")
    .insert({
      workspace_id: input.workspaceId,
      clerk_user_id: input.clerkUserId,
      email_alerts_enabled: defaults.emailAlertsEnabled,
      weekly_digest_enabled: defaults.weeklyDigestEnabled,
      monitor_issue_alerts_enabled: defaults.monitorIssueAlertsEnabled,
      product_tips_enabled: defaults.productTipsEnabled,
      slack_mentions_enabled: false,
    })
    .select("*")
    .single();

  if (error || !inserted) {
    // Race: another request may have inserted.
    if (error?.code === "23505") {
      const { data: raced } = await admin
        .from("user_notification_preferences")
        .select("*")
        .eq("workspace_id", input.workspaceId)
        .eq("clerk_user_id", input.clerkUserId)
        .maybeSingle();
      if (raced) return mapUserPrefs(raced as Record<string, unknown>);
    }
    throw new Error(
      `Failed to create user notification preferences: ${error?.message ?? "unknown"}`,
    );
  }

  return mapUserPrefs(inserted as Record<string, unknown>);
}

export async function getUserNotificationPreferences(input: {
  workspaceId: string;
  clerkUserId: string;
  role: WorkspaceRole;
}): Promise<UserNotificationPreferences> {
  return ensureUserNotificationPreferences(input);
}

export function isUserEmailFullyUnsubscribed(
  prefs: UserNotificationPreferences,
): boolean {
  return Boolean(prefs.unsubscribedAllAt || prefs.emailUnsubscribedAt);
}

export function canReceiveInstantEmail(
  workspace: WorkspaceNotificationPreferences,
  user: UserNotificationPreferences,
): boolean {
  if (!workspace.instantEmailEnabled) return false;
  if (isUserEmailFullyUnsubscribed(user)) return false;
  return user.emailAlertsEnabled;
}

export function canReceiveDigestEmail(
  workspace: WorkspaceNotificationPreferences,
  user: UserNotificationPreferences,
): boolean {
  if (!workspace.weeklyDigestEmailEnabled) return false;
  if (isUserEmailFullyUnsubscribed(user)) return false;
  if (user.digestUnsubscribedAt) return false;
  return user.weeklyDigestEnabled;
}

export function canReceiveMonitorIssueEmail(
  workspace: WorkspaceNotificationPreferences,
  user: UserNotificationPreferences,
): boolean {
  if (!workspace.monitorIssueEmailEnabled) return false;
  if (isUserEmailFullyUnsubscribed(user)) return false;
  return user.monitorIssueAlertsEnabled;
}

export function canReceiveProductTipsEmail(
  workspace: WorkspaceNotificationPreferences,
  user: UserNotificationPreferences,
): boolean {
  if (!workspace.productTipsEmailEnabled) return false;
  if (isUserEmailFullyUnsubscribed(user)) return false;
  if (user.productTipsUnsubscribedAt) return false;
  return user.productTipsEnabled;
}

export { defaultUserPrefsForRole, mapWorkspacePrefs, mapUserPrefs };
