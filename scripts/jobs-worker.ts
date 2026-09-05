#!/usr/bin/env tsx
import { writeFileSync } from "node:fs";

import { getDeploymentMode } from "@/lib/deployment/mode";
import { getOptionalServerEnv } from "@/lib/env";
import { listJobsForMode, runWorkerLoop } from "@/lib/jobs";

const HEARTBEAT_PATH =
  process.env.CITED_WORKER_HEARTBEAT_PATH ?? "/tmp/cited-worker-heartbeat";

function writeHeartbeat(): void {
  writeFileSync(HEARTBEAT_PATH, "alive\n", { encoding: "utf8", mode: 0o600 });
}

async function main(): Promise<void> {
  writeHeartbeat();
  const mode = getDeploymentMode();
  const env = getOptionalServerEnv();
  const tickMs = env.CITED_JOBS_WORKER_TICK_MS ?? 30_000;
  const jobs = listJobsForMode(mode);

  console.log("Cited portable job worker");
  console.log(`Deployment mode: ${mode}`);
  console.log(`Tick interval: ${tickMs}ms`);
  console.log(`Registered jobs: ${jobs.map((job) => job.definition.id).join(", ")}`);

  const controller = new AbortController();
  const shutdown = () => {
    console.log("\nStopping worker...");
    controller.abort();
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  await runWorkerLoop({
    tickMs,
    signal: controller.signal,
    onTick(summary) {
      writeHeartbeat();
      if (summary.jobsAttempted > 0) {
        console.log(
          `[tick ${summary.tick}] attempted=${summary.jobsAttempted} succeeded=${summary.jobsSucceeded} failed=${summary.jobsFailed} skipped=${summary.jobsSkipped}`,
        );
      }
    },
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
