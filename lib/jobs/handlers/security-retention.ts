import type { DeploymentMode } from "@/lib/deployment/types";
import type {
  BackgroundJobDefinition,
  JobExecutionContext,
  JobExecutionResult,
} from "@/lib/jobs/types";
import { defineJobSchedule } from "@/lib/jobs/schedule";
import { runRetentionCleanup } from "@/lib/security/retention";

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

export const securityRetentionJob: BackgroundJobDefinition = Object.freeze({
  id: "security.retention",
  deploymentModes: ["self_hosted"] as readonly DeploymentMode[],
  defaultSchedule: defineJobSchedule("0 4 * * *"),
  timeoutMs: 300_000,
  run(context: JobExecutionContext) {
    return run(context, async () => {
      const result = await runRetentionCleanup({ dryRun: false });
      return {
        dryRun: result.dryRun,
        scopeCount: result.results.length,
        deletedTotal: result.results.reduce((sum, row) => sum + row.deleted, 0),
      };
    });
  },
});
