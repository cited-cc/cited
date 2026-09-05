import { createAdminSupabaseClient } from "@/lib/db/admin";
import {
  getOptionalServerEnv,
  isNotificationsEnabled,
} from "@/lib/env";
import type { SlackSendResult } from "@/lib/notifications/types";
import { assertAllowedRuntimeFetchUrl } from "@/lib/security/egress";
import { decryptSecret, encryptSecret } from "@/lib/security/encryption";
import { logger } from "@/lib/security/logger";

const SLACK_WEBHOOK_HOST = "hooks.slack.com";
const DEFAULT_TIMEOUT_MS = 10_000;

/**
 * Strict Slack incoming webhook URL validation.
 * Never log the URL.
 */
export function isValidSlackWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    if (parsed.hostname !== SLACK_WEBHOOK_HOST) return false;
    if (!parsed.pathname.startsWith("/services/")) return false;
    const parts = parsed.pathname.split("/").filter(Boolean);
    // services / T… / B… / token
    return parts.length >= 4;
  } catch {
    return false;
  }
}

export function encryptSlackWebhookUrl(url: string): string {
  const env = getOptionalServerEnv();
  if (!env.SLACK_WEBHOOK_ENCRYPTION_KEY) {
    throw new Error("SLACK_WEBHOOK_ENCRYPTION_KEY is not configured.");
  }
  if (!isValidSlackWebhookUrl(url)) {
    throw new Error("Invalid Slack webhook URL.");
  }
  return encryptSecret(url, env.SLACK_WEBHOOK_ENCRYPTION_KEY);
}

function decryptSlackWebhookUrl(encrypted: string): string {
  const env = getOptionalServerEnv();
  if (!env.SLACK_WEBHOOK_ENCRYPTION_KEY) {
    throw new Error("SLACK_WEBHOOK_ENCRYPTION_KEY is not configured.");
  }
  return decryptSecret(encrypted, env.SLACK_WEBHOOK_ENCRYPTION_KEY);
}

export type SlackBlockPayload = {
  text: string;
  blocks?: unknown[];
};

/**
 * Post a Slack webhook message. Decrypts just-in-time; never returns the URL.
 */
export async function sendSlackWebhook(input: {
  encryptedWebhookUrl: string;
  payload: SlackBlockPayload;
}): Promise<SlackSendResult> {
  const env = getOptionalServerEnv();

  if (!isNotificationsEnabled(env)) {
    return { status: "suppressed", reason: "notifications_disabled" };
  }

  let webhookUrl: string;
  try {
    webhookUrl = decryptSlackWebhookUrl(input.encryptedWebhookUrl);
  } catch {
    return {
      status: "failed",
      retryable: false,
      code: "slack_decrypt_failed",
      safeMessage: "Slack webhook could not be decrypted.",
    };
  }

  if (!isValidSlackWebhookUrl(webhookUrl)) {
    return {
      status: "failed",
      retryable: false,
      code: "slack_invalid_webhook",
      safeMessage: "Slack webhook URL is invalid.",
    };
  }

  const started = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    assertAllowedRuntimeFetchUrl(webhookUrl);
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input.payload),
      signal: controller.signal,
      redirect: "manual",
    });

    const durationMs = Date.now() - started;

    if (response.ok) {
      logger.info("Slack webhook delivered", {
        event: "notifications.slack.sent",
        provider: "slack",
        status: "sent",
        duration_ms: durationMs,
      });
      return { status: "sent" };
    }

    if (response.status === 429) {
      const retryAfter = Number(response.headers.get("retry-after") ?? "60");
      return {
        status: "failed",
        retryable: true,
        code: "slack_rate_limited",
        safeMessage: "Slack rate limited the request.",
        retryAfterSeconds: Number.isFinite(retryAfter) ? retryAfter : 60,
      };
    }

    // Slack returns 404 for revoked/invalid webhooks.
    if (response.status === 404 || response.status === 410) {
      logger.warn("Slack webhook revoked or missing", {
        event: "notifications.slack.revoked",
        provider: "slack",
        failure_code: "slack_webhook_revoked",
        duration_ms: durationMs,
      });
      return {
        status: "failed",
        retryable: false,
        code: "slack_webhook_revoked",
        safeMessage: "Slack webhook is no longer valid.",
      };
    }

    if (response.status >= 500) {
      return {
        status: "failed",
        retryable: true,
        code: "slack_temporary_error",
        safeMessage: "Slack temporarily unavailable.",
      };
    }

    return {
      status: "failed",
      retryable: false,
      code: "slack_permanent_error",
      safeMessage: "Slack rejected the message.",
    };
  } catch (error) {
    const aborted =
      error instanceof Error && error.name === "AbortError";
    logger.warn("Slack webhook network failure", {
      event: "notifications.slack.network_failed",
      provider: "slack",
      failure_code: aborted ? "slack_timeout" : "slack_network_error",
      duration_ms: Date.now() - started,
    });
    return {
      status: "failed",
      retryable: true,
      code: aborted ? "slack_timeout" : "slack_network_error",
      safeMessage: aborted
        ? "Slack request timed out."
        : "Slack network error.",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function markSlackNeedsAttention(input: {
  workspaceId: string;
  failureCode: string;
}): Promise<void> {
  const admin = createAdminSupabaseClient();
  await admin
    .from("notification_preferences")
    .update({
      slack_status: "needs_attention",
      slack_last_failure_at: new Date().toISOString(),
      slack_last_failure_code: input.failureCode,
    })
    .eq("workspace_id", input.workspaceId);
}

export async function markSlackSuccess(input: {
  workspaceId: string;
  tested?: boolean;
}): Promise<void> {
  const admin = createAdminSupabaseClient();
  const now = new Date().toISOString();
  await admin
    .from("notification_preferences")
    .update({
      slack_status: "connected",
      slack_last_success_at: now,
      slack_last_failure_at: null,
      slack_last_failure_code: null,
      ...(input.tested ? { slack_last_tested_at: now } : {}),
    })
    .eq("workspace_id", input.workspaceId);
}

export function buildSlackTestPayload(): SlackBlockPayload {
  return {
    text: "Cited test message. Slack alerts are connected for this workspace.",
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "Cited test message", emoji: false },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "Slack alerts are connected for this workspace.",
        },
      },
    ],
  };
}

export function isSlackEncryptionConfigured(): boolean {
  return Boolean(getOptionalServerEnv().SLACK_WEBHOOK_ENCRYPTION_KEY);
}
