import { createAdminSupabaseClient } from "@/lib/db/admin";
import { getOptionalServerEnv } from "@/lib/env";
import { logger } from "@/lib/security/logger";

export type OutboxRow = {
  id: string;
  workspace_id: string;
  event_type: string;
  notification_type: string | null;
  source_entity_type: string;
  source_entity_id: string;
  dedupe_key: string | null;
  status:
    | "pending"
    | "processing"
    | "delivered"
    | "partially_delivered"
    | "failed"
    | "canceled"
    | "suppressed";
  priority: string;
  payload: Record<string, unknown>;
  payload_summary: Record<string, unknown>;
  available_at: string;
  attempt_count: number;
  max_attempts: number;
  locked_at: string | null;
  lock_expires_at: string | null;
  next_attempt_at: string | null;
  delivered_at: string | null;
  failure_code: string | null;
  failure_message: string | null;
};

export async function releaseStaleOutboxLocks(): Promise<number> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.rpc(
    "release_stale_notification_outbox_locks",
  );
  if (!error) {
    return Number(data ?? 0);
  }

  const env = getOptionalServerEnv();
  const staleMinutes = env.NOTIFICATIONS_STALE_LOCK_MINUTES ?? 15;
  const cutoff = new Date(
    Date.now() - staleMinutes * 60 * 1000,
  ).toISOString();

  const { data: stale } = await admin
    .from("notification_outbox")
    .select("id")
    .eq("status", "processing")
    .lte("lock_expires_at", cutoff);

  let released = 0;
  for (const row of stale ?? []) {
    await admin
      .from("notification_outbox")
      .update({
        status: "pending",
        locked_at: null,
        lock_expires_at: null,
      })
      .eq("id", row.id as string)
      .eq("status", "processing");
    released += 1;
  }
  return released;
}

export async function claimNotificationOutbox(input: {
  limit: number;
  leaseSeconds?: number;
}): Promise<OutboxRow[]> {
  const admin = createAdminSupabaseClient();
  const env = getOptionalServerEnv();
  const leaseSeconds =
    input.leaseSeconds ??
    (env.NOTIFICATIONS_STALE_LOCK_MINUTES ?? 15) * 60;

  const { data, error } = await admin.rpc("claim_notification_outbox", {
    p_limit: input.limit,
    p_lease_seconds: leaseSeconds,
  });

  if (!error && Array.isArray(data)) {
    return data as OutboxRow[];
  }

  logger.warn("claim_notification_outbox RPC unavailable; using fallback", {
    event: "notifications.claim.fallback",
  });

  const now = new Date();
  const nowIso = now.toISOString();
  const { data: candidates } = await admin
    .from("notification_outbox")
    .select("*")
    .in("status", ["pending", "processing"])
    .order("available_at", { ascending: true })
    .limit(Math.min(input.limit * 3, 50));

  const claimed: OutboxRow[] = [];
  for (const row of (candidates ?? []) as OutboxRow[]) {
    if (claimed.length >= input.limit) break;

    const lockExpired =
      !row.lock_expires_at ||
      new Date(row.lock_expires_at).getTime() <= now.getTime();

    if (row.status === "processing" && !lockExpired) continue;

    const due =
      new Date(row.available_at).getTime() <= now.getTime() &&
      (!row.next_attempt_at ||
        new Date(row.next_attempt_at).getTime() <= now.getTime());

    if (row.status === "pending" && !due) continue;
    if (row.status === "processing" && !lockExpired) continue;

    const priorStatus = row.status;
    const { data: updated, error: updateError } = await admin
      .from("notification_outbox")
      .update({
        status: "processing",
        locked_at: nowIso,
        lock_expires_at: new Date(
          now.getTime() + leaseSeconds * 1000,
        ).toISOString(),
        last_attempt_at: nowIso,
        attempt_count: Number(row.attempt_count ?? 0) + 1,
      })
      .eq("id", row.id)
      .eq("status", priorStatus)
      .select("*")
      .maybeSingle();

    if (!updateError && updated) {
      claimed.push(updated as unknown as OutboxRow);
    }
  }

  return claimed;
}

/**
 * Bounded exponential backoff with jitter.
 */
export function computeNextAttemptAt(input: {
  attemptCount: number;
  retryAfterSeconds?: number;
}): Date {
  if (input.retryAfterSeconds && input.retryAfterSeconds > 0) {
    return new Date(Date.now() + input.retryAfterSeconds * 1000);
  }
  const baseSeconds = Math.min(
    60 * 60,
    Math.pow(2, Math.max(0, input.attemptCount - 1)) * 30,
  );
  const jitter = Math.floor(Math.random() * Math.min(30, baseSeconds * 0.2));
  return new Date(Date.now() + (baseSeconds + jitter) * 1000);
}
