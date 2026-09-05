import { createAdminSupabaseClient } from "@/lib/db/admin";
import type { Tables } from "@/lib/db/types";
import { getOptionalServerEnv } from "@/lib/env";
import { logger } from "@/lib/security/logger";

export type ScanRunRow = Tables<"scan_runs">;

export async function releaseExpiredLeases(): Promise<number> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.rpc("release_expired_scan_run_leases");
  if (error) {
    // Fallback without RPC
    const now = new Date().toISOString();
    const { data: expired } = await admin
      .from("scan_runs")
      .select("id, next_poll_at, provider_task_id, status")
      .in("status", ["queued", "running"])
      .not("lease_expires_at", "is", null)
      .lte("lease_expires_at", now)
      .is("completed_at", null);

    let released = 0;
    for (const row of expired ?? []) {
      const keepRunning = Boolean(row.next_poll_at && row.provider_task_id);
      await admin
        .from("scan_runs")
        .update({
          claimed_at: null,
          claimed_by: null,
          lease_expires_at: null,
          status: keepRunning ? "running" : "queued",
          next_attempt_at: keepRunning ? row.next_poll_at : now,
        })
        .eq("id", row.id as string);
      released += 1;
    }
    return released;
  }
  return Number(data ?? 0);
}

export async function claimDueScanRuns(input: {
  limit: number;
  workerId: string;
  leaseSeconds?: number;
}): Promise<ScanRunRow[]> {
  const admin = createAdminSupabaseClient();
  const env = getOptionalServerEnv();
  const leaseSeconds = input.leaseSeconds ?? 300;

  const { data, error } = await admin.rpc("claim_due_scan_runs", {
    p_limit: input.limit,
    p_worker_id: input.workerId,
    p_lease_seconds: leaseSeconds,
  });

  if (!error && Array.isArray(data)) {
    return data as ScanRunRow[];
  }

  // Fallback claim without SKIP LOCKED (best-effort for local/dev).
  logger.warn("claim_due_scan_runs RPC unavailable; using fallback claim", {
    event: "monitoring.claim.fallback",
  });

  const now = new Date();
  const nowIso = now.toISOString();
  const { data: candidates } = await admin
    .from("scan_runs")
    .select("*")
    .in("status", ["queued", "running"])
    .is("completed_at", null)
    .order("scheduled_for", { ascending: true })
    .limit(Math.min(input.limit * 3, 50));

  const claimed: ScanRunRow[] = [];
  for (const row of candidates ?? []) {
    if (claimed.length >= input.limit) break;

    const leaseExpired =
      !row.lease_expires_at ||
      new Date(row.lease_expires_at as string).getTime() <= now.getTime();
    if (!leaseExpired) continue;

    const isQueuedDue =
      row.status === "queued" &&
      (!row.next_attempt_at ||
        new Date(row.next_attempt_at as string).getTime() <= now.getTime());
    const isPollDue =
      row.status === "running" &&
      row.next_poll_at &&
      new Date(row.next_poll_at as string).getTime() <= now.getTime();
    const isStaleRunning =
      row.status === "running" && !row.next_poll_at && leaseExpired;

    if (!isQueuedDue && !isPollDue && !isStaleRunning) continue;

    const { data: updated, error: updateError } = await admin
      .from("scan_runs")
      .update({
        status: "running",
        claimed_at: nowIso,
        claimed_by: input.workerId,
        lease_expires_at: new Date(
          now.getTime() + leaseSeconds * 1000,
        ).toISOString(),
        started_at: (row.started_at as string | null) ?? nowIso,
        attempt_count:
          row.status === "queued"
            ? Number(row.attempt_count ?? 0) + 1
            : Number(row.attempt_count ?? 0),
      })
      .eq("id", row.id as string)
      .eq("status", row.status as ScanRunRow["status"])
      .select("*")
      .maybeSingle();

    if (!updateError && updated) {
      claimed.push(updated as ScanRunRow);
    }
  }

  void env;
  return claimed;
}
