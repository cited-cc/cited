import "server-only";

import { memberSubjectFromAccess, membershipLookupKeys } from "@/lib/auth/membership-keys";
import { getSessionPrincipal } from "@/lib/auth/session";
import { createAdminSupabaseClient } from "@/lib/db/admin";
import type { WorkspaceRole } from "@/types/product";
import type { PlanKey, WorkspaceStatus } from "@/types/product";

export type AccessState =
  | { kind: "unauthenticated" }
  | {
      kind: "authenticated_no_workspace";
      userId: string;
      memberSubject: string;
    }
  | {
      kind: "workspace_onboarding";
      userId: string;
      memberSubject: string;
      workspaceId: string;
      currentStep: number;
      role: WorkspaceRole;
      planKey: PlanKey;
      status: WorkspaceStatus;
    }
  | {
      kind: "workspace_active";
      userId: string;
      memberSubject: string;
      workspaceId: string;
      role: WorkspaceRole;
      planKey: PlanKey;
      status: WorkspaceStatus;
    }
  | {
      kind: "workspace_suspended";
      userId: string;
      memberSubject: string;
      workspaceId: string;
      role: WorkspaceRole;
      planKey: PlanKey;
    };

type MembershipRow = {
  workspace_id: string;
  clerk_user_id: string;
  user_id: string | null;
  role: WorkspaceRole;
};

type WorkspaceRow = {
  id: string;
  plan_key: PlanKey;
  status: WorkspaceStatus;
  onboarding_completed_at: string | null;
};

type OnboardingRow = {
  current_step: number;
  completed_at: string | null;
};

async function findMembershipForAccessState(
  userId: string,
  memberSubject: string,
): Promise<MembershipRow | null> {
  const admin = createAdminSupabaseClient();

  const { data: byUserId, error: byUserIdError } = await admin
    .from("workspace_members")
    .select("workspace_id, clerk_user_id, user_id, role")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (byUserIdError) {
    throw new Error(
      `Failed to resolve membership for access state: ${byUserIdError.message}`,
    );
  }

  if (byUserId) {
    return byUserId as MembershipRow;
  }

  const { data: byLegacy, error: byLegacyError } = await admin
    .from("workspace_members")
    .select("workspace_id, clerk_user_id, user_id, role")
    .eq("clerk_user_id", memberSubject)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (byLegacyError) {
    throw new Error(
      `Failed to resolve membership for access state: ${byLegacyError.message}`,
    );
  }

  return (byLegacy as MembershipRow | null) ?? null;
}

export async function resolveCurrentAccessState(): Promise<AccessState> {
  const principal = await getSessionPrincipal();

  if (!principal) {
    return { kind: "unauthenticated" };
  }

  const userId = principal.userId;
  const keys = membershipLookupKeys(principal);
  const memberSubject = keys.clerkUserId;
  const admin = createAdminSupabaseClient();

  const membership = await findMembershipForAccessState(userId, memberSubject);

  if (!membership) {
    return { kind: "authenticated_no_workspace", userId, memberSubject };
  }

  const { data: workspace, error: workspaceError } = await admin
    .from("workspaces")
    .select("id, plan_key, status, onboarding_completed_at")
    .eq("id", membership.workspace_id)
    .maybeSingle();

  if (workspaceError) {
    throw new Error(
      `Failed to resolve workspace for access state: ${workspaceError.message}`,
    );
  }

  if (!workspace) {
    return { kind: "authenticated_no_workspace", userId, memberSubject };
  }

  const ws = workspace as WorkspaceRow;

  if (ws.status === "suspended") {
    return {
      kind: "workspace_suspended",
      userId,
      memberSubject: membership.clerk_user_id,
      workspaceId: ws.id,
      role: membership.role,
      planKey: ws.plan_key,
    };
  }

  const onboardingComplete =
    Boolean(ws.onboarding_completed_at) ||
    (await isOnboardingComplete(ws.id));

  if (!onboardingComplete) {
    const step = await getOnboardingStep(ws.id);
    return {
      kind: "workspace_onboarding",
      userId,
      memberSubject: membership.clerk_user_id,
      workspaceId: ws.id,
      currentStep: step,
      role: membership.role,
      planKey: ws.plan_key,
      status: ws.status,
    };
  }

  return {
    kind: "workspace_active",
    userId,
    memberSubject: membership.clerk_user_id,
    workspaceId: ws.id,
    role: membership.role,
    planKey: ws.plan_key,
    status: ws.status,
  };
}

async function isOnboardingComplete(workspaceId: string): Promise<boolean> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("workspace_onboarding")
    .select("completed_at")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load onboarding state: ${error.message}`);
  }

  const row = data as OnboardingRow | null;
  return Boolean(row?.completed_at);
}

async function getOnboardingStep(workspaceId: string): Promise<number> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("workspace_onboarding")
    .select("current_step, completed_at")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load onboarding step: ${error.message}`);
  }

  const row = data as OnboardingRow | null;
  return row?.current_step ?? 1;
}

export function destinationForAccessState(state: AccessState): string {
  switch (state.kind) {
    case "unauthenticated":
      return "/sign-in";
    case "authenticated_no_workspace":
      return "/setup";
    case "workspace_onboarding":
      return "/onboarding";
    case "workspace_active":
      return "/app";
    case "workspace_suspended":
      return "/app?notice=suspended";
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}

export function accessMemberSubject(
  state: Exclude<AccessState, { kind: "unauthenticated" }>,
): string {
  return memberSubjectFromAccess({
    userId: state.userId,
    clerkUserId: state.memberSubject,
  });
}

export { isPaidWorkspaceStatus } from "@/lib/entitlements/access-types";
