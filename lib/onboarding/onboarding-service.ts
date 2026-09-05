import "server-only";

import { getPlanEntitlements } from "@/lib/entitlements/plan-entitlements";
import { getDefaultCadenceForPlan } from "@/lib/entitlements/plan-catalog";
import { createAdminSupabaseClient } from "@/lib/db/admin";
import { activateMonitorsForWorkspace } from "@/lib/monitoring/activate-monitors";
import { getSelectableAiSurfacesForPlan } from "@/lib/monitoring/surfaces";
import {
  slugifyWorkspaceName,
  validateWorkspaceName,
} from "@/lib/workspaces/provision-workspace";
import type { AiSurfaceKey, MonitoringFrequency, PlanKey } from "@/types/product";

import type { OnboardingStep } from "@/lib/onboarding/constants";
export type { OnboardingStep } from "@/lib/onboarding/constants";
export { ONBOARDING_STEPS, PROMPT_IDEA_TEMPLATES } from "@/lib/onboarding/constants";

/** Hide framework control-flow errors from onboarding UI. */
export function sanitizeOnboardingError(
  error: string | null | undefined,
): string | null {
  if (!error?.trim()) {
    return null;
  }
  const trimmed = error.trim();
  if (trimmed.startsWith("NEXT_")) {
    return null;
  }
  return trimmed;
}

export type WorkspaceOnboarding = {
  id: string;
  workspace_id: string;
  current_step: number;
  completed_at: string | null;
  dismissed_at: string | null;
  selected_plan_key_snapshot: PlanKey | null;
  setup_started_at: string;
};

export function assertValidStepTransition(
  current: number,
  next: number,
): void {
  if (next < 1 || next > 5) {
    throw new Error("Invalid onboarding step.");
  }
  // Allow staying, advancing by 1, or going back.
  if (next > current + 1) {
    throw new Error("Complete the current step before continuing.");
  }
}

