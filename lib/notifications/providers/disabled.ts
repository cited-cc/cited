import { isNotificationsEnabled } from "@/lib/env";
import type {
  EmailProvider,
  NotificationEmailPayload,
} from "@/lib/notifications/providers/email-types";
import type { EmailSendResult } from "@/lib/notifications/types";

export const disabledEmailProvider: EmailProvider = Object.freeze({
  id: "disabled",
  async send(
    payload: NotificationEmailPayload,
  ): Promise<EmailSendResult> {
    if (payload.bypassNotificationsGate) {
      return {
        status: "failed",
        retryable: false,
        code: "email_provider_disabled",
        safeMessage: "Email delivery is disabled.",
      };
    }
    return { status: "suppressed", reason: "email_provider_disabled" };
  },
});

export function createDisabledEmailProvider(): EmailProvider {
  return disabledEmailProvider;
}

export function isEmailDeliveryConfigured(
  env: Parameters<typeof isNotificationsEnabled>[0],
): boolean {
  return isNotificationsEnabled(env);
}
