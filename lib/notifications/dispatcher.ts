import { randomUUID } from "node:crypto";

import { createAdminSupabaseClient } from "@/lib/db/admin";
import {
  getOptionalServerEnv,
  isNotificationsEnabled,
} from "@/lib/env";
import {
  claimNotificationOutbox,
  computeNextAttemptAt,
  releaseStaleOutboxLocks,
  type OutboxRow,
} from "@/lib/notifications/claim-outbox";
import { runDigestScheduler } from "@/lib/notifications/digest";
import { buildAppAbsoluteUrl } from "@/lib/notifications/app-url";
import { getActiveEmailProviderId, sendNotificationEmail } from "@/lib/notifications/providers/registry";
import {
  markSlackNeedsAttention,
  markSlackSuccess,
  sendSlackWebhook,
} from "@/lib/notifications/providers/slack";
import {
  loadEncryptedSlackWebhook,
  workspaceAllowsSlackForType,
  workspaceHasSlackEntitlement,
} from "@/lib/notifications/slack-delivery";
import { resolveNotificationRecipients } from "@/lib/notifications/recipients";
import { loadNotificationContent } from "@/lib/notifications/render";
import {
  createUnsubscribeToken,
  unsubscribeScopeForNotificationType,
} from "@/lib/notifications/unsubscribe";
import {
  isLifecycleNotificationType,
  type NotificationRecipientType,
  type NotificationType,
} from "@/lib/notifications/types";
import { hashEmail } from "@/lib/security/encryption";
import { logger } from "@/lib/security/logger";

export type DispatcherSummary = {
  leasesReleased: number;
  claimed: number;
  delivered: number;
  partiallyDelivered: number;
  failed: number;
  canceled: number;
  suppressed: number;
  digestsQueued: number;
};

async function ensureDeliveryRow(input: {
  workspaceId: string;
  outboxId: string;
  channel: "email" | "slack";
  recipientType: NotificationRecipientType;
  recipientClerkUserId?: string | null;
  recipientEmailHash?: string | null;
}): Promise<{ id: string; status: string; providerMessageId: string | null }> {
  const admin = createAdminSupabaseClient();

  let query = admin
    .from("notification_deliveries")
    .select("id, status, provider_message_id")
    .eq("outbox_id", input.outboxId)
    .eq("channel", input.channel)
    .eq("recipient_type", input.recipientType);

  if (input.recipientClerkUserId) {
    query = query.eq("recipient_clerk_user_id", input.recipientClerkUserId);
  } else {
    query = query.is("recipient_clerk_user_id", null);
  }

  const { data: existing } = await query.maybeSingle();

  if (existing) {
    return {
      id: existing.id as string,
      status: existing.status as string,
      providerMessageId: (existing.provider_message_id as string | null) ?? null,
    };
  }

  const { data: inserted, error } = await admin
    .from("notification_deliveries")
    .insert({
      workspace_id: input.workspaceId,
      outbox_id: input.outboxId,
      channel: input.channel,
      recipient_type: input.recipientType,
      recipient_clerk_user_id: input.recipientClerkUserId ?? null,
      recipient_email_hash: input.recipientEmailHash ?? null,
      status: "pending",
      provider: input.channel === "email" ? getActiveEmailProviderId() : "slack",
      attempt_count: 0,
      metadata: {},
    })
    .select("id, status, provider_message_id")
    .single();

  if (error || !inserted) {
    let raceQuery = admin
      .from("notification_deliveries")
      .select("id, status, provider_message_id")
      .eq("outbox_id", input.outboxId)
      .eq("channel", input.channel)
      .eq("recipient_type", input.recipientType);
    if (input.recipientClerkUserId) {
      raceQuery = raceQuery.eq(
        "recipient_clerk_user_id",
        input.recipientClerkUserId,
      );
    } else {
      raceQuery = raceQuery.is("recipient_clerk_user_id", null);
    }
    const { data: raced } = await raceQuery.maybeSingle();
    if (raced) {
      return {
        id: raced.id as string,
        status: raced.status as string,
        providerMessageId:
          (raced.provider_message_id as string | null) ?? null,
      };
    }
    throw new Error(`Failed to create delivery row: ${error?.message}`);
  }

  return {
    id: inserted.id as string,
    status: inserted.status as string,
    providerMessageId: (inserted.provider_message_id as string | null) ?? null,
  };
}

