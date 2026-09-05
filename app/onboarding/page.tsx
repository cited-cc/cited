import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { OnboardingLayoutShell } from "@/components/onboarding/onboarding-layout";
import {
  DnsVerificationStepForm,
  DomainStepForm,
  PromptsStepForm,
  ReviewStepForm,
  WorkspaceStepForm,
} from "@/components/onboarding/onboarding-steps";
import {
  destinationForAccessState,
  resolveCurrentAccessState,
} from "@/lib/auth/access-state";
import { getPlanEntitlements } from "@/lib/entitlements/plan-entitlements";
import { getSelectableAiSurfacesForPlan } from "@/lib/monitoring/surfaces";
import { getPlanRegistryEntry } from "@/lib/entitlements/plan-catalog";
import { createAdminSupabaseClient } from "@/lib/db/admin";
import { getWorkspaceDomainSetup } from "@/lib/domains/domain-service";
import { trackProductEvent } from "@/lib/analytics/product";
import {
  evaluateOnboardingCompletion,
  getWorkspaceOnboarding,
  sanitizeOnboardingError,
} from "@/lib/onboarding/onboarding-service";
import type { AiSurfaceKey, PlanKey } from "@/types/product";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Setup",
};

type OnboardingPageProps = {
  searchParams: Promise<{
    step?: string;
    error?: string;
    notice?: string;
  }>;
};

const SURFACE_LABELS: Record<string, string> = {
  chatgpt: "ChatGPT",
  gemini: "Gemini",
  google_ai_overviews: "Google AI Overviews",
  google_ai_mode: "Google AI Mode",
  perplexity: "Perplexity",
  claude: "Claude",
};

export default async function OnboardingPage({
  searchParams,
}: OnboardingPageProps) {
  const access = await resolveCurrentAccessState();

  if (access.kind === "unauthenticated") {
    redirect("/sign-in?redirect_url=/onboarding");
  }

  if (access.kind === "authenticated_no_workspace") {
    redirect(destinationForAccessState(access));
  }

  if (access.kind === "workspace_suspended") {
    redirect("/app?notice=suspended");
  }

  if (
    access.kind !== "workspace_onboarding" &&
    access.kind !== "workspace_active"
  ) {
    redirect(destinationForAccessState(access));
  }

  // past_due / active may finish or revisit setup
  const workspaceId = access.workspaceId;
  const planKey = access.planKey as PlanKey;
  const onboarding = await getWorkspaceOnboarding(workspaceId);
  const params = await searchParams;
  const requestedStep = Number(params.step ?? onboarding?.current_step ?? 1);
  const currentStep = Math.min(
    5,
    Math.max(1, Number.isFinite(requestedStep) ? requestedStep : 1),
  ) as 1 | 2 | 3 | 4 | 5;

  // Do not allow jumping ahead of persisted progress.
  const maxAllowed = onboarding?.current_step ?? 1;
  const step = (currentStep > maxAllowed ? maxAllowed : currentStep) as
    | 1
    | 2
    | 3
    | 4
    | 5;

  if (step === 1) {
    trackProductEvent("onboarding_started", { step: 1, route: "/onboarding" });
  }
  trackProductEvent("onboarding_step_viewed", { step, route: "/onboarding" });

  const admin = createAdminSupabaseClient();
  const { data: workspace } = await admin
    .from("workspaces")
    .select("name, plan_key")
    .eq("id", workspaceId)
    .single();

  const plan = getPlanRegistryEntry(planKey);
  const entitlements = getPlanEntitlements(planKey);
  const domainSetup = await getWorkspaceDomainSetup(workspaceId);
  const error = sanitizeOnboardingError(params.error);
  const notice = params.notice ?? null;

  const { data: prompts } = await admin
    .from("monitored_prompts")
    .select("prompt_text")
    .eq("workspace_id", workspaceId)
    .eq("active", true)
    .order("created_at", { ascending: true });

  const { data: configs } = await admin
    .from("monitor_configurations")
    .select("ai_surface")
    .eq("workspace_id", workspaceId)
    .eq("enabled", true);

  const selectedSurfaces = Array.from(
    new Set((configs ?? []).map((c) => c.ai_surface as AiSurfaceKey)),
  );

  const completion = await evaluateOnboardingCompletion(workspaceId);

  return (
    <OnboardingLayoutShell
      currentStep={step}
      planName={plan.name}
      planLabel={plan.priceLabel}
    >
      {step === 1 ? (
        <WorkspaceStepForm
          defaultName={(workspace?.name as string) ?? "My Cited workspace"}
          error={error}
        />
      ) : null}

      {step === 2 ? (
        <DomainStepForm
          defaultDomain={domainSetup?.hostname ?? ""}
          defaultBrand={domainSetup?.brandName ?? ""}
          defaultAlternates={(domainSetup?.alternateNames ?? []).join(", ")}
          normalizedPreview={domainSetup?.normalizedHostname ?? null}
          error={error}
        />
      ) : null}

      {step === 3 ? (
        <DnsVerificationStepForm
          txtHost={domainSetup?.txtHost ?? "@"}
          txtValue={domainSetup?.txtValue ?? ""}
          verified={domainSetup?.verificationStatus === "verified"}
          error={error}
          notice={notice}
        />
      ) : null}

      {step === 4 ? (
        <PromptsStepForm
          maxPrompts={entitlements.maxPrompts}
          allowedSurfaces={getSelectableAiSurfacesForPlan(planKey)}
          surfaceLabels={SURFACE_LABELS}
          defaultPrompts={(prompts ?? []).map((p) => p.prompt_text as string)}
          defaultSurfaces={selectedSurfaces}
          defaultCadenceLabel={
            entitlements.monitoringCadence === "daily"
              ? "Daily"
              : "Twice-weekly"
          }
          supportsCity={entitlements.supportsMultipleLocations}
          error={error}
        />
      ) : null}

      {step === 5 ? (
        <ReviewStepForm
          workspaceName={(workspace?.name as string) ?? ""}
          domain={
            domainSetup?.verificationStatus === "verified"
              ? domainSetup.normalizedHostname
              : "Not verified yet"
          }
          brandName={domainSetup?.brandName ?? ""}
          alternateNames={domainSetup?.alternateNames ?? []}
          promptCount={(prompts ?? []).length}
          surfaces={selectedSurfaces.map((s) => SURFACE_LABELS[s] ?? s)}
          cadence={
            entitlements.monitoringCadence === "daily"
              ? "Daily"
              : "Twice-weekly"
          }
          planName={plan.name}
          error={error}
          canFinish={completion.ok}
        />
      ) : null}
    </OnboardingLayoutShell>
  );
}
