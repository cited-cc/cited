import type { MonitoringFrequency, PlanKey } from "@/types/product";
import type { AiSurfaceKey } from "@/types/product";

/**
 * Typed plan limits. Prefer these over parsing marketing copy.
 */
export type PlanLimits = {
  maxDomains: number;
  maxPrompts: number;
  maxMembers: number;
  maxActiveMonitorConfigurations: number;
  maxMonthlyMonitorChecks: number;
  maxBaselineChecksPerActivation: number;
  maxConcurrentRunsPerWorkspace: number;
  historyDays: number | null;
  includedAiSurfaces: AiSurfaceKey[];
  monitoringCadence: "manual" | "twice_weekly" | "daily";
  supportsMultipleLocations: boolean;
  maxLocations: number;
};

export type PlanFeatures = {
  emailAlerts: boolean;
  weeklyDigest: boolean;
  slackAlerts: boolean;
  competitorWatch: boolean;
  missedOpportunityAlerts: boolean;
  recurringCitationAlerts: boolean;
  notebook: boolean;
  annotations: boolean;
  teamMembers: boolean;
  exportData: boolean;
};

/**
 * Typed plan entitlements. Prefer these booleans and numeric limits
 * over parsing marketing copy.
 */
export type PlanEntitlements = {
  planKey: PlanKey;
  limits: PlanLimits;
  features: PlanFeatures;
  /** Preferred Phase 4 names */
  maxDomains: number;
  maxPrompts: number;
  maxMembers: number;
  monitoringCadence: "twice_weekly" | "daily" | "manual";
  includedAiSurfaces: AiSurfaceKey[];
  supportsCompetitorWatch: boolean;
  supportsSlackAlerts: boolean;
  supportsMultipleLocations: boolean;
  historyDays: number | null;
  /** Backward-compatible aliases used across the codebase */
  domains: number;
  activePrompts: number;
  activeMonitors: number;
  monthlyScans: number | null;
  teamMembers: number;
  notebookEntries: number | null;
  allowedFrequencies: MonitoringFrequency[];
  allowedSurfaces: AiSurfaceKey[];
  competitorWatch: boolean;
  emailAlerts: boolean;
  slackAlerts: boolean;
  multipleLocations: boolean;
  teamAlerts: boolean;
};

function buildEntitlements(input: {
  planKey: PlanKey;
  maxDomains: number;
  maxPrompts: number;
  maxMembers: number;
  monitoringCadence: "twice_weekly" | "daily" | "manual";
  includedAiSurfaces: AiSurfaceKey[];
  supportsCompetitorWatch: boolean;
  supportsSlackAlerts: boolean;
  supportsMultipleLocations: boolean;
  maxLocations: number;
  historyDays: number | null;
  activeMonitors: number;
  monthlyScans: number;
  maxBaselineChecksPerActivation: number;
  maxConcurrentRunsPerWorkspace: number;
  notebookEntries: number | null;
  allowedFrequencies: MonitoringFrequency[];
  emailAlerts: boolean;
  weeklyDigest: boolean;
  missedOpportunityAlerts: boolean;
  recurringCitationAlerts: boolean;
  notebook: boolean;
  annotations: boolean;
  exportData: boolean;
  teamAlerts: boolean;
}): PlanEntitlements {
  const limits: PlanLimits = {
    maxDomains: input.maxDomains,
    maxPrompts: input.maxPrompts,
    maxMembers: input.maxMembers,
    maxActiveMonitorConfigurations: input.activeMonitors,
    maxMonthlyMonitorChecks: input.monthlyScans,
    maxBaselineChecksPerActivation: input.maxBaselineChecksPerActivation,
    maxConcurrentRunsPerWorkspace: input.maxConcurrentRunsPerWorkspace,
    historyDays: input.historyDays,
    includedAiSurfaces: input.includedAiSurfaces,
    monitoringCadence: input.monitoringCadence,
    supportsMultipleLocations: input.supportsMultipleLocations,
    maxLocations: input.maxLocations,
  };

  const features: PlanFeatures = {
    emailAlerts: input.emailAlerts,
    weeklyDigest: input.weeklyDigest,
    slackAlerts: input.supportsSlackAlerts,
    competitorWatch: input.supportsCompetitorWatch,
    missedOpportunityAlerts: input.missedOpportunityAlerts,
    recurringCitationAlerts: input.recurringCitationAlerts,
    notebook: input.notebook,
    annotations: input.annotations,
    teamMembers: input.maxMembers > 1,
    exportData: input.exportData,
  };

  return {
    planKey: input.planKey,
    limits,
    features,
    maxDomains: input.maxDomains,
    maxPrompts: input.maxPrompts,
    maxMembers: input.maxMembers,
    monitoringCadence: input.monitoringCadence,
    includedAiSurfaces: input.includedAiSurfaces,
    supportsCompetitorWatch: input.supportsCompetitorWatch,
    supportsSlackAlerts: input.supportsSlackAlerts,
    supportsMultipleLocations: input.supportsMultipleLocations,
    historyDays: input.historyDays,
    domains: input.maxDomains,
    activePrompts: input.maxPrompts,
    activeMonitors: input.activeMonitors,
    monthlyScans: input.monthlyScans,
    teamMembers: input.maxMembers,
    notebookEntries: input.notebookEntries,
    allowedFrequencies: input.allowedFrequencies,
    allowedSurfaces: input.includedAiSurfaces,
    competitorWatch: input.supportsCompetitorWatch,
    emailAlerts: input.emailAlerts,
    slackAlerts: input.supportsSlackAlerts,
    multipleLocations: input.supportsMultipleLocations,
    teamAlerts: input.teamAlerts,
  };
}