export async function getWorkspaceOnboarding(
  workspaceId: string,
): Promise<WorkspaceOnboarding | null> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("workspace_onboarding")
    .select("*")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load onboarding: ${error.message}`);
  }

  return (data as WorkspaceOnboarding | null) ?? null;
}

export async function setOnboardingStep(
  workspaceId: string,
  step: OnboardingStep,
): Promise<void> {
  const admin = createAdminSupabaseClient();
  const existing = await getWorkspaceOnboarding(workspaceId);
  if (!existing) {
    throw new Error("Onboarding record not found.");
  }
  assertValidStepTransition(existing.current_step, step);

  const { error } = await admin
    .from("workspace_onboarding")
    .update({ current_step: step })
    .eq("workspace_id", workspaceId);

  if (error) {
    throw new Error(`Failed to update onboarding step: ${error.message}`);
  }
}

export async function renameWorkspace(input: {
  workspaceId: string;
  name: string;
}): Promise<{ name: string; slug: string }> {
  const name = validateWorkspaceName(input.name);
  const admin = createAdminSupabaseClient();

  const base = slugifyWorkspaceName(name);
  let slug = base;
  for (let i = 0; i < 8; i += 1) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    const { data } = await admin
      .from("workspaces")
      .select("id")
      .eq("slug", candidate)
      .neq("id", input.workspaceId)
      .maybeSingle();
    if (!data) {
      slug = candidate;
      break;
    }
  }

  const { data, error } = await admin
    .from("workspaces")
    .update({ name, slug })
    .eq("id", input.workspaceId)
    .select("name, slug")
    .single();

  if (error || !data) {
    throw new Error("Could not save workspace name.");
  }

  return { name: data.name as string, slug: data.slug as string };
}

export function normalizePromptText(text: string): string {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}

export function validatePromptText(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (trimmed.length < 3) {
    throw new Error("Each prompt must be at least 3 characters.");
  }
  if (trimmed.length > 500) {
    throw new Error("Each prompt must be 500 characters or fewer.");
  }
  if (/[<>]/.test(trimmed)) {
    throw new Error("Prompts cannot include HTML markup.");
  }
  return trimmed;
}

export async function saveOnboardingPrompts(input: {
  workspaceId: string;
  planKey: PlanKey;
  domainId: string;
  prompts: string[];
  surfaces: AiSurfaceKey[];
  countryCode: string;
  languageCode: string;
  city?: string | null;
}): Promise<{ promptCount: number }> {
  const entitlements = getPlanEntitlements(input.planKey);
  const cadence = getDefaultCadenceForPlan(input.planKey);
  if (cadence === "manual") {
    throw new Error("This plan does not support scheduled monitoring.");
  }

  const cleaned: string[] = [];
  const seen = new Set<string>();
  for (const raw of input.prompts) {
    if (!raw.trim()) continue;
    const text = validatePromptText(raw);
    const normalized = normalizePromptText(text);
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    cleaned.push(text);
  }

  if (cleaned.length < 1) {
    throw new Error("Add at least one prompt to continue.");
  }

  if (cleaned.length > entitlements.maxPrompts) {
    throw new Error(
      `This plan allows up to ${entitlements.maxPrompts} monitored prompts.`,
    );
  }

  const selectable = new Set(getSelectableAiSurfacesForPlan(input.planKey));
  const allowedSurfaces = input.surfaces.filter(
    (surface) =>
      entitlements.allowedSurfaces.includes(surface) && selectable.has(surface),
  );
  if (allowedSurfaces.length < 1) {
    throw new Error("Select at least one AI surface available on your plan.");
  }

  if (
    input.city &&
    input.city.trim() &&
    !entitlements.supportsMultipleLocations
  ) {
    throw new Error("City-level location is not available on this plan.");
  }

  const countryCode = (input.countryCode || "US").toUpperCase().slice(0, 2);
  const languageCode = (input.languageCode || "en").toLowerCase().slice(0, 8);
  const city =
    entitlements.supportsMultipleLocations && input.city?.trim()
      ? input.city.trim().slice(0, 80)
      : null;

  const admin = createAdminSupabaseClient();

  // Replace prior onboarding prompts for this domain (idempotent setup).
  const { data: existingPrompts } = await admin
    .from("monitored_prompts")
    .select("id")
    .eq("workspace_id", input.workspaceId)
    .eq("domain_id", input.domainId);

  const existingIds = (existingPrompts ?? []).map((p) => p.id as string);
  if (existingIds.length > 0) {
    await admin
      .from("monitor_configurations")
      .delete()
      .eq("workspace_id", input.workspaceId)
      .in("monitored_prompt_id", existingIds);
    await admin
      .from("monitored_prompts")
      .delete()
      .eq("workspace_id", input.workspaceId)
      .in("id", existingIds);
  }

  for (const [index, promptText] of cleaned.entries()) {
    const { data: prompt, error } = await admin
      .from("monitored_prompts")
      .insert({
        workspace_id: input.workspaceId,
        domain_id: input.domainId,
        name: `Prompt ${index + 1}`,
        prompt_text: promptText,
        normalized_prompt: normalizePromptText(promptText),
        locale: `${languageCode}-${countryCode}`,
        language_code: languageCode,
        country_code: countryCode,
        city,
        active: true,
        monitoring_frequency: cadence as MonitoringFrequency,
        priority: "normal",
        setup_status: "configured",
      })
      .select("id")
      .single();

    if (error || !prompt) {
      throw new Error("Could not save prompts. Try again.");
    }

    const configs = allowedSurfaces.map((surface) => ({
      workspace_id: input.workspaceId,
      monitored_prompt_id: prompt.id as string,
      ai_surface: surface,
      enabled: true,
      scan_frequency: cadence as MonitoringFrequency,
      locale: `${languageCode}-${countryCode}`,
      country_code: countryCode,
      city,
      configured_at: new Date().toISOString(),
      activation_status: "configured" as const,
    }));

    const { error: configError } = await admin
      .from("monitor_configurations")
      .insert(configs);

    if (configError) {
      throw new Error("Could not save monitor configuration.");
    }
  }

  return { promptCount: cleaned.length };
}

export type OnboardingCompletionCheck = {
  ok: boolean;
  missing: string[];
};

export async function evaluateOnboardingCompletion(
  workspaceId: string,
): Promise<OnboardingCompletionCheck> {
  const admin = createAdminSupabaseClient();
  const missing: string[] = [];

  const { data: workspace } = await admin
    .from("workspaces")
    .select("name, status, plan_key")
    .eq("id", workspaceId)
    .maybeSingle();

  if (!workspace?.name?.trim()) {
    missing.push("Workspace name");
  }
  if (
    workspace?.status !== "active" &&
    workspace?.status !== "trialing"
  ) {
    missing.push("Active subscription");
  }

  const { data: domain } = await admin
    .from("domains")
    .select("id, verification_status")
    .eq("workspace_id", workspaceId)
    .eq("verification_status", "verified")
    .limit(1)
    .maybeSingle();

  if (!domain) {
    missing.push("Verified domain");
  }

  const { data: brand } = await admin
    .from("brands")
    .select("id")
    .eq("workspace_id", workspaceId)
    .limit(1)
    .maybeSingle();

  if (!brand) {
    missing.push("Brand name");
  }

  const { count: promptCount } = await admin
    .from("monitored_prompts")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .eq("active", true);

  if ((promptCount ?? 0) < 1) {
    missing.push("At least one prompt");
  }

  const { count: configCount } = await admin
    .from("monitor_configurations")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .eq("enabled", true);

  if ((configCount ?? 0) < 1) {
    missing.push("Selected AI surfaces");
  }

  return { ok: missing.length === 0, missing };
}

export async function completeOnboarding(
  workspaceId: string,
): Promise<{ ok: true } | { ok: false; missing: string[] }> {
  const check = await evaluateOnboardingCompletion(workspaceId);
  if (!check.ok) {
    return { ok: false, missing: check.missing };
  }

  const admin = createAdminSupabaseClient();
  const now = new Date().toISOString();

  const { error: onboardingError } = await admin
    .from("workspace_onboarding")
    .update({
      completed_at: now,
      current_step: 5,
    })
    .eq("workspace_id", workspaceId);

  if (onboardingError) {
    throw new Error("Could not complete onboarding.");
  }

  await admin
    .from("workspaces")
    .update({ onboarding_completed_at: now })
    .eq("id", workspaceId);

  // Activate eligible monitors and queue baseline scans asynchronously.
  // Never blocks onboarding on provider calls.
  try {
    await activateMonitorsForWorkspace(workspaceId);
  } catch {
    // Activation failures must not roll back onboarding completion.
  }

  return { ok: true };
}

