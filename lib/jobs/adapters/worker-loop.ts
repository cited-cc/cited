import { randomUUID } from "node:crypto";

import { getDeploymentMode } from "@/lib/deployment/mode";
import { getOptionalServerEnv } from "@/lib/env";
import { isJobDue } from "@/lib/jobs/schedule";
import { listJobsForMode } from "@/lib/jobs/registry";
import { runBackgroundJob } from "@/lib/jobs/runner";
import type { BackgroundJobId } from "@/lib/jobs/types";
import { JobNotAvailableError } from "@/lib/jobs/errors";
import { logger } from "@/lib/security/logger";

export type WorkerLoopSummary = Readonly<{
  tick: number;
  workerId: string;
  jobsAttempted: number;
  jobsSucceeded: number;
  jobsFailed: number;
  jobsSkipped: number;
}>;

export type WorkerLoopOptions = Readonly<{
  tickMs?: number;
  signal?: AbortSignal;
  onTick?: (summary: WorkerLoopSummary) => void;
}>;

export async function runWorkerLoop(
  options: WorkerLoopOptions = {},
): Promise<void> {
  const env = getOptionalServerEnv();
  const tickMs = options.tickMs ?? env.CITED_JOBS_WORKER_TICK_MS ?? 30_000;
  const workerId = randomUUID();
  const mode = getDeploymentMode();
  const jobs = listJobsForMode(mode);
  const lastRunAt = new Map<BackgroundJobId, Date>();
  let tick = 0;

  logger.info("Portable job worker started", {
    event: "jobs.worker.started",
    workerId,
    mode,
    tickMs,
    jobCount: jobs.length,
  });

  while (!options.signal?.aborted) {
    tick += 1;
    const now = new Date();
    let jobsAttempted = 0;
    let jobsSucceeded = 0;
    let jobsFailed = 0;
    let jobsSkipped = 0;

    for (const registered of jobs) {
      const jobId = registered.definition.id;
      const previousRun = lastRunAt.get(jobId) ?? null;

      if (!isJobDue(registered.definition.defaultSchedule, previousRun, now)) {
        jobsSkipped += 1;
        continue;
      }

      jobsAttempted += 1;
      try {
        await runBackgroundJob({
          jobId,
          transport: "worker",
          context: { workerId, startedAt: now },
          signal: options.signal,
        });
        lastRunAt.set(jobId, now);
        jobsSucceeded += 1;
      } catch (error) {
        if (error instanceof JobNotAvailableError) {
          jobsSkipped += 1;
          continue;
        }
        jobsFailed += 1;
        logger.warn("Portable worker job failed", {
          event: "jobs.worker.job_failed",
          workerId,
          jobId,
        });
      }
    }

    const summary: WorkerLoopSummary = Object.freeze({
      tick,
      workerId,
      jobsAttempted,
      jobsSucceeded,
      jobsFailed,
      jobsSkipped,
    });
    options.onTick?.(summary);

    await sleep(tickMs, options.signal);
  }

  logger.info("Portable job worker stopped", {
    event: "jobs.worker.stopped",
    workerId,
    tick,
  });
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    const onAbort = () => {
      clearTimeout(timer);
      resolve();
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}
