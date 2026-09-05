#!/usr/bin/env node
import { assertDockerAvailable, composeEnv, runCompose } from "./lib.mjs";

async function main() {
  assertDockerAvailable();
  runCompose(["ps"], { stdio: "inherit" });

  const env = composeEnv();
  const port = env.CITED_WEB_PORT ?? "3000";
  const url = env.NEXT_PUBLIC_APP_URL ?? `http://localhost:${port}`;
  try {
    const response = await fetch(`${url.replace(/\/$/, "")}/api/health`, {
      signal: AbortSignal.timeout(4000),
    });
    if (response.ok) {
      const payload = await response.json();
      console.log("Web health:", JSON.stringify(payload, null, 2));
    } else {
      console.log("Web health endpoint returned a non-OK status.");
    }
  } catch {
    console.log("Web health endpoint is not reachable.");
  }
}

main();
