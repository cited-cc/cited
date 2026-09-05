#!/usr/bin/env node
import { assertDockerAvailable, runCompose } from "./lib.mjs";

function main() {
  assertDockerAvailable();
  const result = runCompose(["down"], { stdio: "inherit" });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
  console.log("Stack stopped. Database volume and secret files were preserved.");
}

main();
