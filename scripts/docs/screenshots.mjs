#!/usr/bin/env node
/**
 * Documentation screenshot workflow entrypoint.
 * Uses live capture when CITED_DOCS_SCREENSHOT_LIVE=true, otherwise renders deterministic templates.
 */
import { spawnSync } from "node:child_process";

const live = process.env.CITED_DOCS_SCREENSHOT_LIVE === "true";

function run(script) {
  const result = spawnSync("node", [script], { stdio: "inherit", env: process.env });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (live) {
  run("scripts/docs/capture-screenshots.mjs");
} else {
  run("scripts/docs/render-screenshots.mjs");
}
