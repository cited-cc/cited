#!/usr/bin/env tsx
import { getDeploymentMode } from "@/lib/deployment/mode";
import {
  JobNotAvailableError,
  listJobIds,
  runBackgroundJob,
  type BackgroundJobId,
} from "@/lib/jobs";

function parseJobId(value: string | undefined): BackgroundJobId {
  const normalized = value?.trim();
  if (!normalized) {
    console.error("Usage: npm run jobs:run -- <job-id>");
    console.error("Available jobs:", listJobIds().join(", "));
    process.exit(1);
  }

  if (!(listJobIds() as readonly string[]).includes(normalized)) {
    console.error(`Unknown job id: ${normalized}`);
    console.error("Available jobs:", listJobIds().join(", "));
    process.exit(1);
  }

  return normalized as BackgroundJobId;
}

async function main(): Promise<void> {
  const jobId = parseJobId(process.argv[2]);
  const mode = getDeploymentMode();

  try {
    const result = await runBackgroundJob({
      jobId,
      transport: "cli",
    });
    console.log(
      JSON.stringify(
        {
          ok: result.ok,
          jobId,
          mode,
          durationMs: result.durationMs,
          summary: result.summary,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    if (error instanceof JobNotAvailableError) {
      console.error(
        `Job "${jobId}" is not available in ${mode} deployment mode.`,
      );
      process.exit(2);
    }
    console.error(error);
    process.exit(1);
  }
}

main();
