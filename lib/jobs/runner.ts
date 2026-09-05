import { getDeploymentMode } from "@/lib/deployment/mode";
import { createJobExecutionContext } from "@/lib/jobs/context";
import {
  JobExecutionError,
  JobNotAvailableError,
  JobTimeoutError,
} from "@/lib/jobs/errors";
import { getRegisteredJob, isJobAvailableForMode } from "@/lib/jobs/registry";
import type {
  BackgroundJobId,
  JobExecutionContext,
  JobExecutionResult,
  JobInvocationTransport,
} from "@/lib/jobs/types";
import { logger } from "@/lib/security/logger";

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  jobId: BackgroundJobId,
  signal?: AbortSignal,
): Promise<T> {
  if (signal?.aborted) {
    return Promise.reject(new JobExecutionError(jobId, "Job aborted before start."));
  }

  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new JobTimeoutError(jobId, timeoutMs));
    }, timeoutMs);

    const onAbort = () => {
      clearTimeout(timer);
      reject(new JobExecutionError(jobId, "Job aborted."));
    };

    signal?.addEventListener("abort", onAbort, { once: true });

    promise
      .then((value) => {
        clearTimeout(timer);
        signal?.removeEventListener("abort", onAbort);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        signal?.removeEventListener("abort", onAbort);
        reject(error);
      });
  });
}

export async function runBackgroundJob(input: {
  jobId: BackgroundJobId;
  transport: JobInvocationTransport;
  context?: Partial<JobExecutionContext>;
  signal?: AbortSignal;
}): Promise<JobExecutionResult> {
  const mode = getDeploymentMode();
  if (!isJobAvailableForMode(input.jobId, mode)) {
    throw new JobNotAvailableError(input.jobId, mode);
  }

  const registered = getRegisteredJob(input.jobId);
  const context = createJobExecutionContext({
    jobId: input.jobId,
    transport: input.transport,
    signal: input.signal,
    workerId: input.context?.workerId,
    startedAt: input.context?.startedAt,
  });

  logger.info("Background job started", {
    event: "jobs.run.started",
    jobId: input.jobId,
    transport: input.transport,
    workerId: context.workerId,
  });

  try {
    const result = await withTimeout(
      registered.definition.run(context),
      registered.definition.timeoutMs,
      input.jobId,
      input.signal,
    );

    logger.info("Background job completed", {
      event: "jobs.run.completed",
      jobId: input.jobId,
      transport: input.transport,
      workerId: context.workerId,
      durationMs: result.durationMs,
      ok: result.ok,
    });

    return result;
  } catch (error) {
    logger.error("Background job failed", {
      event: "jobs.run.failed",
      jobId: input.jobId,
      transport: input.transport,
      workerId: context.workerId,
      errorCategory:
        error instanceof JobTimeoutError
          ? "timeout"
          : error instanceof JobNotAvailableError
            ? "not_available"
            : "execution_error",
    });

    if (
      error instanceof JobNotAvailableError ||
      error instanceof JobTimeoutError ||
      error instanceof JobExecutionError
    ) {
      throw error;
    }

    throw new JobExecutionError(
      input.jobId,
      "Background job execution failed.",
      error,
    );
  }
}
