import { PLAN_ENTITLEMENTS } from "@/lib/entitlements/plan-entitlements";
import type { PlanKey } from "@/types/product";

/** Public subscription tiers shown on marketing surfaces. */
export const PUBLIC_PLAN_KEYS = [
  "founder",
  "growth",
  "pro",
  "portfolio",
] as const;

export type PublicPlanKey = (typeof PUBLIC_PLAN_KEYS)[number];

export type PublicPlanFeature = {
  label: string;
  included: boolean;
  detail?: string;
};

export type PublicPlan = {
  key: PublicPlanKey;
  name: string;
  priceMonthly: number;
  priceLabel: string;
  tagline: string;
  badge?: string;
  highlighted?: boolean;
  ctaLabel: string;
  features: PublicPlanFeature[];
  teaserFeatures: string[];
};

function historyLabel(days: number | null): string {
  if (days === null) return "Expanded history";
  if (days >= 365) return "1-year history";
  return `${days}-day history`;
}

function cadenceLabel(planKey: PublicPlanKey): string {
  const entitlements = PLAN_ENTITLEMENTS[planKey];
  if (entitlements.allowedFrequencies.includes("daily")) {
    return "Daily checks";
  }
  if (entitlements.allowedFrequencies.includes("twice_weekly")) {
    return "Twice-weekly checks";
  }
  return "Manual checks";
}

function surfacesLabel(planKey: PublicPlanKey): string {
  if (planKey === "founder") {
    return "ChatGPT and Gemini";
  }
  if (planKey === "growth") {
    return "ChatGPT, Gemini, and Perplexity";
  }
  return "ChatGPT, Gemini, Perplexity, Claude, and Google AI";
}

/**
 * Public plan presentation derived from entitlement limits.
 * Prices are marketing display values; Stripe IDs live in env.
 */
export const PUBLIC_PLANS: Record<PublicPlanKey, PublicPlan> = {
  founder: {
    key: "founder",
    name: "Founder",
    priceMonthly: 19,
    priceLabel: "$19 / month",
    tagline: "Focused citation monitoring for one domain and key prompts.",
    highlighted: true,
    ctaLabel: "Start with Founder",
    teaserFeatures: [
      "10 monitored prompts",
      "ChatGPT and Gemini",
      "Twice-weekly checks",
      "Citation Inbox",
      "Email alerts",
      "90-day history",
    ],
    features: [
      { label: "1 verified domain", included: true },
      { label: "10 monitored prompts", included: true },
      { label: surfacesLabel("founder"), included: true },
      { label: cadenceLabel("founder"), included: true },
      { label: "Citation Inbox", included: true },
      { label: "Email alerts", included: true },
      { label: "Competitor watch", included: false },
      { label: historyLabel(PLAN_ENTITLEMENTS.founder.historyDays), included: true },
      { label: "Cancel anytime", included: true },
    ],
  },
  growth: {
    key: "growth",
    name: "Growth",
    priceMonthly: 29,
    priceLabel: "$29 / month",
    tagline:
      "Broader prompt coverage for teams tracking more buyer questions.",
    ctaLabel: "Choose Growth",
    teaserFeatures: [
      "25 monitored prompts",
      "ChatGPT, Gemini, Perplexity",
      "Competitor watch",
      "Email alerts",
      "1-year history",
    ],
    features: [
      { label: "1 verified domain", included: true },
      { label: "25 monitored prompts", included: true },
      { label: surfacesLabel("growth"), included: true },
      { label: cadenceLabel("growth"), included: true },
      { label: "Citation Inbox", included: true },
      { label: "Competitor watch", included: true },
      { label: "Email alerts", included: true },
      { label: historyLabel(PLAN_ENTITLEMENTS.growth.historyDays), included: true },
      { label: "Cancel anytime", included: true },
    ],
  },
  pro: {
    key: "pro",
    name: "Pro",
    priceMonthly: 49,
    priceLabel: "$49 / month",
    tagline:
      "Daily checks and deeper history for high-intent monitoring.",
    ctaLabel: "Choose Pro",
    teaserFeatures: [
      "30 monitored prompts",
      "ChatGPT, Gemini, Perplexity, Claude, Google AI",
      "Daily checks",
      "Multiple locations",
      "Team alert routing",
    ],
    features: [
      { label: "1 verified domain", included: true },
      { label: "30 monitored prompts", included: true },
      { label: surfacesLabel("pro"), included: true },
      { label: cadenceLabel("pro"), included: true },
      { label: "Multiple locations", included: true },
      { label: "Team alert routing", included: true },
      { label: "Citation Inbox", included: true },
      { label: "Email alerts", included: true },
      { label: "Competitor watch", included: true },
      { label: historyLabel(PLAN_ENTITLEMENTS.pro.historyDays), included: true },
      { label: "Cancel anytime", included: true },
    ],
  },
  portfolio: {
    key: "portfolio",
    name: "Portfolio",
    priceMonthly: 199,
    priceLabel: "$199 / month",
    tagline:
      "Everything in Pro for teams monitoring multiple domains from one account.",
    ctaLabel: "Choose Portfolio",
    teaserFeatures: [
      "5 verified domains",
      "50 monitored prompts",
      "Daily checks on all Pro surfaces",
      "Multiple locations",
      "Team alert routing",
    ],
    features: [
      { label: "5 verified domains included", included: true },
      { label: "50 monitored prompts per domain", included: true },
      {
        label: "Extra domains available ($39/mo each)",
        included: true,
        detail: "Purchase additional verified domain slots from billing.",
      },
      { label: surfacesLabel("portfolio"), included: true },
      { label: cadenceLabel("portfolio"), included: true },
      { label: "Multiple locations", included: true },
      { label: "Team alert routing", included: true },
      { label: "Citation Inbox", included: true },
      { label: "Email alerts", included: true },
      { label: "Competitor watch", included: true },
      { label: historyLabel(PLAN_ENTITLEMENTS.portfolio.historyDays), included: true },
      { label: "Cancel anytime", included: true },
    ],
  },
};

