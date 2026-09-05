import "server-only";

import { randomUUID } from "node:crypto";

import { getBootstrapToken, isLocalAuthEnabled } from "@/lib/auth/config";
import {
  countWorkspaceOwners,
  createLocalUser,
  hasAnyInternalUser,
  normalizeEmail,
  recordAuthAuditEvent,
} from "@/lib/auth/identity";
import {
  compareBootstrapToken,
  createLocalCredentials,
} from "@/lib/auth/local-credentials";
import { localMembershipSubject } from "@/lib/auth/membership-keys";
import { slugifyWorkspaceName } from "@/lib/workspaces/provision-workspace";
import { isSelfHostedDeployment } from "@/lib/deployment/mode";
import { createAdminSupabaseClient } from "@/lib/db/admin";
import {
  assertRateLimitDurable,
  hashRateLimitFingerprint,
} from "@/lib/security/rate-limit";

export type BootstrapInput = {
  bootstrapToken: string;
  email: string;
  password: string;
  displayName?: string | null;
  workspaceName?: string | null;
};

export type BootstrapResult = {
  userId: string;
  workspaceId: string;
};

export async function canRunBrowserBootstrap(): Promise<boolean> {
  if (!isSelfHostedDeployment() || !isLocalAuthEnabled()) {
    return false;
  }

  if (!getBootstrapToken()) {
    return false;
  }

  const ownerCount = await countWorkspaceOwners();
  return ownerCount === 0;
}

async function assertBootstrapRateLimit(namespace: string): Promise<void> {
  const key = hashRateLimitFingerprint(["auth-bootstrap", namespace]);
  const result = await assertRateLimitDurable({
    key,
    limit: 5,
    windowMs: 15 * 60_000,
  });
  if (!result.ok) {
    throw new Error("Bootstrap is temporarily unavailable. Try again later.");
  }
}

export async function runSelfHostedBootstrap(
  input: BootstrapInput,
): Promise<BootstrapResult> {
  if (!isSelfHostedDeployment() || !isLocalAuthEnabled()) {
    throw new Error("Bootstrap is only available in self-hosted local auth mode.");
  }

  const expectedToken = getBootstrapToken();
  if (!expectedToken) {
    throw new Error("Bootstrap is not configured.");
  }

  await assertBootstrapRateLimit("browser");

  if (!compareBootstrapToken(input.bootstrapToken.trim(), expectedToken)) {
    throw new Error("Bootstrap authorization failed.");
  }

  const ownerCount = await countWorkspaceOwners();
  if (ownerCount > 0 || (await hasAnyInternalUser())) {
    throw new Error("Bootstrap has already completed.");
  }

  const emailNormalized = normalizeEmail(input.email);
  const workspaceName = (input.workspaceName?.trim() || "My Cited workspace").slice(
    0,
    80,
  );
  const slug = slugifyWorkspaceName(workspaceName);
  const admin = createAdminSupabaseClient();

  const user = await createLocalUser({
    email: emailNormalized,
    displayName: input.displayName ?? null,
  });

  await createLocalCredentials(user.userId, input.password);

  const workspaceId = randomUUID();
  const membershipSubject = localMembershipSubject(user.userId);

  const { error: workspaceError } = await admin.from("workspaces").insert({
    id: workspaceId,
    name: workspaceName,
    slug,
    owner_clerk_user_id: membershipSubject,
    owner_user_id: user.userId,
    plan_key: "free",
    status: "active",
    onboarding_completed_at: new Date().toISOString(),
  });

  if (workspaceError) {
    throw new Error(`Failed to create bootstrap workspace: ${workspaceError.message}`);
  }

  const { error: memberError } = await admin.from("workspace_members").insert({
    workspace_id: workspaceId,
    clerk_user_id: membershipSubject,
    user_id: user.userId,
    role: "owner",
  });

  if (memberError) {
    throw new Error(`Failed to create bootstrap membership: ${memberError.message}`);
  }

  const { error: onboardingError } = await admin.from("workspace_onboarding").insert({
    workspace_id: workspaceId,
    current_step: 1,
    completed_at: new Date().toISOString(),
  });

  if (onboardingError) {
    throw new Error(`Failed to create onboarding record: ${onboardingError.message}`);
  }

  await recordAuthAuditEvent({
    userId: user.userId,
    workspaceId,
    action: "auth.bootstrap.completed",
  });

  return { userId: user.userId, workspaceId };
}

export async function runCliBootstrap(input: {
  email: string;
  password: string;
  displayName?: string | null;
  workspaceName?: string | null;
  bootstrapToken?: string;
}): Promise<BootstrapResult> {
  const token = input.bootstrapToken ?? getBootstrapToken();
  if (!token) {
    throw new Error("CITED_BOOTSTRAP_TOKEN is required for CLI bootstrap.");
  }

  return runSelfHostedBootstrap({
    bootstrapToken: token,
    email: input.email,
    password: input.password,
    displayName: input.displayName,
    workspaceName: input.workspaceName,
  });
}
