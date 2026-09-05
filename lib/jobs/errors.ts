import type { BackgroundJobId } from "@/lib/jobs/types";

export class JobNotAvailableError extends Error {
  readonly jobId: BackgroundJobId;
  readonly deploymentMode: string;

  constructor(jobId: BackgroundJobId, deploymentMode: string) {
    super(`Background job "${jobId}" is not available in ${deploymentMode} mode.`);
    this.name = "JobNotAvailableError";
    this.jobId = jobId;
    this.deploymentMode = deploymentMode;
  }
}

export class JobTimeoutError extends Error {
  readonly jobId: BackgroundJobId;
  readonly timeoutMs: number;

  constructor(jobId: BackgroundJobId, timeoutMs: number) {
    super(`Background job "${jobId}" exceeded the ${timeoutMs}ms timeout.`);
    this.name = "JobTimeoutError";
    this.jobId = jobId;
    this.timeoutMs = timeoutMs;
  }
}

export class JobExecutionError extends Error {
  readonly jobId: BackgroundJobId;
  readonly cause?: unknown;

  constructor(jobId: BackgroundJobId, message: string, cause?: unknown) {
    super(message);
    this.name = "JobExecutionError";
    this.jobId = jobId;
    this.cause = cause;
  }
}
