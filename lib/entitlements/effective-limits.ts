import {
  getPlanEntitlements,
  getPlanLimits,
  type PlanLimits,
} from "@/lib/entitlements/plan-entitlements";
import type { PlanKey } from "@/types/product";

/** Domains included in the base Portfolio plan. */
export const PORTFOLIO_INCLUDED_DOMAINS = 5;

/** Monitored prompts allowed per verified domain on Portfolio. */
export const PORTFOLIO_PROMPTS_PER_DOMAIN = 50;

export type PromptLimitScope = "workspace" | "domain";

export type EffectiveWorkspaceLimits = PlanLimits & {
  promptLimitScope: PromptLimitScope;
  includedDomains: number;
  extraDomains: number;
};

export type WorkspaceLimitInput = {
  planKey: PlanKey;
  portfolioExtraDomains?: number | null;
};

export function getEffectiveWorkspaceLimits(
  input: WorkspaceLimitInput,
): EffectiveWorkspaceLimits {
  const base = getPlanLimits(input.planKey);
  const extraDomains =
    input.planKey === "portfolio"
      ? Math.max(0, input.portfolioExtraDomains ?? 0)
      : 0;

  if (input.planKey !== "portfolio") {
    return {
      ...base,
      promptLimitScope: "workspace",
      includedDomains: base.maxDomains,
      extraDomains: 0,
    };
  }

  return {
    ...base,
    maxDomains: PORTFOLIO_INCLUDED_DOMAINS + extraDomains,
    maxPrompts: PORTFOLIO_PROMPTS_PER_DOMAIN,
    promptLimitScope: "domain",
    includedDomains: PORTFOLIO_INCLUDED_DOMAINS,
    extraDomains,
  };
}

export function getEffectiveMaxDomains(input: WorkspaceLimitInput): number {
  return getEffectiveWorkspaceLimits(input).maxDomains;
}

export function getEffectiveMaxPrompts(input: WorkspaceLimitInput): number {
  return getEffectiveWorkspaceLimits(input).maxPrompts;
}

export function portfolioSupportsExtraDomains(planKey: PlanKey): boolean {
  return planKey === "portfolio";
}

export function planUsesPerDomainPromptLimits(planKey: PlanKey): boolean {
  return getPlanEntitlements(planKey).planKey === "portfolio";
}
