#!/usr/bin/env node
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { spawnSync } from "node:child_process";

import { assertDockerAvailable, runCompose, waitForWebHealth } from "./lib.mjs";

async function main() {
  assertDockerAvailable();

  const skipBackupCheck = process.argv.includes("--skip-backup-check");
  if (!skipBackupCheck && process.stdin.isTTY) {
    const rl = createInterface({ input, output });
    const answer = await rl.question(
      "Create a backup before upgrade? [Y/n]: ",
    );
    await rl.close();
    if (answer.trim().toLowerCase() !== "n") {
      const backup = spawnSync("node", ["scripts/self-host/backup.mjs"], {
        stdio: "inherit",
      });
      if (backup.status !== 0) {
        const confirm = createInterface({ input, output });
        const proceed = await confirm.question(
          "Backup failed. Type UPGRADE to continue anyway: ",
        );
        await confirm.close();
        if (proceed.trim() !== "UPGRADE") {
          console.log("Aborted.");
          process.exit(1);
        }
      }
    }
  } else if (!skipBackupCheck) {
    console.error("Non-interactive upgrade requires --skip-backup-check or a prior backup.");
    process.exit(1);
  }

  console.log("Building updated image and restarting services...");
  const up = runCompose(["up", "-d", "--build", "web", "worker"]);
  if (up.status !== 0) {
    process.exit(up.status ?? 1);
  }

  try {
    await waitForWebHealth();
    console.log("Upgrade complete. Web and worker are healthy.");
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
