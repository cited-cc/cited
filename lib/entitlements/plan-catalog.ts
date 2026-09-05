import type { AiSurfaceKey, MonitoringFrequency, PlanKey } from "@/types/product";

import {
  PLAN_ENTITLEMENTS,
  type PlanEntitlements,
  type PlanFeatures,
  type PlanLimits,
} from "@/lib/entitlements/plan-entitlements";

export type PlanCadence = Extract<MonitoringFrequency, "twice_weekly" | "daily">;

export type PlanDefinition = {
  key: PlanKey;
  publicName: string;
  name: string;
  description: string;
  monthlyPriceCents: number | null;
  priceMonthly: number | null;
  priceLabel: string;
  public: boolean;
  defaultCadence: PlanCadence | "manual";
  limits: PlanLimits;
  features: PlanFeatures;
  entitlements: PlanEntitlements;
  featureLabels: string[];
  rank: number;
};

function dollarsFromCents(cents: number | null): number | null {
  if (cents === null) return null;
  return cents / 100;
}

function priceLabelFromCents(cents: number | null): string {
  if (cents === null) return "Custom";
  return `$${cents / 100} / month`;
}

function buildPlanDefinition(input: {
  key: PlanKey;
  publicName: string;
  description: string;
  monthlyPriceCents: number | null;
  public: boolean;
  defaultCadence: PlanCadence | "manual";
  featureLabels: string[];
  rank: number;
}): PlanDefinition {
  const entitlements = PLAN_ENTITLEMENTS[input.key];
  return {
    key: input.key,
    publicName: input.publicName,
    name: input.publicName,
    description: input.description,
    monthlyPriceCents: input.monthlyPriceCents,
    priceMonthly: dollarsFromCents(input.monthlyPriceCents),
    priceLabel:
      input.key === "free"
        ? "Not for sale"
        : priceLabelFromCents(input.monthlyPriceCents),
    public: input.public,
    defaultCadence: input.defaultCadence,
    limits: entitlements.limits,
    features: entitlements.features,
    entitlements,
    featureLabels: input.featureLabels,
    rank: input.rank,
  };
}

export const PLAN_REGISTRY: Record<PlanKey, PlanDefinition> = {
  free: buildPlanDefinition({
    key: "free",
    publicName: "Free",
    description: "Internal free tier.",
    monthlyPriceCents: null,
    public: false,
    defaultCadence: "manual",
    featureLabels: ["Limited prompts", "Manual checks"],
    rank: 0,
  }),
  founder: buildPlanDefinition({
    key: "founder",
    publicName: "Founder",
    description: "Focused citation monitoring for one domain and key prompts.",
    monthlyPriceCents: 1900,
    public: true,
    defaultCadence: "twice_weekly",
    featureLabels: [
      "1 verified domain",
      "10 monitored prompts",
      "ChatGPT and Gemini",
      "Twice-weekly monitoring",
    ],
    rank: 1,
  }),
  growth: buildPlanDefinition({
    key: "growth",
    publicName: "Growth",
    description: "For teams that need a broader view of how AI answers are changing.",
    monthlyPriceCents: 2900,
    public: true,
    defaultCadence: "twice_weekly",
    featureLabels: ["25 monitored prompts", "Competitor watch"],
    rank: 2,
  }),
  pro: buildPlanDefinition({
    key: "pro",
    publicName: "Pro",
    description: "For high-intent teams that need closer monitoring and more context.",
    monthlyPriceCents: 4900,
    public: true,
    defaultCadence: "daily",
    featureLabels: ["30 monitored prompts", "Daily monitoring"],
    rank: 3,
  }),
  portfolio: buildPlanDefinition({
    key: "portfolio",
    publicName: "Portfolio",
    description: "Pro monitoring across multiple verified domains from one workspace.",
    monthlyPriceCents: 19_900,
    public: true,
    defaultCadence: "daily",
    featureLabels: ["5 verified domains included", "50 prompts per domain"],
    rank: 4,
  }),
  enterprise: buildPlanDefinition({
    key: "enterprise",
    publicName: "Enterprise",
    description: "Custom monitoring for larger teams.",
    monthlyPriceCents: null,
    public: false,
    defaultCadence: "daily",
    featureLabels: ["Custom domains", "Custom prompts"],
    rank: 5,
  }),
};

export const PUBLIC_PLAN_KEYS = ["founder", "growth", "pro", "portfolio"] as const;
export type PublicPlanKey = (typeof PUBLIC_PLAN_KEYS)[number];

export function getPlanRegistryEntry(planKey: PlanKey): PlanDefinition {
  return PLAN_REGISTRY[planKey];
}

export function getPlanDefinition(planKey: PlanKey): PlanDefinition {
  return PLAN_REGISTRY[planKey];
}

export function getDefaultCadenceForPlan(
  planKey: PlanKey,
): PlanCadence | "manual" {
  return PLAN_REGISTRY[planKey].defaultCadence;
}

export function getPlanRank(planKey: PlanKey): number {
  return PLAN_REGISTRY[planKey].rank;
}

export function getUpgradeTargets(from: PlanKey): PublicPlanKey[] {
  const fromRank = getPlanRank(from);
  return PUBLIC_PLAN_KEYS.filter((key) => PLAN_REGISTRY[key].rank > fromRank);
}

export function getDowngradeTargets(from: PlanKey): PublicPlanKey[] {
  const fromRank = getPlanRank(from);
  return PUBLIC_PLAN_KEYS.filter((key) => PLAN_REGISTRY[key].rank < fromRank);
}

export function isPlanKey(value: string | null | undefined): value is PlanKey {
  return (
    value === "free" ||
    value === "founder" ||
    value === "growth" ||
    value === "pro" ||
    value === "portfolio" ||
    value === "enterprise"
  );
}

export type CheckoutPlanKey = PublicPlanKey;

export function isPublicPaidPlanKey(
  value: string | null | undefined,
): value is PublicPlanKey {
  return (
    value === "founder" ||
    value === "growth" ||
    value === "pro" ||
    value === "portfolio"
  );
}

/** @deprecated Use isPublicPaidPlanKey. */
export function isCheckoutPlanKey(
  value: string | null | undefined,
): value is PublicPlanKey {
  return isPublicPaidPlanKey(value);
}

export function parseCheckoutPlanKey(
  value: string | null | undefined,
): PublicPlanKey | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return isCheckoutPlanKey(normalized) ? normalized : null;
}

export {
  PLAN_ENTITLEMENTS,
  getPlanEntitlements,
  getPlanLimits,
  getPlanFeatures,
  canUseFrequency,
  canUseSurface,
  isWithinLimit,
} from "@/lib/entitlements/plan-entitlements";

export type {
  PlanEntitlements,
  PlanFeatures,
  PlanLimits,
} from "@/lib/entitlements/plan-entitlements";
