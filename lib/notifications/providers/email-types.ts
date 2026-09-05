import type { EmailSendResult } from "@/lib/notifications/types";

export type EmailProviderId = "smtp" | "disabled";

export type NotificationEmailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
  tags?: Array<{ name: string; value: string }>;
  headers?: Record<string, string>;
  replyTo?: string;
  /**
   * When true, send even if NOTIFICATIONS_ENABLED is false.
   * Reserved for operational alerts.
   */
  bypassNotificationsGate?: boolean;
};

export type EmailProvider = Readonly<{
  id: EmailProviderId;
  send(payload: NotificationEmailPayload): Promise<EmailSendResult>;
}>;
