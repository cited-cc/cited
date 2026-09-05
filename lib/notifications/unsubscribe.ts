import { createAdminSupabaseClient } from "@/lib/db/admin";
import { getOptionalServerEnv } from "@/lib/env";
import { buildAppAbsoluteUrl } from "@/lib/notifications/app-url";
import type { UnsubscribeScope } from "@/lib/notifications/types";
import {
  generateSecureToken,
  hashEmail,
  hashToken,
  timingSafeEqualHex,
} from "@/lib/security/encryption";
import { logger } from "@/lib/security/logger";

export type CreatedUnsubscribeToken = {
  rawToken: string;
  expiresAt: Date;
  unsubscribeUrl: string;
  manageUrl: string;
};

/**
 * Create a hashed unsubscribe token. Raw token is returned once for email links.
 */
export async function createUnsubscribeToken(input: {
  workspaceId: string;
  clerkUserId?: string | null;
  email: string;
  scope: UnsubscribeScope;
}): Promise<CreatedUnsubscribeToken> {
  const env = getOptionalServerEnv();
  const ttlDays = env.NOTIFICATION_UNSUBSCRIBE_TOKEN_TTL_DAYS ?? 90;
  const rawToken = generateSecureToken(32);
  const tokenHash = hashToken(rawToken);
  const emailHash = hashEmail(input.email);
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

  const admin = createAdminSupabaseClient();
  const { error } = await admin.from("notification_unsubscribe_tokens").insert({
    workspace_id: input.workspaceId,
    clerk_user_id: input.clerkUserId ?? null,
    email_hash: emailHash,
    token_hash: tokenHash,
    scope: input.scope,
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    logger.error("Failed to create unsubscribe token", {
      event: "notifications.unsubscribe.token_create_failed",
      workspaceId: input.workspaceId,
    });
    throw new Error("Failed to create unsubscribe token.");
  }

  return {
    rawToken,
    expiresAt,
    unsubscribeUrl: buildAppAbsoluteUrl(`/unsubscribe/${rawToken}`),
    manageUrl: buildAppAbsoluteUrl("/app/settings/notifications"),
  };
}

export type UnsubscribeLookupResult =
  | {
      ok: true;
      tokenId: string;
      workspaceId: string;
      clerkUserId: string | null;
      scope: UnsubscribeScope;
      emailHash: string;
      usedAt: string | null;
      expiresAt: string;
    }
  | { ok: false; reason: "invalid" | "expired" };

export async function lookupUnsubscribeToken(
  rawToken: string,
): Promise<UnsubscribeLookupResult> {
  if (!rawToken || rawToken.length < 16 || rawToken.length > 128) {
    return { ok: false, reason: "invalid" };
  }

  const tokenHash = hashToken(rawToken);
  const admin = createAdminSupabaseClient();
  const { data } = await admin
    .from("notification_unsubscribe_tokens")
    .select(
      "id, workspace_id, clerk_user_id, scope, email_hash, used_at, expires_at, token_hash",
    )
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (!data) {
    return { ok: false, reason: "invalid" };
  }

  // Timing-safe compare of stored hash (defense in depth).
  if (
    typeof data.token_hash === "string" &&
    !timingSafeEqualHex(data.token_hash, tokenHash)
  ) {
    return { ok: false, reason: "invalid" };
  }

  if (new Date(data.expires_at as string).getTime() <= Date.now()) {
    return { ok: false, reason: "expired" };
  }

  return {
    ok: true,
    tokenId: data.id as string,
    workspaceId: data.workspace_id as string,
    clerkUserId: (data.clerk_user_id as string | null) ?? null,
    scope: data.scope as UnsubscribeScope,
    emailHash: data.email_hash as string,
    usedAt: (data.used_at as string | null) ?? null,
    expiresAt: data.expires_at as string,
  };
}

/**
 * Apply unsubscribe scope. Does not change Slack settings.
 * Tokens are single-use: marked used_at on success.
 */
export async function applyUnsubscribe(input: {
  tokenId: string;
  workspaceId: string;
  clerkUserId: string | null;
  scope: UnsubscribeScope;
}): Promise<{ ok: true } | { ok: false }> {
  const admin = createAdminSupabaseClient();
  const now = new Date().toISOString();

  if (input.clerkUserId) {
    const updates: Record<string, unknown> = { updated_at: now };

    switch (input.scope) {
      case "all_email":
        updates.unsubscribed_all_at = now;
        updates.email_unsubscribed_at = now;
        updates.digest_unsubscribed_at = now;
        updates.product_tips_unsubscribed_at = now;
        updates.email_alerts_enabled = false;
        updates.weekly_digest_enabled = false;
        updates.monitor_issue_alerts_enabled = false;
        updates.product_tips_enabled = false;
        break;
      case "instant_alerts":
        updates.email_alerts_enabled = false;
        break;
      case "weekly_digest":
        updates.weekly_digest_enabled = false;
        updates.digest_unsubscribed_at = now;
        break;
      case "monitor_issues":
        updates.monitor_issue_alerts_enabled = false;
        break;
      case "free_scan_followup":
        // Free-scan recipients may not have a user prefs row; token mark is enough.
        break;
      case "product_tips":
        updates.product_tips_enabled = false;
        updates.product_tips_unsubscribed_at = now;
        break;
      default: {
        const _exhaustive: never = input.scope;
        void _exhaustive;
        return { ok: false };
      }
    }

    if (input.scope !== "free_scan_followup") {
      await admin.from("user_notification_preferences").upsert(
        {
          workspace_id: input.workspaceId,
          clerk_user_id: input.clerkUserId,
          ...updates,
        },
        { onConflict: "workspace_id,clerk_user_id" },
      );
    }
  }

  await admin
    .from("notification_unsubscribe_tokens")
    .update({ used_at: now })
    .eq("id", input.tokenId)
    .eq("workspace_id", input.workspaceId);

  logger.info("Unsubscribe applied", {
    event: "notifications.unsubscribe.applied",
    workspaceId: input.workspaceId,
    scope: input.scope,
  });

  return { ok: true };
}

export function unsubscribeScopeForNotificationType(
  type: string,
): UnsubscribeScope {
  if (type === "weekly_digest") return "weekly_digest";
  if (
    type === "monitor_blocked" ||
    type === "monitor_recovered" ||
    type === "monitor_repeated_failure" ||
    type === "usage_safety_limit_reached" ||
    type === "domain_verification_required"
  ) {
    return "monitor_issues";
  }
  if (type === "free_scan_result") return "free_scan_followup";
  if (
    type === "welcome_day_0" ||
    type === "welcome_day_2" ||
    type === "welcome_day_5" ||
    type === "welcome_day_10" ||
    type === "welcome_day_14" ||
    type === "learn_domains_day_21"
  ) {
    return "product_tips";
  }
  return "instant_alerts";
}
