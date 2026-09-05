import type { ScanRunStatus } from "@/types/product";
import { resolveScanPhase } from "@/lib/monitoring/state-machine";

export type ScanDisplayStatus =
  | "queued"
  | "running"
  | "retrying"
  | "completed"
  | "partial"
  | "failed"
  | "canceled"
  | "paused";

export type ScanDisplayInput = {
  status: ScanRunStatus;
  phase?: string | null;
  completedAt?: string | null;
  nextAttemptAt?: string | null;
  nextPollAt?: string | null;
  providerTaskId?: string | null;
  claimedBy?: string | null;
  leaseExpiresAt?: string | null;
  attemptCount?: number;
  failureCode?: string | null;
  isMockProvider?: boolean;
};

export function resolveScanDisplayStatus(
  input: ScanDisplayInput,
): ScanDisplayStatus {
  const phase = resolveScanPhase({
    status: input.status,
    phase: input.phase,
    completedAt: input.completedAt,
    nextAttemptAt: input.nextAttemptAt,
    nextPollAt: input.nextPollAt,
    providerTaskId: input.providerTaskId,
    claimedBy: input.claimedBy,
    leaseExpiresAt: input.leaseExpiresAt,
    attemptCount: input.attemptCount,
  });

  switch (phase) {
    case "retry_scheduled":
      return "retrying";
    case "provider_pending":
    case "submitting":
    case "processing":
    case "claimed":
      return "running";
    case "completed":
      return input.status === "partial" ? "partial" : "completed";
    case "failed":
      return "failed";
    case "canceled":
      return "canceled";
    case "queued":
    default:
      return "queued";
  }
}

export function scanDisplayStatusLabel(status: ScanDisplayStatus): string {
  switch (status) {
    case "queued":
      return "Queued";
    case "running":
      return "Scanning";
    case "retrying":
      return "Retry scheduled";
    case "completed":
      return "Completed";
    case "partial":
      return "Partial";
    case "failed":
      return "Failed";
    case "canceled":
      return "Canceled";
    case "paused":
      return "Paused";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function scanFailureGuidance(failureCode: string | null | undefined): string | null {
  if (!failureCode) return null;
  switch (failureCode) {
    case "domain_unverified":
      return "Verify your domain to resume monitoring.";
    case "unsupported_surface":
      return "This AI surface is not enabled for your plan or environment.";
    case "provider_validation_error":
      return "Check monitor locale and surface settings.";
    case "billing_inactive":
      return "Billing must be active to run paid monitoring.";
    case "usage_limit_reached":
      return "Usage safety limit reached for this billing period.";
    case "provider_rate_limited":
    case "provider_timeout":
    case "provider_unavailable":
      return "Provider issue. Cited will retry automatically.";
    case "max_poll_attempts":
    case "max_attempts_exceeded":
      return "Cited stopped retrying after repeated failures.";
    default:
      return "Review monitor settings or try again later.";
  }
}
