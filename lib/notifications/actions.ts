"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireWorkspaceRole } from "@/lib/auth";
import { resolveCurrentAccessState } from "@/lib/auth/access-state";
import { canManageBilling } from "@/lib/auth/permissions";
import { createAdminSupabaseClient } from "@/lib/db/admin";
import {
  isValidIanaTimezone,
  normalizeDigestHour,
  normalizeDigestWeekday,
} from "@/lib/notifications/digest-period";
import {
  ensureUserNotificationPreferences,
  getWorkspaceNotificationPreferences,
} from "@/lib/notifications/preferences";
import { buildAppAbsoluteUrl } from "@/lib/notifications/app-url";
import {
  resolveEmailProviderId,
  sendNotificationEmail,
} from "@/lib/notifications/providers/registry";
import { getSessionPrincipal } from "@/lib/auth/session";
import { loadNotificationContent } from "@/lib/notifications/render";
import { createUnsubscribeToken } from "@/lib/notifications/unsubscribe";
import { isInstantEventNotificationType } from "@/lib/notifications/types";
import { getOptionalServerEnv, isNotificationsEnabled } from "@/lib/env";
import {
  RATE_LIMIT_PRESETS,
  assertRateLimit,
} from "@/lib/security/rate-limit";
import type { WorkspaceRole } from "@/types/product";

type ActionResult<T extends object = object> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

function checkNotificationTestRateLimit(key: string): boolean {
  const result = assertRateLimit({
    key,
    ...RATE_LIMIT_PRESETS.notificationTest,
  });
  return result.ok;
}

async function requireActiveWorkspace(): Promise<
  | { ok: true; workspaceId: string; clerkUserId: string; role: WorkspaceRole }
  | { ok: false; error: string }
> {
  const access = await resolveCurrentAccessState();
  if (
    access.kind !== "workspace_active"
  ) {
    return { ok: false, error: "Workspace access required." };
  }
  const membership = await requireWorkspaceRole(access.workspaceId, [
    "owner",
    "admin",
    "member",
    "viewer",
  ]);
  return {
    ok: true,
    workspaceId: membership.workspaceId,
    clerkUserId: membership.clerkUserId,
    role: membership.role,
  };
}

function requireWorkspaceAdmin(role: WorkspaceRole): boolean {
  return canManageBilling(role);
}

const workspacePrefsSchema = z.object({
  instantEmailEnabled: z.boolean(),
  weeklyDigestEmailEnabled: z.boolean(),
  monitorIssueEmailEnabled: z.boolean(),
  competitorAlertsEnabled: z.boolean(),
  missedOpportunityAlertsEnabled: z.boolean(),
  recurringCitationAlertsEnabled: z.boolean(),
  productTipsEmailEnabled: z.boolean(),
  sendEmptyDigest: z.boolean(),
  digestWeekday: z.number().int().min(0).max(6),
  digestHour: z.number().int().min(0).max(23),
  digestTimezone: z.string().min(1).max(64),
});

