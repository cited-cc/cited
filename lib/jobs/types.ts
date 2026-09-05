import type { DeploymentMode } from "@/lib/deployment/types";

export const BACKGROUND_JOB_IDS = [
  "monitoring.dispatch",
  "notifications.dispatch",
  "notifications.digests",
] as const;

export type BackgroundJobId = (typeof BACKGROUND_JOB_IDS)[number];

export type JobInvocationTransport =
  | "vercel_cron"
  | "cli"
  | "worker";

export type JobSchedule = Readonly<{
  /** Vercel-compatible five-field cron expression. */
  cron: string;
  /** Portable worker tick interval derived from the cron expression. */
  intervalMs: number;
}>;

export type JobExecutionContext = Readonly<{
  jobId: BackgroundJobId;
  transport: JobInvocationTransport;
  startedAt: Date;
  workerId: string;
  signal?: AbortSignal;
}>;

export type JobExecutionResult = Readonly<{
  ok: boolean;
  summary: Record<string, unknown>;
  durationMs: number;
}>;

export interface BackgroundJobDefinition {
  id: BackgroundJobId;
  deploymentModes: readonly DeploymentMode[];
  defaultSchedule: JobSchedule;
  timeoutMs: number;
  run(context: JobExecutionContext): Promise<JobExecutionResult>;
}

export type RegisteredBackgroundJob = Readonly<{
  definition: BackgroundJobDefinition;
  /** Internal HTTP route path when invoked through Vercel Cron. */
  httpPath: string;
  /** Env resolver for cron bearer auth on HTTP routes. */
  cronSecretEnvKeys: readonly string[];
}>;
