import "server-only";

import { createAdminSupabaseClient } from "@/lib/db/admin";
import { getOptionalServerEnv } from "@/lib/env";
import { logger } from "@/lib/security/logger";

export type RetentionScope =
  | "expired_invitations"
  | "stale_rate_limit_buckets"
  | "failed_notification_history";

export type RetentionRunOptions = Readonly<{
  dryRun?: boolean;
  scopes?: readonly RetentionScope[];
}>;

export type RetentionScopeResult = Readonly<{
  scope: RetentionScope;
  eligible: number;
  deleted: number;
  dryRun: boolean;
}>;

export type RetentionRunResult = Readonly<{
  ok: boolean;
  dryRun: boolean;
  results: readonly RetentionScopeResult[];
  durationMs: number;
}>;

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

async function countAndDelete(
  scope: RetentionScope,
  dryRun: boolean,
  countQuery: () => Promise<number>,
  deleteQuery: () => Promise<void>,
): Promise<RetentionScopeResult> {
  const eligible = await countQuery();
  if (dryRun || eligible === 0) {
    return { scope, eligible, deleted: 0, dryRun };
  }
  await deleteQuery();
  return { scope, eligible, deleted: eligible, dryRun };
}

async function purgeExpiredInvitations(
  dryRun: boolean,
  retentionDays: number,
): Promise<RetentionScopeResult> {
  const admin = createAdminSupabaseClient();
  const cutoff = daysAgoIso(retentionDays);

  return countAndDelete(
    "expired_invitations",
    dryRun,
    async () => {
      const { count, error } = await admin
        .from("workspace_invitations")
        .select("id", { count: "exact", head: true })
        .lt("expires_at", cutoff);
      if (error) throw new Error("Failed to count expired invitations.");
      return count ?? 0;
    },
    async () => {
      const { error } = await admin
        .from("workspace_invitations")
        .delete()
        .lt("expires_at", cutoff);
      if (error) throw new Error("Failed to delete expired invitations.");
    },
  );
}

async function purgeStaleRateLimitBuckets(
  dryRun: boolean,
  retentionDays: number,
): Promise<RetentionScopeResult> {
  const admin = createAdminSupabaseClient();
  const cutoff = daysAgoIso(retentionDays);

  return countAndDelete(
    "stale_rate_limit_buckets",
    dryRun,
    async () => {
      const { count, error } = await admin
        .from("rate_limit_buckets")
        .select("bucket_key", { count: "exact", head: true })
        .lt("updated_at", cutoff);
      if (error) throw new Error("Failed to count stale rate limit buckets.");
      return count ?? 0;
    },
    async () => {
      const { error } = await admin
        .from("rate_limit_buckets")
        .delete()
        .lt("updated_at", cutoff);
      if (error) throw new Error("Failed to delete stale rate limit buckets.");
    },
  );
}

async function purgeFailedNotificationHistory(
  dryRun: boolean,
  retentionDays: number,
): Promise<RetentionScopeResult> {
  const admin = createAdminSupabaseClient();
  const cutoff = daysAgoIso(retentionDays);

  try {
    return await countAndDelete(
      "failed_notification_history",
      dryRun,
      async () => {
        const { count, error } = await admin
          .from("notification_delivery_log")
          .select("id", { count: "exact", head: true })
          .eq("status", "failed")
          .lt("created_at", cutoff);
        if (error) return 0;
        return count ?? 0;
      },
      async () => {
        const { error } = await admin
          .from("notification_delivery_log")
          .delete()
          .eq("status", "failed")
          .lt("created_at", cutoff);
        if (error) throw new Error("Failed to delete failed notification history.");
      },
    );
  } catch {
    return {
      scope: "failed_notification_history",
      eligible: 0,
      deleted: 0,
      dryRun,
    };
  }
}

/**
 * Run configured retention cleanup. Conservative defaults: only rate-limit
 * bucket cleanup enabled by default (7 days). Other scopes require explicit
 * positive day counts via environment configuration.
 */
export async function runRetentionCleanup(
  options: RetentionRunOptions = {},
): Promise<RetentionRunResult> {
  const started = Date.now();
  const env = getOptionalServerEnv();
  const dryRun = options.dryRun ?? env.CITED_RETENTION_DRY_RUN ?? false;
  const requestedScopes = options.scopes;
  const results: RetentionScopeResult[] = [];

  const scopes: RetentionScope[] =
    requestedScopes && requestedScopes.length > 0
      ? [...requestedScopes]
      : [
          "stale_rate_limit_buckets",
          "expired_invitations",
          "failed_notification_history",
        ];

  for (const scope of scopes) {
    switch (scope) {
      case "expired_invitations": {
        const days = env.CITED_RETENTION_EXPIRED_INVITATIONS_DAYS ?? 0;
        if (days > 0) {
          results.push(await purgeExpiredInvitations(dryRun, days));
        }
        break;
      }
      case "stale_rate_limit_buckets": {
        const days = env.CITED_RETENTION_RATE_LIMIT_BUCKETS_DAYS ?? 7;
        if (days > 0) {
          results.push(await purgeStaleRateLimitBuckets(dryRun, days));
        }
        break;
      }
      case "failed_notification_history": {
        const days = env.CITED_RETENTION_FAILED_NOTIFICATIONS_DAYS ?? 0;
        if (days > 0) {
          results.push(await purgeFailedNotificationHistory(dryRun, days));
        }
        break;
      }
      default: {
        const _exhaustive: never = scope;
        void _exhaustive;
      }
    }
  }

  logger.info("Retention cleanup completed", {
    event: "security.retention.completed",
    dryRun,
    scopeCount: results.length,
    durationMs: Date.now() - started,
  });

  return Object.freeze({
    ok: true,
    dryRun,
    results: Object.freeze(results),
    durationMs: Date.now() - started,
  });
}