async function updateDelivery(
  deliveryId: string,
  patch: {
    status?:
      | "pending"
      | "processing"
      | "delivered"
      | "failed"
      | "suppressed"
      | "canceled";
    provider_message_id?: string | null;
    delivered_at?: string | null;
    failed_at?: string | null;
    failure_code?: string | null;
    failure_message?: string | null;
    last_attempt_at?: string | null;
    attempt_count?: number;
  },
): Promise<void> {
  const admin = createAdminSupabaseClient();
  await admin
    .from("notification_deliveries")
    .update(patch)
    .eq("id", deliveryId);
}

async function processOutboxRow(row: OutboxRow): Promise<
  "delivered" | "partially_delivered" | "failed" | "canceled" | "suppressed"
> {
  const admin = createAdminSupabaseClient();
  const env = getOptionalServerEnv();
  const notificationType = (row.notification_type ||
    row.event_type) as NotificationType;
  const payloadSummary =
    (row.payload_summary as Record<string, unknown>) ||
    (row.payload as Record<string, unknown>) ||
    {};

  // Workspace eligibility
  const { data: workspace } = await admin
    .from("workspaces")
    .select("id, status, name")
    .eq("id", row.workspace_id)
    .maybeSingle();

  if (
    !workspace ||
    workspace.status === "canceled" ||
    workspace.status === "suspended"
  ) {
    await admin
      .from("notification_outbox")
      .update({
        status: "suppressed",
        failure_code: "workspace_inactive",
        failure_message: "Workspace is inactive.",
        locked_at: null,
        lock_expires_at: null,
      })
      .eq("id", row.id);
    return "suppressed";
  }

  if (!isNotificationsEnabled(env)) {
    // Do not mark delivered when disabled.
    await admin
      .from("notification_outbox")
      .update({
        status: "pending",
        next_attempt_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        locked_at: null,
        lock_expires_at: null,
        failure_code: "notifications_disabled",
        failure_message: "Notifications disabled; deferred.",
      })
      .eq("id", row.id);
    return "suppressed";
  }

  const manageUrl = buildAppAbsoluteUrl("/app/settings/notifications");

  const isFreeScan = notificationType === "free_scan_result";

  // Placeholder unsubscribe for initial content load; per-recipient tokens at send.
  const placeholderUnsub = manageUrl;

  const content = await loadNotificationContent({
    workspaceId: row.workspace_id,
    notificationType,
    sourceEntityType: row.source_entity_type,
    sourceEntityId: row.source_entity_id,
    payloadSummary,
    manageUrl,
    unsubscribeUrl: placeholderUnsub,
  });

  if (content.canceled) {
    await admin
      .from("notification_outbox")
      .update({
        status: "canceled",
        canceled_at: new Date().toISOString(),
        failure_code: content.cancelReason ?? "source_inaccessible",
        failure_message: "Source entity inaccessible.",
        locked_at: null,
        lock_expires_at: null,
      })
      .eq("id", row.id);
    return "canceled";
  }

  let recipients: {
    emailRecipients: Array<{
      clerkUserId: string;
      email: string;
      emailHash: string;
      role: "owner" | "admin" | "member" | "viewer";
      recipientType: NotificationRecipientType;
    }>;
    workspacePrefs: unknown;
  };

  if (isFreeScan) {
    recipients = {
      emailRecipients: content.recipientEmail
        ? [
            {
              clerkUserId: "",
              email: content.recipientEmail,
              emailHash: hashEmail(content.recipientEmail),
              role: "viewer" as const,
              recipientType: "free_scan_requester" as const,
            },
          ]
        : [],
      workspacePrefs: null,
    };
  } else {
    const resolved = await resolveNotificationRecipients({
      workspaceId: row.workspace_id,
      notificationType,
    });
    recipients = resolved;
  }

  let emailSuccess = 0;
  let emailFail = 0;
  let emailSuppressed = 0;
  let slackSuccess = 0;
  let slackFail = 0;
  let slackSuppressed = 0;
  let retryableFailure = false;
  let retryAfterSeconds: number | undefined;
  let lastFailureCode: string | null = null;

  // Email deliveries
  for (const recipient of recipients.emailRecipients) {
    const delivery = await ensureDeliveryRow({
      workspaceId: row.workspace_id,
      outboxId: row.id,
      channel: "email",
      recipientType: recipient.recipientType,
      recipientClerkUserId:
        recipient.recipientType === "free_scan_requester"
          ? null
          : recipient.clerkUserId,
      recipientEmailHash: recipient.emailHash,
    });

    if (delivery.status === "delivered") {
      emailSuccess += 1;
      continue;
    }
    if (delivery.status === "suppressed") {
      emailSuppressed += 1;
      continue;
    }

    const scope = unsubscribeScopeForNotificationType(notificationType);
    const token = await createUnsubscribeToken({
      workspaceId: row.workspace_id,
      clerkUserId:
        recipient.recipientType === "free_scan_requester"
          ? null
          : recipient.clerkUserId,
      email: recipient.email,
      scope,
    });

    // Re-render with recipient-specific unsubscribe URL.
    const personalized = await loadNotificationContent({
      workspaceId: row.workspace_id,
      notificationType,
      sourceEntityType: row.source_entity_type,
      sourceEntityId: row.source_entity_id,
      payloadSummary,
      manageUrl,
      unsubscribeUrl: token.unsubscribeUrl,
    });

    if (personalized.canceled || !personalized.email.html) {
      await updateDelivery(delivery.id, {
        status: "canceled",
        failure_code: personalized.cancelReason ?? "render_failed",
        failure_message: "Could not render email.",
        failed_at: new Date().toISOString(),
        attempt_count: 1,
        last_attempt_at: new Date().toISOString(),
      });
      emailFail += 1;
      lastFailureCode = "render_failed";
      continue;
    }

    const result = await sendNotificationEmail({
      to: recipient.email,
      subject: personalized.email.subject,
      html: personalized.email.html,
      text: personalized.email.text,
      headers: {
        "List-Unsubscribe": `<${token.unsubscribeUrl}>`,
      },
      tags: [
        { name: "notification_type", value: String(notificationType).slice(0, 40) },
      ],
      bypassNotificationsGate: isFreeScan,
    });

    const nowIso = new Date().toISOString();
    if (result.status === "sent") {
      await updateDelivery(delivery.id, {
        status: "delivered",
        provider_message_id: result.providerMessageId ?? null,
        delivered_at: nowIso,
        last_attempt_at: nowIso,
        attempt_count: 1,
        failure_code: null,
        failure_message: null,
      });
      emailSuccess += 1;
    } else if (result.status === "suppressed") {
      await updateDelivery(delivery.id, {
        status: "suppressed",
        failure_code: result.reason,
        failure_message: "Delivery suppressed.",
        last_attempt_at: nowIso,
        attempt_count: 1,
      });
      emailSuppressed += 1;
    } else {
      await updateDelivery(delivery.id, {
        status: result.retryable ? "pending" : "failed",
        failure_code: result.code,
        failure_message: result.safeMessage,
        failed_at: result.retryable ? null : nowIso,
        last_attempt_at: nowIso,
        attempt_count: 1,
      });
      emailFail += 1;
      lastFailureCode = result.code;
      if (result.retryable) retryableFailure = true;
    }
  }

  const workspacePrefs =
    recipients.workspacePrefs &&
    typeof recipients.workspacePrefs === "object" &&
    "workspaceId" in (recipients.workspacePrefs as object)
      ? (recipients.workspacePrefs as import("@/lib/notifications/preferences").WorkspaceNotificationPreferences)
      : null;

  const shouldAttemptSlack =
    !isFreeScan &&
    !isLifecycleNotificationType(notificationType) &&
    content.slack &&
    workspacePrefs &&
    workspaceAllowsSlackForType(notificationType, workspacePrefs) &&
    (await workspaceHasSlackEntitlement(row.workspace_id));

  if (shouldAttemptSlack && content.slack) {
    const encryptedWebhook = await loadEncryptedSlackWebhook(row.workspace_id);
    if (!encryptedWebhook) {
      slackSuppressed += 1;
    } else {
      const delivery = await ensureDeliveryRow({
        workspaceId: row.workspace_id,
        outboxId: row.id,
        channel: "slack",
        recipientType: "slack_workspace",
        recipientClerkUserId: null,
      });

      if (delivery.status === "delivered") {
        slackSuccess += 1;
      } else if (delivery.status === "suppressed") {
        slackSuppressed += 1;
      } else {
        const slackResult = await sendSlackWebhook({
          encryptedWebhookUrl: encryptedWebhook,
          payload: content.slack,
        });
        const nowIso = new Date().toISOString();

        if (slackResult.status === "sent") {
          await updateDelivery(delivery.id, {
            status: "delivered",
            delivered_at: nowIso,
            last_attempt_at: nowIso,
            attempt_count: 1,
            failure_code: null,
            failure_message: null,
          });
          await markSlackSuccess({ workspaceId: row.workspace_id });
          slackSuccess += 1;
        } else if (slackResult.status === "suppressed") {
          await updateDelivery(delivery.id, {
            status: "suppressed",
            failure_code: slackResult.reason,
            failure_message: "Slack delivery suppressed.",
            last_attempt_at: nowIso,
            attempt_count: 1,
          });
          slackSuppressed += 1;
        } else {
          await updateDelivery(delivery.id, {
            status: slackResult.retryable ? "pending" : "failed",
            failure_code: slackResult.code,
            failure_message: slackResult.safeMessage,
            failed_at: slackResult.retryable ? null : nowIso,
            last_attempt_at: nowIso,
            attempt_count: 1,
          });
          await markSlackNeedsAttention({
            workspaceId: row.workspace_id,
            failureCode: slackResult.code,
          });
          slackFail += 1;
          lastFailureCode = slackResult.code;
          if (slackResult.retryable) {
            retryableFailure = true;
            if (slackResult.retryAfterSeconds) {
              retryAfterSeconds = slackResult.retryAfterSeconds;
            }
          }
        }
      }
    }
  }

  const anySuccess = emailSuccess > 0 || slackSuccess > 0;
  const anyFail = emailFail > 0 || slackFail > 0;
  const onlySuppressed =
    !anySuccess &&
    !anyFail &&
    (emailSuppressed > 0 || slackSuppressed > 0) &&
    (recipients.emailRecipients.length > 0 || shouldAttemptSlack);
  const noRecipients =
    recipients.emailRecipients.length === 0 && !shouldAttemptSlack;

  const attemptCount = Number(row.attempt_count ?? 1);
  const maxAttempts = Number(row.max_attempts ?? env.NOTIFICATIONS_MAX_ATTEMPTS ?? 5);

  if (noRecipients || onlySuppressed) {
    await admin
      .from("notification_outbox")
      .update({
        status: "suppressed",
        failure_code: noRecipients ? "no_recipients" : "all_suppressed",
        failure_message: noRecipients
          ? "No eligible recipients."
          : "All deliveries suppressed.",
        locked_at: null,
        lock_expires_at: null,
        delivered_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    return "suppressed";
  }

  if (anySuccess && !anyFail) {
    await admin
      .from("notification_outbox")
      .update({
        status: "delivered",
        delivered_at: new Date().toISOString(),
        locked_at: null,
        lock_expires_at: null,
        failure_code: null,
        failure_message: null,
      })
      .eq("id", row.id);

    if (notificationType === "weekly_digest") {
      await admin
        .from("notification_digest_runs")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
        })
        .eq("outbox_id", row.id);
    }

    if (row.source_entity_type === "lifecycle_email_send") {
      await admin
        .from("lifecycle_email_sends")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
        })
        .eq("id", row.source_entity_id);
    }
    return "delivered";
  }

  if (anySuccess && anyFail) {
    if (retryableFailure && attemptCount < maxAttempts) {
      await admin
        .from("notification_outbox")
        .update({
          status: "pending",
          next_attempt_at: computeNextAttemptAt({
            attemptCount,
            retryAfterSeconds,
          }).toISOString(),
          locked_at: null,
          lock_expires_at: null,
          failure_code: lastFailureCode,
          failure_message: "Partial delivery; retrying failed channels.",
        })
        .eq("id", row.id);
    } else {
      await admin
        .from("notification_outbox")
        .update({
          status: "partially_delivered",
          delivered_at: new Date().toISOString(),
          locked_at: null,
          lock_expires_at: null,
          failure_code: lastFailureCode,
          failure_message: "Some channels failed.",
        })
        .eq("id", row.id);
    }
    return "partially_delivered";
  }

  // All failed
  if (retryableFailure && attemptCount < maxAttempts) {
    await admin
      .from("notification_outbox")
      .update({
        status: "pending",
        next_attempt_at: computeNextAttemptAt({
          attemptCount,
          retryAfterSeconds,
        }).toISOString(),
        locked_at: null,
        lock_expires_at: null,
        failure_code: lastFailureCode,
        failure_message: "Retrying after temporary failure.",
      })
      .eq("id", row.id);
    return "failed";
  }

  await admin
    .from("notification_outbox")
    .update({
      status: "failed",
      locked_at: null,
      lock_expires_at: null,
      failure_code: lastFailureCode ?? "delivery_failed",
      failure_message: "Delivery failed permanently.",
    })
    .eq("id", row.id);
  return "failed";
}

