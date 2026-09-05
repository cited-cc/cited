import { NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/db/admin";
import {
  getNotificationsCronSecret,
  getOptionalServerEnv,
  isNotificationsEnabled,
} from "@/lib/env";
import { requireCronAuthorization } from "@/lib/security/cron";
import { logger } from "@/lib/security/logger";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const env = getOptionalServerEnv();
  const secret = getNotificationsCronSecret(env);
  const authHeader = request.headers.get("authorization");

  if (!requireCronAuthorization(authHeader, secret)) {
    logger.warn("Notification health unauthorized", {
      event: "notifications.health.unauthorized",
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminSupabaseClient();
  const now = Date.now();
  const dayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();

  const { count: pendingOutboxCount } = await admin
    .from("notification_outbox")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  const { count: failedOutboxCountRecent } = await admin
    .from("notification_outbox")
    .select("id", { count: "exact", head: true })
    .eq("status", "failed")
    .gte("updated_at", dayAgo);

  const { data: oldestPending } = await admin
    .from("notification_outbox")
    .select("available_at, created_at")
    .eq("status", "pending")
    .order("available_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const { count: deliveriesFailedRecent } = await admin
    .from("notification_deliveries")
    .select("id", { count: "exact", head: true })
    .eq("status", "failed")
    .gte("created_at", dayAgo);

  const { count: digestRunsRecent } = await admin
    .from("notification_digest_runs")
    .select("id", { count: "exact", head: true })
    .gte("created_at", dayAgo);

  let oldestPendingAgeSeconds: number | null = null;
  if (oldestPending?.available_at) {
    oldestPendingAgeSeconds = Math.max(
      0,
      Math.floor(
        (now - new Date(oldestPending.available_at as string).getTime()) /
          1000,
      ),
    );
  }

  return NextResponse.json({
    ok: true,
    notifications_enabled: isNotificationsEnabled(env),
    resend_configured: Boolean(env.RESEND_API_KEY && env.RESEND_FROM_EMAIL),
    pending_outbox_count: pendingOutboxCount ?? 0,
    failed_outbox_count_recent: failedOutboxCountRecent ?? 0,
    oldest_pending_age_seconds: oldestPendingAgeSeconds,
    deliveries_failed_recent: deliveriesFailedRecent ?? 0,
    digest_runs_recent: digestRunsRecent ?? 0,
  });
}
