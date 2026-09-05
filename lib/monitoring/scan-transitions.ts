import { createAdminSupabaseClient } from "@/lib/db/admin";
import type { ScanRunStatus } from "@/types/product";
import {
  assertScanTransition,
  dbStatusForPhase,
  resolveScanPhase,
  type ScanPhase,
  type ScanTransitionReason,
} from "@/lib/monitoring/state-machine";
import type { Tables } from "@/lib/db/types";

type ScanRun = Tables<"scan_runs">;

export type TransitionScanRunInput = {
  scanRun: ScanRun;
  toPhase: ScanPhase;
  reason: ScanTransitionReason;
  expectedStatus?: ScanRunStatus;
  patch?: Record<string, unknown>;
};

export type TransitionScanRunResult =
  | { ok: true; row: ScanRun }
  | { ok: false; reason: "conflict" | "illegal_transition" };

/**
 * Conditional scan phase transition. Uses expected status for optimistic concurrency.
 */
export async function transitionScanRun(
  input: TransitionScanRunInput,
): Promise<TransitionScanRunResult> {
  const fromPhase = resolveScanPhase({
    status: input.scanRun.status,
    phase: input.scanRun.phase as string | null,
    completedAt: input.scanRun.completed_at,
    nextAttemptAt: input.scanRun.next_attempt_at,
    nextPollAt: input.scanRun.next_poll_at,
    providerTaskId: input.scanRun.provider_task_id,
    claimedBy: input.scanRun.claimed_by,
    leaseExpiresAt: input.scanRun.lease_expires_at,
    attemptCount: input.scanRun.attempt_count,
  });

  try {
    assertScanTransition(fromPhase, input.toPhase);
  } catch {
    return { ok: false, reason: "illegal_transition" };
  }

  const admin = createAdminSupabaseClient();
  const nowIso = new Date().toISOString();
  const dbStatus = dbStatusForPhase(input.toPhase);

  let query = admin
    .from("scan_runs")
    .update({
      status: dbStatus,
      phase: input.toPhase,
      last_transition_at: nowIso,
      last_transition_reason: input.reason,
      ...input.patch,
    })
    .eq("id", input.scanRun.id as string)
    .eq("workspace_id", input.scanRun.workspace_id as string);

  const expectedStatus =
    input.expectedStatus ?? (input.scanRun.status as ScanRunStatus);
  query = query.eq("status", expectedStatus);

  const { data, error } = await query.select("*").maybeSingle();

  if (error || !data) {
    return { ok: false, reason: "conflict" };
  }

  return { ok: true, row: data as ScanRun };
}

export function buildExternalRequestKey(input: {
  scanRunId: string;
  attemptCount: number;
}): string {
  return `cited:scan:${input.scanRunId}:attempt:${input.attemptCount}`;
}