export async function updateWorkspaceNotificationPreferences(
  input: z.infer<typeof workspacePrefsSchema>,
): Promise<ActionResult> {
  const ctx = await requireActiveWorkspace();
  if (!ctx.ok) return ctx;
  if (!requireWorkspaceAdmin(ctx.role)) {
    return { ok: false, error: "Only owners and admins can edit workspace alerts." };
  }

  const parsed = workspacePrefsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid notification preferences." };
  }

  if (!isValidIanaTimezone(parsed.data.digestTimezone)) {
    return { ok: false, error: "Invalid timezone." };
  }

  const admin = createAdminSupabaseClient();
  const { error } = await admin
    .from("notification_preferences")
    .update({
      instant_email_enabled: parsed.data.instantEmailEnabled,
      instant_citation_alerts_enabled: parsed.data.instantEmailEnabled,
      email_enabled: parsed.data.instantEmailEnabled,
      instant_slack_enabled: false,
      weekly_digest_email_enabled: parsed.data.weeklyDigestEmailEnabled,
      weekly_digest_enabled: parsed.data.weeklyDigestEmailEnabled,
      weekly_digest_slack_enabled: false,
      monitor_issue_email_enabled: parsed.data.monitorIssueEmailEnabled,
      monitor_issue_slack_enabled: false,
      competitor_alerts_enabled: parsed.data.competitorAlertsEnabled,
      missed_opportunity_alerts_enabled:
        parsed.data.missedOpportunityAlertsEnabled,
      recurring_citation_alerts_enabled:
        parsed.data.recurringCitationAlertsEnabled,
      product_tips_email_enabled: parsed.data.productTipsEmailEnabled,
      send_empty_digest: parsed.data.sendEmptyDigest,
      digest_weekday: normalizeDigestWeekday(parsed.data.digestWeekday),
      digest_hour: normalizeDigestHour(parsed.data.digestHour),
      digest_timezone: parsed.data.digestTimezone,
      slack_enabled: false,
    })
    .eq("workspace_id", ctx.workspaceId);

  if (error) {
    return { ok: false, error: "Could not save workspace preferences." };
  }

  revalidatePath("/app/settings/notifications");
  return { ok: true };
}

const personalPrefsSchema = z.object({
  emailAlertsEnabled: z.boolean(),
  weeklyDigestEnabled: z.boolean(),
  monitorIssueAlertsEnabled: z.boolean(),
  productTipsEnabled: z.boolean(),
  unsubscribeAll: z.boolean().optional(),
});

export async function updatePersonalNotificationPreferences(
  input: z.infer<typeof personalPrefsSchema>,
): Promise<ActionResult> {
  const ctx = await requireActiveWorkspace();
  if (!ctx.ok) return ctx;

  const parsed = personalPrefsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid personal preferences." };
  }

  await ensureUserNotificationPreferences({
    workspaceId: ctx.workspaceId,
    clerkUserId: ctx.clerkUserId,
    role: ctx.role,
  });

  const admin = createAdminSupabaseClient();
  const now = new Date().toISOString();
  const patch = {
    email_alerts_enabled: parsed.data.unsubscribeAll
      ? false
      : parsed.data.emailAlertsEnabled,
    weekly_digest_enabled: parsed.data.unsubscribeAll
      ? false
      : parsed.data.weeklyDigestEnabled,
    monitor_issue_alerts_enabled: parsed.data.unsubscribeAll
      ? false
      : parsed.data.monitorIssueAlertsEnabled,
    product_tips_enabled: parsed.data.unsubscribeAll
      ? false
      : parsed.data.productTipsEnabled,
    unsubscribed_all_at: parsed.data.unsubscribeAll ? now : null,
    email_unsubscribed_at: parsed.data.unsubscribeAll
      ? now
      : parsed.data.emailAlertsEnabled
        ? null
        : undefined,
    digest_unsubscribed_at: parsed.data.unsubscribeAll
      ? now
      : parsed.data.weeklyDigestEnabled
        ? null
        : undefined,
    product_tips_unsubscribed_at: parsed.data.unsubscribeAll
      ? now
      : parsed.data.productTipsEnabled
        ? null
        : undefined,
  };

  const { error } = await admin
    .from("user_notification_preferences")
    .update(patch)
    .eq("workspace_id", ctx.workspaceId)
    .eq("clerk_user_id", ctx.clerkUserId);

  if (error) {
    return { ok: false, error: "Could not save personal preferences." };
  }

  revalidatePath("/app/settings/notifications");
  return { ok: true };
}

