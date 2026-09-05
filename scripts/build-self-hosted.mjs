#!/usr/bin/env node
/**
 * Production build wrapper for the community edition.
 * Sets build-time env in-process so package.json does not embed secret-like literals.
 */
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");

const env = {
  ...process.env,
  AUTH_SECRET:
    process.env.AUTH_SECRET ??
    process.env.BUILD_AUTH_SECRET ??
    "build-time-placeholder-min-32-chars-long",
  CITED_DEPLOYMENT_MODE: "self_hosted",
  NEXT_PUBLIC_CITED_DEPLOYMENT_MODE: "self_hosted",
};

const result = spawnSync(process.execPath, [nextBin, "build"], {
  stdio: "inherit",
  env,
});

process.exit(result.status ?? 1);