/**
 * Entitlement configuration lives in application code.
 * Stripe price IDs live in environment configuration, not here.
 *
 * Email alerts and weekly digest are included on paid plans.
 */
export const PLAN_ENTITLEMENTS: Record<PlanKey, PlanEntitlements> = {
  free: buildEntitlements({
    planKey: "free",
    maxDomains: 1,
    maxPrompts: 3,
    maxMembers: 1,
    monitoringCadence: "manual",
    includedAiSurfaces: ["chatgpt"],
    supportsCompetitorWatch: false,
    supportsSlackAlerts: false,
    supportsMultipleLocations: false,
    maxLocations: 1,
    historyDays: 14,
    activeMonitors: 3,
    monthlyScans: 10,
    maxBaselineChecksPerActivation: 3,
    maxConcurrentRunsPerWorkspace: 1,
    notebookEntries: 25,
    allowedFrequencies: ["manual"],
    emailAlerts: false,
    weeklyDigest: false,
    missedOpportunityAlerts: false,
    recurringCitationAlerts: false,
    notebook: false,
    annotations: false,
    exportData: false,
    teamAlerts: false,
  }),
  founder: buildEntitlements({
    planKey: "founder",
    maxDomains: 1,
    maxPrompts: 10,
    maxMembers: 1,
    monitoringCadence: "twice_weekly",
    includedAiSurfaces: ["chatgpt", "gemini"],
    supportsCompetitorWatch: false,
    supportsSlackAlerts: false,
    supportsMultipleLocations: false,
    maxLocations: 1,
    historyDays: 90,
    activeMonitors: 20,
    monthlyScans: 160,
    maxBaselineChecksPerActivation: 20,
    maxConcurrentRunsPerWorkspace: 2,
    notebookEntries: 200,
    allowedFrequencies: ["manual", "twice_weekly", "weekly"],
    emailAlerts: true,
    weeklyDigest: true,
    missedOpportunityAlerts: false,
    recurringCitationAlerts: false,
    notebook: true,
    annotations: true,
    exportData: true,
    teamAlerts: false,
  }),
  growth: buildEntitlements({
    planKey: "growth",
    maxDomains: 1,
    maxPrompts: 25,
    maxMembers: 3,
    monitoringCadence: "twice_weekly",
    includedAiSurfaces: ["chatgpt", "gemini", "perplexity"],
    supportsCompetitorWatch: true,
    supportsSlackAlerts: false,
    supportsMultipleLocations: false,
    maxLocations: 1,
    historyDays: 365,
    activeMonitors: 50,
    monthlyScans: 400,
    maxBaselineChecksPerActivation: 50,
    maxConcurrentRunsPerWorkspace: 3,
    notebookEntries: 1000,
    allowedFrequencies: ["manual", "twice_weekly", "weekly"],
    emailAlerts: true,
    weeklyDigest: true,
    missedOpportunityAlerts: true,
    recurringCitationAlerts: false,
    notebook: true,
    annotations: true,
    exportData: true,
    teamAlerts: false,
  }),
  pro: buildEntitlements({
    planKey: "pro",
    maxDomains: 1,
    maxPrompts: 30,
    maxMembers: 5,
    monitoringCadence: "daily",
    includedAiSurfaces: [
      "chatgpt",
      "gemini",
      "perplexity",
      "claude",
      "google_ai_overviews",
      "google_ai_mode",
    ],
    supportsCompetitorWatch: true,
    supportsSlackAlerts: false,
    supportsMultipleLocations: true,
    maxLocations: 5,
    historyDays: null,
    activeMonitors: 90,
    monthlyScans: 2700,
    maxBaselineChecksPerActivation: 90,
    maxConcurrentRunsPerWorkspace: 5,
    notebookEntries: null,
    allowedFrequencies: ["manual", "twice_weekly", "weekly", "daily"],
    emailAlerts: true,
    weeklyDigest: true,
    missedOpportunityAlerts: true,
    recurringCitationAlerts: true,
    notebook: true,
    annotations: true,
    exportData: true,
    teamAlerts: true,
  }),
  portfolio: buildEntitlements({
    planKey: "portfolio",
    maxDomains: 5,
    maxPrompts: 50,
    maxMembers: 5,
    monitoringCadence: "daily",
    includedAiSurfaces: [
      "chatgpt",
      "gemini",
      "perplexity",
      "claude",
      "google_ai_overviews",
      "google_ai_mode",
    ],
    supportsCompetitorWatch: true,
    supportsSlackAlerts: false,
    supportsMultipleLocations: true,
    maxLocations: 5,
    historyDays: null,
    activeMonitors: 150,
    monthlyScans: 13_500,
    maxBaselineChecksPerActivation: 150,
    maxConcurrentRunsPerWorkspace: 8,
    notebookEntries: null,
    allowedFrequencies: ["manual", "twice_weekly", "weekly", "daily"],
    emailAlerts: true,
    weeklyDigest: true,
    missedOpportunityAlerts: true,
    recurringCitationAlerts: true,
    notebook: true,
    annotations: true,
    exportData: true,
    teamAlerts: true,
  }),
  enterprise: buildEntitlements({
    planKey: "enterprise",
    maxDomains: 10,
    maxPrompts: 500,
    maxMembers: 100,
    monitoringCadence: "daily",
    includedAiSurfaces: [
      "chatgpt",
      "gemini",
      "perplexity",
      "claude",
      "google_ai_overviews",
      "google_ai_mode",
    ],
    supportsCompetitorWatch: true,
    supportsSlackAlerts: false,
    supportsMultipleLocations: true,
    maxLocations: 50,
    historyDays: null,
    activeMonitors: 2000,
    monthlyScans: 10_000,
    maxBaselineChecksPerActivation: 500,
    maxConcurrentRunsPerWorkspace: 20,
    notebookEntries: null,
    allowedFrequencies: ["manual", "twice_weekly", "weekly", "daily"],
    emailAlerts: true,
    weeklyDigest: true,
    missedOpportunityAlerts: true,
    recurringCitationAlerts: true,
    notebook: true,
    annotations: true,
    exportData: true,
    teamAlerts: true,
  }),
};

export function getPlanEntitlements(planKey: PlanKey): PlanEntitlements {
  return PLAN_ENTITLEMENTS[planKey];
}

export function getPlanLimits(planKey: PlanKey): PlanLimits {
  return PLAN_ENTITLEMENTS[planKey].limits;
}

export function getPlanFeatures(planKey: PlanKey): PlanFeatures {
  return PLAN_ENTITLEMENTS[planKey].features;
}

export function canUseFrequency(
  planKey: PlanKey,
  frequency: MonitoringFrequency,
): boolean {
  return getPlanEntitlements(planKey).allowedFrequencies.includes(frequency);
}

export function canUseSurface(
  planKey: PlanKey,
  surface: AiSurfaceKey,
): boolean {
  return getPlanEntitlements(planKey).allowedSurfaces.includes(surface);
}

export function isWithinLimit(
  usage: number,
  limit: number | null,
): boolean {
  if (limit === null) {
    return true;
  }
  return usage < limit;
}
