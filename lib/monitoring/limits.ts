import { getOptionalServerEnv } from "@/lib/env";
import {
  MAX_POLL_ATTEMPTS_DEFAULT,
  MAX_SCAN_ATTEMPTS_DEFAULT,
  MAX_SUBMISSION_AMBIGUITY_ATTEMPTS,
} from "@/lib/monitoring/state-machine";

export type MonitoringOperationalLimits = {
  maxClaimBatch: number;
  maxConcurrentScansGlobal: number;
  maxConcurrentScansPerWorkspace: number;
  maxConcurrentTasksPerProvider: number;
  scanExecutionTimeoutMs: number;
  pollingDeadlineMs: number;
  maxScanAttempts: number;
  maxPollAttempts: number;
  maxSubmissionAmbiguityAttempts: number;
  backoffMinSeconds: number;
  backoffMaxSeconds: number;
  maxNormalizedResponseBytes: number;
  maxCitationsPerResponse: number;
  defaultLeaseSeconds: number;
};

const BACKOFF_MIN_SECONDS = 30;
const BACKOFF_MAX_SECONDS = 32 * 30 + 15;

export function resolveMonitoringOperationalLimits(): MonitoringOperationalLimits {
  const env = getOptionalServerEnv();
  const maxScanAttempts = env.MONITORING_MAX_ATTEMPTS ?? MAX_SCAN_ATTEMPTS_DEFAULT;
  const maxPollAttempts =
    env.MONITORING_MAX_POLL_ATTEMPTS ?? MAX_POLL_ATTEMPTS_DEFAULT;
  const providerTimeoutMs = env.MONITORING_PROVIDER_TIMEOUT_MS ?? 90_000;

  return {
    maxClaimBatch: env.MONITORING_PROCESS_BATCH_SIZE ?? 20,
    maxConcurrentScansGlobal: env.MONITORING_DISPATCH_BATCH_SIZE ?? 25,
    maxConcurrentScansPerWorkspace: 10,
    maxConcurrentTasksPerProvider: env.MONITORING_PROCESS_BATCH_SIZE ?? 20,
    scanExecutionTimeoutMs: env.INTERNAL_JOB_TIMEOUT_MS ?? 130_000,
    pollingDeadlineMs: maxPollAttempts * 15_000 + providerTimeoutMs,
    maxScanAttempts,
    maxPollAttempts,
    maxSubmissionAmbiguityAttempts: MAX_SUBMISSION_AMBIGUITY_ATTEMPTS,
    backoffMinSeconds: BACKOFF_MIN_SECONDS,
    backoffMaxSeconds: BACKOFF_MAX_SECONDS,
    maxNormalizedResponseBytes: env.MONITORING_MAX_RAW_PAYLOAD_BYTES ?? 524_288,
    maxCitationsPerResponse: 200,
    defaultLeaseSeconds: 300,
  };
}

export function validateOperationalLimits(
  limits: MonitoringOperationalLimits,
): string[] {
  const errors: string[] = [];
  if (limits.maxClaimBatch < 1 || limits.maxClaimBatch > 500) {
    errors.push("maxClaimBatch must be between 1 and 500.");
  }
  if (limits.maxScanAttempts < 1 || limits.maxScanAttempts > 20) {
    errors.push("maxScanAttempts must be between 1 and 20.");
  }
  if (limits.maxPollAttempts < 1 || limits.maxPollAttempts > 100) {
    errors.push("maxPollAttempts must be between 1 and 100.");
  }
  if (limits.backoffMinSeconds > limits.backoffMaxSeconds) {
    errors.push("backoffMinSeconds must not exceed backoffMaxSeconds.");
  }
  return errors;
}
