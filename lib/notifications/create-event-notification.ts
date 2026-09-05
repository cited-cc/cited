import { createAdminSupabaseClient } from "@/lib/db/admin";
import type { Json } from "@/lib/db/types";
import { getOptionalServerEnv } from "@/lib/env";
import {
  getWorkspaceNotificationPreferences,
} from "@/lib/notifications/preferences";
import {
  mapCitationEventToNotificationType,
  type NotificationPriority,
  type NotificationType,
  type SafePayloadSummary,
} from "@/lib/notifications/types";
import { logger } from "@/lib/security/logger";
import type { CitationEventType } from "@/types/product";

export function buildEventDedupeKey(input: {
  workspaceId: string;
  notificationType: NotificationType;
  citationEventId: string;
  occurrenceId?: string | null;
  materialChangeType?: string | null;
}): string {
  const parts = [
    input.workspaceId,
    input.notificationType,
    input.citationEventId,
  ];
  if (input.occurrenceId) parts.push(input.occurrenceId);
  if (input.materialChangeType) parts.push(input.materialChangeType);
  return parts.join(":");
}

export function buildMonitorDedupeKey(input: {
  workspaceId: string;
  notificationType: NotificationType;
  monitorIdOrGroup: string;
  issueFingerprint: string;
}): string {
  return [
    input.workspaceId,
    input.notificationType,
    input.monitorIdOrGroup,
    input.issueFingerprint,
  ].join(":");
}

export function buildDigestDedupeKey(input: {
  workspaceId: string;
  channel: "email" | "slack";
  periodStart: string;
  periodEnd: string;
}): string {
  return [
    input.workspaceId,
    "weekly_digest",
    input.channel,
    input.periodStart,
    input.periodEnd,
  ].join(":");
}

export function buildFreeScanDedupeKey(input: {
  requestId: string;
}): string {
  return `free_scan_result:${input.requestId}`;
}

async function shouldCreateEventNotification(input: {
  workspaceId: string;
  notificationType: NotificationType;
}): Promise<boolean> {
  const prefs = await getWorkspaceNotificationPreferences(input.workspaceId);

  switch (input.notificationType) {
    case "new_citation":
    case "new_mention":
    case "new_recommendation":
      return prefs.instantEmailEnabled;
    case "new_competitor_citation":
      return (
        prefs.competitorAlertsEnabled && prefs.instantEmailEnabled
      );
    case "new_missed_opportunity":
      return (
        prefs.missedOpportunityAlertsEnabled && prefs.instantEmailEnabled
      );
    case "renewed_citation":
      return (
        prefs.recurringCitationAlertsEnabled && prefs.instantEmailEnabled
      );
    case "monitor_blocked":
    case "monitor_recovered":
    case "monitor_repeated_failure":
    case "usage_safety_limit_reached":
    case "domain_verification_required":
      return prefs.monitorIssueEmailEnabled;
    case "weekly_digest":
      return prefs.weeklyDigestEmailEnabled;
    case "free_scan_result":
      return true;
    case "welcome_day_0":
    case "welcome_day_2":
    case "welcome_day_5":
    case "welcome_day_10":
    case "welcome_day_14":
    case "learn_domains_day_21":
      return prefs.productTipsEmailEnabled;
    default: {
      const _exhaustive: never = input.notificationType;
      return _exhaustive;
    }
  }
}

export async function enqueueNotificationOutbox(input: {
  workspaceId: string;
  notificationType: NotificationType;
  sourceEntityType: string;
  sourceEntityId: string;
  dedupeKey: string;
  payloadSummary?: SafePayloadSummary;
  priority?: NotificationPriority;
  availableAt?: Date;
}): Promise<{ created: boolean; outboxId?: string }> {
  const env = getOptionalServerEnv();
  const maxAttempts = env.NOTIFICATIONS_MAX_ATTEMPTS ?? 5;

  // Soft gate at creation; delivery re-checks preferences.
  const allowed = await shouldCreateEventNotification({
    workspaceId: input.workspaceId,
    notificationType: input.notificationType,
  });
  if (!allowed && input.notificationType !== "free_scan_result") {
    logger.info("Notification suppressed by workspace preferences", {
      event: "notifications.outbox.suppressed_prefs",
      workspaceId: input.workspaceId,
      notification_type: input.notificationType,
    });
    return { created: false };
  }

  const admin = createAdminSupabaseClient();
  const summary = (input.payloadSummary ?? {}) as Json;

  const { data, error } = await admin
    .from("notification_outbox")
    .upsert(
      {
        workspace_id: input.workspaceId,
        event_type: input.notificationType,
        notification_type: input.notificationType,
        source_entity_type: input.sourceEntityType,
        source_entity_id: input.sourceEntityId,
        dedupe_key: input.dedupeKey,
        status: "pending",
        priority: input.priority ?? "normal",
        payload: summary,
        payload_summary: summary,
        available_at: (input.availableAt ?? new Date()).toISOString(),
        max_attempts: maxAttempts,
        attempt_count: 0,
      },
      {
        onConflict: "workspace_id,dedupe_key",
        ignoreDuplicates: true,
      },
    )
    .select("id")
    .maybeSingle();

  if (error) {
    // Fallback to legacy unique constraint if dedupe_key unique not available.
    if (error.code === "42P10" || error.message?.includes("dedupe_key")) {
      const { data: legacy, error: legacyError } = await admin
        .from("notification_outbox")
        .upsert(
          {
            workspace_id: input.workspaceId,
            event_type: input.notificationType,
            notification_type: input.notificationType,
            source_entity_type: input.sourceEntityType,
            source_entity_id: input.sourceEntityId,
            dedupe_key: input.dedupeKey,
            status: "pending",
            priority: input.priority ?? "normal",
            payload: summary,
            payload_summary: summary,
            available_at: (input.availableAt ?? new Date()).toISOString(),
            max_attempts: maxAttempts,
          },
          {
            onConflict:
              "workspace_id,event_type,source_entity_type,source_entity_id",
            ignoreDuplicates: true,
          },
        )
        .select("id")
        .maybeSingle();

      if (legacyError) {
        logger.error("Failed to enqueue notification outbox", {
          event: "notifications.outbox.enqueue_failed",
          workspaceId: input.workspaceId,
          notification_type: input.notificationType,
        });
        return { created: false };
      }
      return { created: Boolean(legacy?.id), outboxId: legacy?.id as string | undefined };
    }

    logger.error("Failed to enqueue notification outbox", {
      event: "notifications.outbox.enqueue_failed",
      workspaceId: input.workspaceId,
      notification_type: input.notificationType,
    });
    return { created: false };
  }

  return { created: Boolean(data?.id), outboxId: data?.id as string | undefined };
}

