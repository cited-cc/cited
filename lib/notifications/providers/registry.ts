import { getOptionalServerEnv } from "@/lib/env";
import { disabledEmailProvider } from "@/lib/notifications/providers/disabled";
import type {
  EmailProvider,
  EmailProviderId,
  NotificationEmailPayload,
} from "@/lib/notifications/providers/email-types";
import { smtpEmailProvider } from "@/lib/notifications/providers/smtp";
import type { EmailSendResult } from "@/lib/notifications/types";

export function resolveEmailProviderId(
  env: ReturnType<typeof getOptionalServerEnv> = getOptionalServerEnv(),
): EmailProviderId {
  const explicit = env.CITED_EMAIL_PROVIDER;
  if (explicit === "disabled") return "disabled";
  if (explicit === "smtp") return "smtp";

  if (env.SMTP_HOST && env.SMTP_FROM_EMAIL) {
    return "smtp";
  }

  return "disabled";
}

export function resolveEmailProvider(
  env: ReturnType<typeof getOptionalServerEnv> = getOptionalServerEnv(),
): EmailProvider {
  const id = resolveEmailProviderId(env);
  switch (id) {
    case "smtp":
      return smtpEmailProvider;
    case "disabled":
      return disabledEmailProvider;
    default: {
      const _exhaustive: never = id;
      return _exhaustive;
    }
  }
}

export async function sendNotificationEmail(
  payload: NotificationEmailPayload,
): Promise<EmailSendResult> {
  return resolveEmailProvider().send(payload);
}

export function getActiveEmailProviderId(): EmailProviderId {
  return resolveEmailProvider().id;
}
