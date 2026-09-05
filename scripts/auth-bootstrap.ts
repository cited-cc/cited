#!/usr/bin/env tsx
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { runCliBootstrap } from "@/lib/auth/bootstrap";
import { isLocalAuthEnabled } from "@/lib/auth/config";
import { isSelfHostedDeployment } from "@/lib/deployment/mode";

async function promptLine(label: string): Promise<string> {
  const rl = createInterface({ input, output });
  const value = await rl.question(label);
  await rl.close();
  return value;
}

async function main() {
  if (!isSelfHostedDeployment() || !isLocalAuthEnabled()) {
    console.error(
      "auth:bootstrap requires CITED_DEPLOYMENT_MODE=self_hosted and CITED_AUTH_PROVIDER=local.",
    );
    process.exit(1);
  }

  const email = process.env.CITED_BOOTSTRAP_EMAIL ?? (await promptLine("Owner email: "));
  const password =
    process.env.CITED_BOOTSTRAP_PASSWORD ??
    (await promptLine("Owner password (min 12 chars): "));
  const displayName = process.env.CITED_BOOTSTRAP_DISPLAY_NAME ?? undefined;
  const workspaceName = process.env.CITED_BOOTSTRAP_WORKSPACE_NAME ?? undefined;

  const result = await runCliBootstrap({
    email: email.trim(),
    password,
    displayName: displayName?.trim() || null,
    workspaceName: workspaceName?.trim() || null,
  });

  console.log("Bootstrap completed.");
  console.log(`User ID: ${result.userId}`);
  console.log(`Workspace ID: ${result.workspaceId}`);
  console.log("Sign in at /sign-in with the owner email and password.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Bootstrap failed.");
  process.exit(1);
});
