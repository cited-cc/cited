"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuthenticatedUser, requireWorkspaceRole } from "@/lib/auth";
import {
  resolveCurrentAccessState,
} from "@/lib/auth/access-state";
import { trackProductEvent } from "@/lib/analytics/product";
import {
  getWorkspaceDomainSetup,
  upsertDomainAndBrand,
} from "@/lib/domains/domain-service";
import {
  rotateDomainVerificationToken,
  verifyDomainDnsTxt,
} from "@/lib/domains/verify-dns-txt";
import {
  completeOnboarding,
  renameWorkspace,
  saveOnboardingPrompts,
  setOnboardingStep,
  type OnboardingStep,
} from "@/lib/onboarding/onboarding-service";
import { activateMonitorsForWorkspace } from "@/lib/monitoring/activate-monitors";
import type { AiSurfaceKey } from "@/types/product";

async function requireOnboardingWorkspace() {
  const access = await resolveCurrentAccessState();
  if (
    access.kind !== "workspace_onboarding" &&
    access.kind !== "workspace_active"
  ) {
    throw new Error("Onboarding is not available for this account.");
  }
  if (access.kind === "workspace_active") {
    // Allow revisiting setup edits from app later; still require admin.
  }
  const workspaceId =
    access.kind === "workspace_onboarding" || access.kind === "workspace_active"
      ? access.workspaceId
      : null;
  if (!workspaceId) {
    throw new Error("Workspace required.");
  }
  const membership = await requireWorkspaceRole(workspaceId, [
    "owner",
    "admin",
  ]);
  return {
    workspaceId,
    planKey: membership.workspace.plan_key as
      | "free"
      | "founder"
      | "growth"
      | "pro"
      | "portfolio"
      | "enterprise",
    access,
  };
}

export async function saveWorkspaceStepAction(formData: FormData) {
  const { workspaceId } = await requireOnboardingWorkspace();
  const name = String(formData.get("name") ?? "");
  await renameWorkspace({ workspaceId, name });
  await setOnboardingStep(workspaceId, 2);
  trackProductEvent("onboarding_step_completed", { step: 1 });
  revalidatePath("/onboarding");
  redirect("/onboarding?step=2");
}

export async function saveDomainStepAction(formData: FormData) {
  const { workspaceId, planKey } = await requireOnboardingWorkspace();
  const result = await upsertDomainAndBrand({
    workspaceId,
    planKey,
    domainInput: String(formData.get("domain") ?? ""),
    brandName: String(formData.get("brandName") ?? ""),
    alternateNamesRaw: String(formData.get("alternateNames") ?? ""),
  });

  if (!result.ok) {
    redirect(
      `/onboarding?step=2&error=${encodeURIComponent(result.message)}`,
    );
  }

  await setOnboardingStep(workspaceId, 3);
  trackProductEvent("onboarding_step_completed", { step: 2 });
  revalidatePath("/onboarding");
  redirect("/onboarding?step=3");
}

export async function verifyDomainAction() {
  const { workspaceId } = await requireOnboardingWorkspace();
  const setup = await getWorkspaceDomainSetup(workspaceId);
  if (!setup) {
    redirect("/onboarding?step=2&error=Add%20a%20domain%20first.");
  }

  trackProductEvent("domain_verification_started", { step: 3 });
  const outcome = await verifyDomainDnsTxt({
    workspaceId,
    domainId: setup.domainId,
  });

  if (outcome.ok) {
    trackProductEvent("domain_verification_succeeded", { step: 3 });
    await setOnboardingStep(workspaceId, 4);
    revalidatePath("/onboarding");
    redirect("/onboarding?step=4");
  }

  trackProductEvent("domain_verification_failed", {
    step: 3,
    reason: outcome.code,
  });
  revalidatePath("/onboarding");
  redirect(
    `/onboarding?step=3&error=${encodeURIComponent(outcome.message)}`,
  );
}

export async function regenerateDnsRecordAction() {
  const { workspaceId } = await requireOnboardingWorkspace();
  const setup = await getWorkspaceDomainSetup(workspaceId);
  if (!setup) {
    redirect("/onboarding?step=2");
  }
  await rotateDomainVerificationToken({
    workspaceId,
    domainId: setup.domainId,
  });
  revalidatePath("/onboarding");
  redirect("/onboarding?step=3&notice=regenerated");
}

export async function saveVerifyLaterAction() {
  const { workspaceId } = await requireOnboardingWorkspace();
  await setOnboardingStep(workspaceId, 4);
  revalidatePath("/onboarding");
  redirect("/onboarding?step=4");
}

export async function savePromptsStepAction(formData: FormData) {
  const { workspaceId, planKey, access } = await requireOnboardingWorkspace();
  const setup = await getWorkspaceDomainSetup(workspaceId);
  if (!setup) {
    redirect("/onboarding?step=2&error=Add%20a%20domain%20first.");
  }

  const prompts = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29]
    .map((i) => String(formData.get(`prompt_${i}`) ?? ""))
    .filter((p) => p.trim().length > 0);

  const surfaceValues = formData
    .getAll("surfaces")
    .map(String)
    .filter(Boolean) as AiSurfaceKey[];

  try {
    trackProductEvent("monitor_setup_started", { step: 4 });
    await saveOnboardingPrompts({
      workspaceId,
      planKey,
      domainId: setup.domainId,
      prompts,
      surfaces: surfaceValues,
      countryCode: String(formData.get("countryCode") ?? "US"),
      languageCode: String(formData.get("languageCode") ?? "en"),
      city: String(formData.get("city") ?? "") || null,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not save prompts.";
    redirect(`/onboarding?step=4&error=${encodeURIComponent(message)}`);
  }

  await setOnboardingStep(workspaceId, 5);
  trackProductEvent("monitor_setup_completed", { step: 4 });
  trackProductEvent("monitor_created", { step: 4, route: "/onboarding" });
  trackProductEvent("onboarding_step_completed", { step: 4 });

  if (access.kind === "workspace_active") {
    try {
      await activateMonitorsForWorkspace(workspaceId);
    } catch {
      // Prompt edits must succeed even if activation is deferred.
    }
    revalidatePath("/app/monitors");
    revalidatePath("/app");
  }

  revalidatePath("/onboarding");
  redirect("/onboarding?step=5");
}

export async function goToOnboardingStepAction(step: OnboardingStep) {
  await requireAuthenticatedUser();
  const { workspaceId, access } = await requireOnboardingWorkspace();
  if (access.kind === "workspace_onboarding") {
    const max = Math.max(access.currentStep, step);
    if (step > max) {
      redirect(`/onboarding?step=${access.currentStep}`);
    }
  }
  await setOnboardingStep(workspaceId, step);
  revalidatePath("/onboarding");
  redirect(`/onboarding?step=${step}`);
}

export async function finishOnboardingAction() {
  const { workspaceId } = await requireOnboardingWorkspace();
  const setup = await getWorkspaceDomainSetup(workspaceId);
  if (!setup || setup.verificationStatus !== "verified") {
    redirect(
      "/onboarding?step=3&error=Verify%20your%20domain%20before%20finishing%20setup.",
    );
  }

  const result = await completeOnboarding(workspaceId);
  if (!result.ok) {
    redirect(
      `/onboarding?step=5&error=${encodeURIComponent(
        `Still needed: ${result.missing.join(", ")}`,
      )}`,
    );
  }

  trackProductEvent("onboarding_completed", { step: 5 });
  trackProductEvent("monitor_activated", { step: 5, route: "/onboarding" });
  revalidatePath("/app");
  redirect("/app");
}
