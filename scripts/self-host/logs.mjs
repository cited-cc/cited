#!/usr/bin/env node
import { assertDockerAvailable, runCompose } from "./lib.mjs";

function main() {
  assertDockerAvailable();
  const args = process.argv.slice(2);
  const result = runCompose(["logs", "--tail", "200", ...args], { stdio: "inherit" });
  process.exit(result.status ?? 0);
}

main();
