import type { ScanRunStatus } from "@/types/product";
import type { ProviderTaskStatus } from "@/lib/monitoring/provider-task-state";

/**
 * Logical scan phases mapped onto persisted scan_runs.status + auxiliary fields.
 * DB status remains the source of truth for queries; phase adds execution detail.
 */
export type ScanPhase =
  | "queued"
  | "claimed"
  | "submitting"
  | "provider_pending"
  | "processing"
  | "completed"
  | "retry_scheduled"
  | "failed"
  | "canceled";

export type ScanTransitionReason =
  | "created"
  | "claimed"
  | "lease_released"
  | "lease_recovered"
  | "provider_submitted"
  | "provider_pending"
  | "provider_completed"
  | "persist_started"
  | "persist_completed"
  | "retry_scheduled"
  | "max_attempts_exceeded"
  | "max_poll_attempts"
  | "permanent_failure"
  | "canceled"
  | "skipped_terminal"
  | "eligibility_failed"
  | "submission_ambiguous"
  | "legacy_unknown";

export type ScanRunSnapshot = {
  status: ScanRunStatus;
  phase?: string | null;
  completedAt?: string | null;
  nextAttemptAt?: string | null;
  nextPollAt?: string | null;
  providerTaskId?: string | null;
  claimedBy?: string | null;
  leaseExpiresAt?: string | null;
  attemptCount?: number;
};

export type ProviderTaskSnapshot = {
  status: ProviderTaskStatus;
  submissionState?: string | null;
};

export const SCAN_TERMINAL_PHASES: ReadonlySet<ScanPhase> = new Set([
  "completed",
  "failed",
  "canceled",
]);

export const SCAN_RETRYABLE_PHASES: ReadonlySet<ScanPhase> = new Set([
  "queued",
  "retry_scheduled",
  "claimed",
  "submitting",
  "provider_pending",
  "processing",
]);

export const SCAN_LEASE_OWNING_PHASES: ReadonlySet<ScanPhase> = new Set([
  "claimed",
  "submitting",
  "processing",
]);

export const MAX_SCAN_ATTEMPTS_DEFAULT = 4;
export const MAX_POLL_ATTEMPTS_DEFAULT = 12;
export const MAX_SUBMISSION_AMBIGUITY_ATTEMPTS = 3;

const SCAN_TRANSITIONS: Record<
  ScanPhase,
  ReadonlySet<ScanPhase>
> = {
  queued: new Set([
    "claimed",
    "canceled",
    "failed",
  ]),
  claimed: new Set([
    "submitting",
    "provider_pending",
    "processing",
    "completed",
    "retry_scheduled",
    "failed",
    "canceled",
    "queued",
  ]),
  submitting: new Set([
    "provider_pending",
    "processing",
    "completed",
    "retry_scheduled",
    "failed",
    "claimed",
  ]),
  provider_pending: new Set([
    "provider_pending",
    "processing",
    "completed",
    "retry_scheduled",
    "failed",
    "claimed",
  ]),
  processing: new Set([
    "completed",
    "retry_scheduled",
    "failed",
  ]),
  retry_scheduled: new Set([
    "queued",
    "failed",
    "canceled",
  ]),
  completed: new Set(),
  failed: new Set(),
  canceled: new Set(),
};

const LEGACY_PHASE_ALIASES: Record<string, ScanPhase> = {
  running: "claimed",
  partial: "completed",
};

export function resolveScanPhase(row: ScanRunSnapshot): ScanPhase {
  if (row.phase) {
    const normalized = row.phase as ScanPhase;
    if (normalized in SCAN_TRANSITIONS) {
      return normalized;
    }
    const legacy = LEGACY_PHASE_ALIASES[row.phase];
    if (legacy) return legacy;
  }

  if (row.status === "completed" || row.completedAt) {
    return "completed";
  }
  if (row.status === "failed") {
    return "failed";
  }
  if (row.status === "canceled") {
    return "canceled";
  }
  if (row.status === "queued") {
    if (
      row.nextAttemptAt &&
      row.attemptCount &&
      row.attemptCount > 0 &&
      new Date(row.nextAttemptAt).getTime() > Date.now()
    ) {
      return "retry_scheduled";
    }
    return "queued";
  }
  if (row.status === "running") {
    if (row.nextPollAt && row.providerTaskId) {
      return "provider_pending";
    }
    if (row.claimedBy && row.leaseExpiresAt) {
      return "claimed";
    }
    return "claimed";
  }
  if (row.status === "partial") {
    return "completed";
  }

  return "queued";
}

export function assertScanTransition(
  from: ScanPhase,
  to: ScanPhase,
): void {
  if (from === to) {
    return;
  }
  if (SCAN_TERMINAL_PHASES.has(from)) {
    throw new ScanStateTransitionError(
      `Illegal transition from terminal phase "${from}" to "${to}".`,
    );
  }
  const allowed = SCAN_TRANSITIONS[from];
  if (!allowed?.has(to)) {
    throw new ScanStateTransitionError(
      `Illegal transition from "${from}" to "${to}".`,
    );
  }
}

export function canClaimScanPhase(phase: ScanPhase): boolean {
  return (
    phase === "queued" ||
    phase === "retry_scheduled" ||
    phase === "provider_pending" ||
    phase === "claimed"
  );
}

export function isTerminalScanPhase(phase: ScanPhase): boolean {
  return SCAN_TERMINAL_PHASES.has(phase);
}

export class ScanStateTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScanStateTransitionError";
  }
}

/** Map logical phase to persisted scan_runs.status where applicable. */
export function dbStatusForPhase(phase: ScanPhase): ScanRunStatus {
  switch (phase) {
    case "queued":
    case "retry_scheduled":
      return "queued";
    case "claimed":
    case "submitting":
    case "provider_pending":
    case "processing":
      return "running";
    case "completed":
      return "completed";
    case "failed":
      return "failed";
    case "canceled":
      return "canceled";
    default: {
      const _exhaustive: never = phase;
      return _exhaustive;
    }
  }
}

export function allScanPhases(): ScanPhase[] {
  return Object.keys(SCAN_TRANSITIONS) as ScanPhase[];
}

export function transitionsFromPhase(phase: ScanPhase): ScanPhase[] {
  return [...(SCAN_TRANSITIONS[phase] ?? [])];
}
