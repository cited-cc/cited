import { monitoringDispatchJob } from "@/lib/jobs/handlers/monitoring-dispatch";
import { notificationsDigestsJob } from "@/lib/jobs/handlers/notifications-digests";
import { notificationsDispatchJob } from "@/lib/jobs/handlers/notifications-dispatch";
import { securityRetentionJob } from "@/lib/jobs/handlers/security-retention";
import type {
  BackgroundJobId,
  RegisteredBackgroundJob,
} from "@/lib/jobs/types";

const JOB_REGISTRY: Record<BackgroundJobId, RegisteredBackgroundJob> =
  Object.freeze({
    "monitoring.dispatch": Object.freeze({
      definition: monitoringDispatchJob,
      httpPath: "/api/internal/monitoring/dispatch",
      cronSecretEnvKeys: Object.freeze([
        "MONITORING_CRON_SECRET",
        "CRON_SECRET",
      ]),
    }),
    "notifications.dispatch": Object.freeze({
      definition: notificationsDispatchJob,
      httpPath: "/api/internal/notifications/dispatch",
      cronSecretEnvKeys: Object.freeze([
        "NOTIFICATIONS_CRON_SECRET",
        "MONITORING_CRON_SECRET",
        "CRON_SECRET",
      ]),
    }),
    "notifications.digests": Object.freeze({
      definition: notificationsDigestsJob,
      httpPath: "/api/internal/notifications/digests",
      cronSecretEnvKeys: Object.freeze([
        "NOTIFICATIONS_CRON_SECRET",
        "MONITORING_CRON_SECRET",
        "CRON_SECRET",
      ]),
    }),
    "security.retention": Object.freeze({
      definition: securityRetentionJob,
      httpPath: "/api/internal/security/retention",
      cronSecretEnvKeys: Object.freeze([
        "MONITORING_CRON_SECRET",
        "CRON_SECRET",
      ]),
    }),
  });

export function getRegisteredJob(
  jobId: BackgroundJobId,
): RegisteredBackgroundJob {
  return JOB_REGISTRY[jobId];
}

export function listRegisteredJobs(): readonly RegisteredBackgroundJob[] {
  return Object.freeze(Object.values(JOB_REGISTRY));
}

export function listJobIds(): readonly BackgroundJobId[] {
  return Object.freeze(Object.keys(JOB_REGISTRY) as BackgroundJobId[]);
}

export function isJobAvailableForMode(
  jobId: BackgroundJobId,
  mode: "cloud" | "self_hosted",
): boolean {
  const job = JOB_REGISTRY[jobId];
  return job.definition.deploymentModes.includes(mode);
}

export function listJobsForMode(
  mode: "cloud" | "self_hosted",
): readonly RegisteredBackgroundJob[] {
  return Object.freeze(
    listRegisteredJobs().filter((job) =>
      job.definition.deploymentModes.includes(mode),
    ),
  );
}
