import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const repoRoot = process.cwd();

export default async function globalSetup() {
  if (process.env.CITED_E2E_ENABLED !== "true") {
    return;
  }

  process.env.TZ = "UTC";

  const databaseUrl =
    process.env.CITED_E2E_DATABASE_URL?.trim() ||
    process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error("CITED_E2E_DATABASE_URL or DATABASE_URL is required for E2E.");
  }

  process.env.DATABASE_URL = databaseUrl;
  process.env.DATABASE_MIGRATION_URL = databaseUrl;

  const authSecret = randomBytes(32).toString("hex");
  const bootstrapToken = randomBytes(24).toString("hex");
  const cronSecret = randomBytes(24).toString("hex");
  const slackKey = randomBytes(32).toString("hex");

  process.env.AUTH_SECRET = authSecret;
  process.env.CITED_BOOTSTRAP_TOKEN = bootstrapToken;
  process.env.MONITORING_CRON_SECRET = cronSecret;
  process.env.SLACK_WEBHOOK_ENCRYPTION_KEY = slackKey;
  process.env.NEXT_PUBLIC_APP_URL =
    process.env.CITED_E2E_BASE_URL ?? "http://127.0.0.1:3000";

  const stateDir = join(repoRoot, ".cited", "e2e");
  mkdirSync(stateDir, { recursive: true });
  writeFileSync(
    join(stateDir, "state.json"),
    JSON.stringify(
      {
        bootstrapToken,
        ownerEmail: "owner.e2e@example.com",
        ownerPassword: "e2e-owner-password-12",
        workspaceName: "E2E Workspace",
      },
      null,
      2,
    ),
    "utf8",
  );

  await runCommand("node", ["scripts/db-migrate.mjs"]);

  const worker = spawn("npm", ["run", "jobs:worker"], {
    cwd: repoRoot,
    env: {
      ...process.env,
      CITED_JOBS_WORKER_TICK_MS: "5000",
    },
    stdio: "ignore",
    detached: true,
  });

  process.env.CITED_E2E_WORKER_PID = String(worker.pid ?? "");
  writeFileSync(join(stateDir, "worker.pid"), `${worker.pid ?? ""}\n`, "utf8");
}

function runCommand(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      env: process.env,
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(" ")} exited with ${code}`));
      }
    });
  });
}

export async function stopWorkerFromPidFile(): Promise<void> {
  const pidFile = join(repoRoot, ".cited", "e2e", "worker.pid");
  try {
    const { readFileSync } = await import("node:fs");
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
