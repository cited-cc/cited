import type { DeploymentMode } from "@/lib/deployment/types";
import type {
  BackgroundJobDefinition,
  JobExecutionContext,
  JobExecutionResult,
} from "@/lib/jobs/types";
import { defineJobSchedule } from "@/lib/jobs/schedule";
import { runMonitoringDispatcher } from "@/lib/monitoring/dispatcher";

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

export const monitoringDispatchJob: BackgroundJobDefinition = Object.freeze({
  id: "monitoring.dispatch",
  deploymentModes: ["cloud", "self_hosted"] as readonly DeploymentMode[],
  defaultSchedule: defineJobSchedule("*/5 * * * *"),
  timeoutMs: 300_000,
  run(context: JobExecutionContext) {
    return run(context, async () => {
      const summary = await runMonitoringDispatcher();
      return { ...summary };
    });
  },
});
