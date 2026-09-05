import { randomUUID } from "node:crypto";

import type {
  BackgroundJobId,
  JobExecutionContext,
  JobInvocationTransport,
} from "@/lib/jobs/types";

export function createJobExecutionContext(input: {
  jobId: BackgroundJobId;
  transport: JobInvocationTransport;
  signal?: AbortSignal;
  workerId?: string;
  startedAt?: Date;
}): JobExecutionContext {
  return Object.freeze({
    jobId: input.jobId,
    transport: input.transport,
    startedAt: input.startedAt ?? new Date(),
    workerId: input.workerId ?? randomUUID(),
    signal: input.signal,
  });
}