export const PUBLIC_PLAN_LIST = PUBLIC_PLAN_KEYS.map(
  (key) => PUBLIC_PLANS[key],
);

export const TEASER_PLAN_KEYS = [
  "founder",
  "growth",
  "pro",
  "portfolio",
] as const;

export const FOUNDER_LIMIT_NOTE = "Founder starts at $19/month.";

export type ComparisonRow = {
  feature: string;
  founder: string;
  growth: string;
  pro: string;
  portfolio: string;
};

export const PLAN_COMPARISON_ROWS: ComparisonRow[] = [
  {
    feature: "Verified domains",
    founder: String(PLAN_ENTITLEMENTS.founder.domains),
    growth: String(PLAN_ENTITLEMENTS.growth.domains),
    pro: String(PLAN_ENTITLEMENTS.pro.domains),
    portfolio: String(PLAN_ENTITLEMENTS.portfolio.domains),
  },
  {
    feature: "Monitored prompts",
    founder: String(PLAN_ENTITLEMENTS.founder.activePrompts),
    growth: String(PLAN_ENTITLEMENTS.growth.activePrompts),
    pro: String(PLAN_ENTITLEMENTS.pro.activePrompts),
    portfolio: "50 per domain",
  },
  {
    feature: "Monitoring cadence",
    founder: "Twice-weekly",
    growth: "Twice-weekly",
    pro: "Daily",
    portfolio: "Daily",
  },
  {
    feature: "Supported AI surfaces",
    founder: "ChatGPT, Gemini",
    growth: "ChatGPT, Gemini, Perplexity",
    pro: "ChatGPT, Gemini, Perplexity, Claude, Google AI",
    portfolio: "ChatGPT, Gemini, Perplexity, Claude, Google AI",
  },
  {
    feature: "Locations",
    founder: "Single",
    growth: "Single",
    pro: "Multiple",
    portfolio: "Multiple",
  },
  {
    feature: "Citation Inbox",
    founder: "Included",
    growth: "Included",
    pro: "Included",
    portfolio: "Included",
  },
  {
    feature: "Email alerts",
    founder: "Included",
    growth: "Included",
    pro: "Included",
    portfolio: "Included",
  },
  {
    feature: "Weekly digest",
    founder: "Included",
    growth: "Included",
    pro: "Included",
    portfolio: "Included",
  },
  {
    feature: "Competitor watch",
    founder: "Not included",
    growth: "Included",
    pro: "Included",
    portfolio: "Included",
  },
  {
    feature: "Citation history",
    founder: "90 days",
    growth: "1 year",
    pro: "Expanded",
    portfolio: "Expanded",
  },
  {
    feature: "Team alert routing",
    founder: "Not included",
    growth: "Not included",
    pro: "Included",
    portfolio: "Included",
  },
];

export function isPublicPlanKey(value: string | null | undefined): value is PublicPlanKey {
  return (
    value === "founder" ||
    value === "growth" ||
    value === "pro" ||
    value === "portfolio"
  );
}

export function parsePublicPlanKey(
  value: string | null | undefined,
): PublicPlanKey | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return isPublicPlanKey(normalized) ? normalized : null;
}

/** Internal free plan is never a public subscription tier. */
export function isPublicSubscriptionPlan(planKey: PlanKey): boolean {
  return isPublicPlanKey(planKey);
}