/**
 * Durable notification dispatcher. Safe to invoke repeatedly from cron.
 */
export async function runNotificationDispatcher(): Promise<DispatcherSummary> {
  const env = getOptionalServerEnv();
  const batchSize = env.NOTIFICATIONS_DISPATCH_BATCH_SIZE ?? 25;
  const workerId = randomUUID();

  const leasesReleased = await releaseStaleOutboxLocks();

  // Also enqueue digests when due.
  let digestsQueued = 0;
  try {
    const digestSummary = await runDigestScheduler({ batchSize: 25 });
    digestsQueued = digestSummary.digestsQueued;
  } catch {
    logger.warn("Digest scheduler failed inside dispatcher", {
      event: "notifications.digest.scheduler_failed",
    });
  }

  const claimed = await claimNotificationOutbox({ limit: batchSize });

  const summary: DispatcherSummary = {
    leasesReleased,
    claimed: claimed.length,
    delivered: 0,
    partiallyDelivered: 0,
    failed: 0,
    canceled: 0,
    suppressed: 0,
    digestsQueued,
  };

  for (const row of claimed) {
    try {
      const result = await processOutboxRow(row);
      switch (result) {
        case "delivered":
          summary.delivered += 1;
          break;
        case "partially_delivered":
          summary.partiallyDelivered += 1;
          break;
        case "failed":
          summary.failed += 1;
          break;
        case "canceled":
          summary.canceled += 1;
          break;
        case "suppressed":
          summary.suppressed += 1;
          break;
        default: {
          const _exhaustive: never = result;
          void _exhaustive;
        }
      }
    } catch {
      logger.error("Notification outbox processing failed", {
        event: "notifications.dispatch.row_failed",
        workspaceId: row.workspace_id,
        outbox_id: row.id,
      });
      summary.failed += 1;
      const admin = createAdminSupabaseClient();
      await admin
        .from("notification_outbox")
        .update({
          status: "pending",
          next_attempt_at: computeNextAttemptAt({
            attemptCount: Number(row.attempt_count ?? 1),
          }).toISOString(),
          locked_at: null,
          lock_expires_at: null,
          failure_code: "processing_error",
          failure_message: "Internal processing error.",
        })
        .eq("id", row.id);
    }
  }

  logger.info("Notification dispatcher completed", {
    event: "notifications.dispatch.completed",
    workerId,
    claimed: summary.claimed,
    delivered: summary.delivered,
    failed: summary.failed,
    digestsQueued: summary.digestsQueued,
  });

  return summary;
}