/**
 * Create outbox row for a newly created citation event.
 */
export async function createEventNotification(input: {
  workspaceId: string;
  citationEventId: string;
  eventType: CitationEventType;
  aiSurface?: string;
  occurrenceId?: string | null;
}): Promise<{ created: boolean; outboxId?: string }> {
  const notificationType = mapCitationEventToNotificationType(input.eventType);
  const dedupeKey = buildEventDedupeKey({
    workspaceId: input.workspaceId,
    notificationType,
    citationEventId: input.citationEventId,
  });

  return enqueueNotificationOutbox({
    workspaceId: input.workspaceId,
    notificationType,
    sourceEntityType: "citation_event",
    sourceEntityId: input.citationEventId,
    dedupeKey,
    payloadSummary: {
      eventType: input.eventType,
      eventId: input.citationEventId,
      aiSurface: input.aiSurface,
      occurrenceId: input.occurrenceId ?? undefined,
    },
    priority: "normal",
  });
}

/**
 * Renewed citation alert: only when recurring alerts enabled and eligible.
 */
export async function createRenewedCitationNotification(input: {
  workspaceId: string;
  citationEventId: string;
  occurrenceId: string;
  eventType: CitationEventType;
  aiSurface?: string;
  materialChangeType?: string | null;
}): Promise<{ created: boolean; outboxId?: string }> {
  const prefs = await getWorkspaceNotificationPreferences(input.workspaceId);
  if (!prefs.recurringCitationAlertsEnabled) {
    return { created: false };
  }

  const dedupeKey = buildEventDedupeKey({
    workspaceId: input.workspaceId,
    notificationType: "renewed_citation",
    citationEventId: input.citationEventId,
    occurrenceId: input.occurrenceId,
    materialChangeType: input.materialChangeType,
  });

  return enqueueNotificationOutbox({
    workspaceId: input.workspaceId,
    notificationType: "renewed_citation",
    sourceEntityType: "citation_event_occurrence",
    sourceEntityId: input.occurrenceId,
    dedupeKey,
    payloadSummary: {
      eventType: input.eventType,
      eventId: input.citationEventId,
      occurrenceId: input.occurrenceId,
      aiSurface: input.aiSurface,
    },
    priority: "low",
  });
}

export async function createMonitorIssueNotification(input: {
  workspaceId: string;
  notificationType:
    | "monitor_blocked"
    | "monitor_recovered"
    | "monitor_repeated_failure"
    | "usage_safety_limit_reached"
    | "domain_verification_required";
  monitorIdOrGroup: string;
  issueFingerprint: string;
  reason?: string;
  priority?: NotificationPriority;
}): Promise<{ created: boolean; outboxId?: string }> {
  const dedupeKey = buildMonitorDedupeKey({
    workspaceId: input.workspaceId,
    notificationType: input.notificationType,
    monitorIdOrGroup: input.monitorIdOrGroup,
    issueFingerprint: input.issueFingerprint,
  });

  return enqueueNotificationOutbox({
    workspaceId: input.workspaceId,
    notificationType: input.notificationType,
    sourceEntityType:
      input.notificationType === "usage_safety_limit_reached"
        ? "workspace"
        : "monitor_configuration",
    sourceEntityId: input.monitorIdOrGroup,
    dedupeKey,
    payloadSummary: {
      monitorId: input.monitorIdOrGroup,
      issueFingerprint: input.issueFingerprint,
      reason: input.reason,
    },
    priority: input.priority ?? "high",
  });
}
