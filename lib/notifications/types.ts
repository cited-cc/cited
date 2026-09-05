import type { CitationEventType } from "@/types/product";

export const INSTANT_EVENT_NOTIFICATION_TYPES = [
  "new_citation",
  "new_mention",
  "new_recommendation",
  "new_competitor_citation",
  "new_missed_opportunity",
  "renewed_citation",
] as const;

export type InstantEventNotificationType =
  (typeof INSTANT_EVENT_NOTIFICATION_TYPES)[number];

export const MONITOR_NOTIFICATION_TYPES = [
  "monitor_blocked",
  "monitor_recovered",
  "monitor_repeated_failure",
  "usage_safety_limit_reached",
  "domain_verification_required",
] as const;

export type MonitorNotificationType =
  (typeof MONITOR_NOTIFICATION_TYPES)[number];

export const DIGEST_NOTIFICATION_TYPES = ["weekly_digest"] as const;

export type DigestNotificationType =
  (typeof DIGEST_NOTIFICATION_TYPES)[number];

export const FREE_SCAN_NOTIFICATION_TYPES = ["free_scan_result"] as const;

export type FreeScanNotificationType =
  (typeof FREE_SCAN_NOTIFICATION_TYPES)[number];

export const LIFECYCLE_NOTIFICATION_TYPES = [
  "welcome_day_0",
  "welcome_day_2",
  "welcome_day_5",
  "welcome_day_10",
  "welcome_day_14",
  "learn_domains_day_21",
] as const;

export type LifecycleNotificationType =
  (typeof LIFECYCLE_NOTIFICATION_TYPES)[number];

export type NotificationType =
  | InstantEventNotificationType
  | MonitorNotificationType
  | DigestNotificationType
  | FreeScanNotificationType
  | LifecycleNotificationType;

export type NotificationChannel = "email" | "slack";

export type NotificationOutboxStatus =
  | "pending"
  | "processing"
  | "delivered"
  | "partially_delivered"
  | "failed"
  | "canceled"
  | "suppressed";

export type NotificationPriority = "low" | "normal" | "high";

export type NotificationDeliveryStatus =
  | "pending"
  | "processing"
  | "delivered"
  | "failed"
  | "suppressed"
  | "canceled";

export type NotificationRecipientType =
  | "workspace_owner"
  | "workspace_admin"
  | "workspace_member"
  | "slack_workspace"
  | "free_scan_requester";

export type UnsubscribeScope =
  | "all_email"
  | "instant_alerts"
  | "weekly_digest"
  | "monitor_issues"
  | "free_scan_followup"
  | "product_tips";

export type SlackConnectionStatus =
  | "not_connected"
  | "connected"
  | "needs_attention";

export type EmailSendResult =
  | { status: "sent"; providerMessageId?: string }
  | { status: "suppressed"; reason: string }
  | {
      status: "failed";
      retryable: boolean;
      code: string;
      safeMessage: string;
    };

export type SlackSendResult =
  | { status: "sent" }
  | { status: "suppressed"; reason: string }
  | {
      status: "failed";
      retryable: boolean;
      code: string;
      safeMessage: string;
      retryAfterSeconds?: number;
    };

export type SafePayloadSummary = {
  eventType?: CitationEventType | string;
  aiSurface?: string;
  promptId?: string;
  eventId?: string;
  occurrenceId?: string;
  digestPeriodStart?: string;
  digestPeriodEnd?: string;
  monitorId?: string;
  issueFingerprint?: string;
  reason?: string;
};

export function mapCitationEventToNotificationType(
  eventType: CitationEventType,
): InstantEventNotificationType {
  switch (eventType) {
    case "citation":
      return "new_citation";
    case "mention":
      return "new_mention";
    case "recommendation":
      return "new_recommendation";
    case "competitor_citation":
      return "new_competitor_citation";
    case "missed_opportunity":
      return "new_missed_opportunity";
    default: {
      const _exhaustive: never = eventType;
      return _exhaustive;
    }
  }
}

export function isInstantEventNotificationType(
  value: string,
): value is InstantEventNotificationType {
  return (INSTANT_EVENT_NOTIFICATION_TYPES as readonly string[]).includes(
    value,
  );
}

export function isMonitorNotificationType(
  value: string,
): value is MonitorNotificationType {
  return (MONITOR_NOTIFICATION_TYPES as readonly string[]).includes(value);
}

export function isLifecycleNotificationType(
  value: string,
): value is LifecycleNotificationType {
  return (LIFECYCLE_NOTIFICATION_TYPES as readonly string[]).includes(value);
}
