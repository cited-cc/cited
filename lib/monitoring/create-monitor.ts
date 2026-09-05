import { getPlanEntitlements } from "@/lib/entitlements/plan-entitlements";
import { getEffectiveWorkspaceLimits } from "@/lib/entitlements/effective-limits";
import { getDefaultCadenceForPlan } from "@/lib/entitlements/plan-catalog";
import { createAdminSupabaseClient } from "@/lib/db/admin";
import { activateMonitorsForWorkspace } from "@/lib/monitoring/activate-monitors";
import { getSelectableAiSurfacesForPlan } from "@/lib/monitoring/surfaces";
import {
  normalizePromptText,
  validatePromptText,
} from "@/lib/onboarding/onboarding-service";
import type { AiSurfaceKey, MonitoringFrequency, PlanKey } from "@/types/product";

export type CreateMonitorInput = {
  workspaceId: string;
  planKey: PlanKey;
  portfolioExtraDomains?: number | null;
  domainId: string;
  promptText: string;
  surfaces: AiSurfaceKey[];
  countryCode: string;
  languageCode: string;
  city?: string | null;
};

export async function createMonitor(
  input: CreateMonitorInput,
): Promise<{ ok: true; promptId: string } | { ok: false; error: string }> {
  const limits = getEffectiveWorkspaceLimits({
    planKey: input.planKey,
    portfolioExtraDomains: input.portfolioExtraDomains,
  });
  const entitlements = getPlanEntitlements(input.planKey);
  const cadence = getDefaultCadenceForPlan(input.planKey);

  if (cadence === "manual") {
    return {
      ok: false,
      error: "This plan does not support scheduled monitoring.",
    };
  }

  let promptText: string;
  try {
    promptText = validatePromptText(input.promptText);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Invalid prompt.",
    };
  }

  const selectable = new Set(getSelectableAiSurfacesForPlan(input.planKey));
  const allowedSurfaces = input.surfaces.filter(
    (surface) =>
      entitlements.allowedSurfaces.includes(surface) && selectable.has(surface),
  );

  if (allowedSurfaces.length < 1) {
    return {
      ok: false,
      error: "Select at least one AI surface available on your plan.",
    };
  }

  if (
    input.city &&
    input.city.trim() &&
    !entitlements.supportsMultipleLocations
  ) {
    return {
      ok: false,
      error: "City-level location is not available on this plan.",
    };
  }

  const admin = createAdminSupabaseClient();

  const { data: domain } = await admin
    .from("domains")
    .select("id, verification_status")
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.domainId)
    .maybeSingle();

  if (!domain) {
    return { ok: false, error: "Domain not found." };
  }

  if (domain.verification_status !== "verified") {
    return {
      ok: false,
      error: "Verify this domain before adding monitors.",
    };
  }

  let promptsQuery = admin
    .from("monitored_prompts")
    .select("id, normalized_prompt", { count: "exact" })
    .eq("workspace_id", input.workspaceId);

  if (limits.promptLimitScope === "domain") {
    promptsQuery = promptsQuery.eq("domain_id", input.domainId);
  }

  const { data: existingPrompts, count: promptCount } = await promptsQuery;

  const currentCount = promptCount ?? existingPrompts?.length ?? 0;
  if (currentCount >= limits.maxPrompts) {
    return {
      ok: false,
      error:
        limits.promptLimitScope === "domain"
          ? `You’ve reached the ${limits.maxPrompts}-prompt limit for this domain.`
          : `You’ve reached the ${limits.maxPrompts}-prompt limit for your plan.`,
    };
  }

  const normalized = normalizePromptText(promptText);
  const duplicate = (existingPrompts ?? []).some(
    (row) => (row.normalized_prompt as string | null) === normalized,
  );
  if (duplicate) {
    return {
      ok: false,
      error: "This prompt is already monitored for this domain.",
    };
  }

  const countryCode = (input.countryCode || "US").toUpperCase().slice(0, 2);
  const languageCode = (input.languageCode || "en").toLowerCase().slice(0, 8);
  const city =
    entitlements.supportsMultipleLocations && input.city?.trim()
      ? input.city.trim().slice(0, 80)
      : null;

  const promptNumber = currentCount + 1;

  const { data: prompt, error: promptError } = await admin
    .from("monitored_prompts")
    .insert({
      workspace_id: input.workspaceId,
      domain_id: input.domainId,
      name: `Prompt ${promptNumber}`,
      prompt_text: promptText,
      normalized_prompt: normalized,
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

  if (promptError || !prompt) {
    return { ok: false, error: "Could not save monitor prompt." };
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
    await admin
      .from("monitored_prompts")
      .delete()
      .eq("id", prompt.id)
      .eq("workspace_id", input.workspaceId);
    return { ok: false, error: "Could not save monitor configuration." };
  }

  try {
    await activateMonitorsForWorkspace(input.workspaceId);
  } catch {
    // Prompt save succeeded; activation can catch up on next dispatch.
  }

  return { ok: true, promptId: prompt.id as string };
}
