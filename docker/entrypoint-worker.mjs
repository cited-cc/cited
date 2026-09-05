#!/usr/bin/env node
import { spawn } from "node:child_process";
import { hydrateSecretFilesFromEnv } from "../lib/env/secret-files.mjs";
import { hydrateDatabaseUrlsFromEnv } from "../lib/db/build-connection-url.mjs";

hydrateSecretFilesFromEnv();
hydrateDatabaseUrlsFromEnv();

const child = spawn("node", ["--import", "tsx", "scripts/jobs-worker.ts"], {
  stdio: "inherit",
  env: process.env,
});

let shuttingDown = false;
const stop = (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  child.kill(signal);
};

process.on("SIGTERM", () => stop("SIGTERM"));
process.on("SIGINT", () => stop("SIGINT"));

child.on("exit", (code, signal) => {
  if (signal) {
    process.exit(0);
  }
  process.exit(code ?? 1);
});
