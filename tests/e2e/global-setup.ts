import { readFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();

export default async function globalSetup() {
  if (process.env.CITED_E2E_ENABLED !== "true") {
    return;
  }

  // Database migration, worker, and server boot happen in scripts/e2e/prepare-and-start.mjs.
  process.env.TZ = "UTC";
}

export async function stopWorkerFromPidFile(): Promise<void> {
  const pidFile = join(repoRoot, ".cited", "e2e", "worker.pid");
  try {
    const pid = Number.parseInt(readFileSync(pidFile, "utf8").trim(), 10);
    if (Number.isFinite(pid) && pid > 0) {
      process.kill(pid, "SIGTERM");
    }
  } catch {
    // Worker may already be stopped.
  }
}

export type E2EState = {
  bootstrapToken: string;
  ownerEmail: string;
  ownerPassword: string;
  workspaceName: string;
};

export function readE2EState(): E2EState {
  return JSON.parse(
    readFileSync(join(repoRoot, ".cited", "e2e", "state.json"), "utf8"),
  ) as E2EState;
}