export async function sendTestEmailToSelf(): Promise<ActionResult> {
  const ctx = await requireActiveWorkspace();
  if (!ctx.ok) return ctx;
  if (!requireWorkspaceAdmin(ctx.role)) {
    return { ok: false, error: "Only owners and admins can send test emails." };
  }

  if (!checkNotificationTestRateLimit(`email-test:${ctx.clerkUserId}`)) {
    return { ok: false, error: "Wait a minute before sending another test." };
  }

  const principal = await getSessionPrincipal();
  const email = principal?.email?.trim() ?? null;
  if (!email) {
    return { ok: false, error: "No verified email on your account." };
  }

  const env = getOptionalServerEnv();
  if (!isNotificationsEnabled(env)) {
    return {
      ok: false,
      error: "Email notifications are disabled in this environment.",
    };
  }
  if (resolveEmailProviderId(env) === "disabled") {
    return {
      ok: false,
      error: "Email delivery is not configured for this environment.",
    };
  }

  const admin = createAdminSupabaseClient();
  const { data: recentEvent } = await admin
    .from("citation_events")
    .select("id, event_type")
    .eq("workspace_id", ctx.workspaceId)
    .order("last_seen_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const manageUrl = buildAppAbsoluteUrl("/app/settings/notifications");
  const token = await createUnsubscribeToken({
    workspaceId: ctx.workspaceId,
    clerkUserId: ctx.clerkUserId,
    email,
    scope: "instant_alerts",
  });

  let subject = "Cited test email";
  let html = `<p>Cited test email. Alerts are configured for your workspace.</p><p><a href="${manageUrl}">Manage notifications</a></p>`;
  let text = `Cited test email.\nManage notifications: ${manageUrl}\nUnsubscribe: ${token.unsubscribeUrl}`;

  if (recentEvent?.id) {
    const notificationType = isInstantEventNotificationType(
      `new_${recentEvent.event_type}`,
    )
      ? (`new_${recentEvent.event_type}` as const)
      : "new_citation";

    const mapped =
      recentEvent.event_type === "citation"
        ? "new_citation"
        : recentEvent.event_type === "mention"
          ? "new_mention"
          : recentEvent.event_type === "recommendation"
            ? "new_recommendation"
            : recentEvent.event_type === "competitor_citation"
              ? "new_competitor_citation"
              : recentEvent.event_type === "missed_opportunity"
                ? "new_missed_opportunity"
                : "new_citation";

    const content = await loadNotificationContent({
      workspaceId: ctx.workspaceId,
      notificationType: mapped,
      sourceEntityType: "citation_event",
      sourceEntityId: recentEvent.id as string,
      payloadSummary: {},
      manageUrl,
      unsubscribeUrl: token.unsubscribeUrl,
    });

    if (!content.canceled && content.email.html) {
      subject = `[Preview only - not a live alert] ${content.email.subject}`;
      html = content.email.html;
      text = `PREVIEW ONLY - NOT A LIVE ALERT\n\n${content.email.text}`;
    }
    void notificationType;
  }

  const result = await sendNotificationEmail({
    to: email,
    subject,
    html,
    text,
    headers: { "List-Unsubscribe": `<${token.unsubscribeUrl}>` },
  });

  if (result.status === "sent") {
    return { ok: true };
  }
  if (result.status === "suppressed") {
    return { ok: false, error: "Email send is suppressed in this environment." };
  }
  return {
    ok: false,
    error: result.safeMessage ?? "Could not send test email.",
  };
}

export async function getNotificationSettingsData(): Promise<
  ActionResult<{
    workspace: Awaited<ReturnType<typeof getWorkspaceNotificationPreferences>>;
    personal: Awaited<ReturnType<typeof ensureUserNotificationPreferences>>;
    canEditWorkspace: boolean;
  }>
> {
  const ctx = await requireActiveWorkspace();
  if (!ctx.ok) return ctx;

  const workspace = await getWorkspaceNotificationPreferences(ctx.workspaceId);
  const personal = await ensureUserNotificationPreferences({
    workspaceId: ctx.workspaceId,
    clerkUserId: ctx.clerkUserId,
    role: ctx.role,
  });

  return {
    ok: true,
    workspace,
    personal,
    canEditWorkspace: requireWorkspaceAdmin(ctx.role),
  };
}
