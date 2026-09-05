#!/usr/bin/env node
import { readFileSync, statSync } from "node:fs";

const heartbeatPath =
  process.env.CITED_WORKER_HEARTBEAT_PATH ?? "/tmp/cited-worker-heartbeat";
const maxAgeMs = Number(process.env.CITED_WORKER_HEARTBEAT_MAX_AGE_MS ?? "120000");

try {
  const stats = statSync(heartbeatPath);
  const ageMs = Date.now() - stats.mtimeMs;
  if (ageMs > maxAgeMs) {
    process.exit(1);
  }
  const raw = readFileSync(heartbeatPath, "utf8").trim();
  if (raw !== "alive") {
    process.exit(1);
  }
  process.exit(0);
} catch {
  process.exit(1);
}
