import type { DeploymentMode } from "@/lib/deployment/types";
import type {
  BackgroundJobDefinition,
  JobExecutionContext,
  JobExecutionResult,
} from "@/lib/jobs/types";
import { defineJobSchedule } from "@/lib/jobs/schedule";
import { runDigestScheduler } from "@/lib/notifications/digest";

async function run(
  context: JobExecutionContext,
  execute: () => Promise<Record<string, unknown>>,
): Promise<JobExecutionResult> {
  const started = context.startedAt.getTime();
  const summary = await execute();
  return Object.freeze({
    ok: true,
    summary,
    durationMs: Date.now() - started,
  });
}

export const notificationsDigestsJob: BackgroundJobDefinition = Object.freeze({
  id: "notifications.digests",
  deploymentModes: ["cloud", "self_hosted"] as readonly DeploymentMode[],
  defaultSchedule: defineJobSchedule("0 * * * *"),
  timeoutMs: 120_000,
  run(context: JobExecutionContext) {
    return run(context, async () => {
      const summary = await runDigestScheduler({ batchSize: 50 });
      return { ...summary };
    });
  },
});
