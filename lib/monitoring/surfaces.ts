import { getPlanLimits } from "@/lib/entitlements/plan-entitlements";
import type { PlanKey } from "@/types/product";
import type { AiSurfaceKey, MonitoringFrequency } from "@/types/product";

import type { MonitoringSafetyLimits } from "@/lib/monitoring/types";

export type AiSurfaceRequestStrategy =
  | "llm_response"
  | "llm_scraper"
  | "serp_ai_overview"
  | "serp_ai_mode"
  | "unsupported";

export type AiSurfaceDefinition = {
  key: AiSurfaceKey;
  displayName: string;
  provider: "dataforseo";
  enabled: boolean;
  supportsCitations: boolean;
  supportsBrandMentions: boolean;
  supportsLocation: boolean;
  supportsScheduledMonitoring: boolean;
  requiresExperimentalFlag?: boolean;
  allowedPlans: PlanKey[];
  requestStrategy: AiSurfaceRequestStrategy;
  /** Documented DataForSEO live endpoint path when executable. */
  liveEndpointPath?: string;
  /** Default model_name for DataForSEO LLM Responses when using llm_response. */
  defaultModelName?: string;
};

const EXECUTABLE_STRATEGIES: ReadonlySet<AiSurfaceRequestStrategy> = new Set([
  "llm_response",
  "serp_ai_overview",
  "serp_ai_mode",
]);

/**
 * Central AI surface capability matrix.
 *
 * Enabled surfaces must be confirmed by official DataForSEO docs and adapter tests.
 * ChatGPT, Gemini, Perplexity, and Claude use AI Optimization LLM Responses Live.
 * Google AI Overviews and Google AI Mode use Google SERP Live Advanced.
 */
const SURFACE_DEFINITIONS: Record<AiSurfaceKey, AiSurfaceDefinition> = {
  chatgpt: {
    key: "chatgpt",
    displayName: "ChatGPT",
    provider: "dataforseo",
    enabled: true,
    supportsCitations: true,
    supportsBrandMentions: true,
    supportsLocation: true,
    supportsScheduledMonitoring: true,
    allowedPlans: ["free", "founder", "growth", "pro", "portfolio", "enterprise"],
    requestStrategy: "llm_response",
    liveEndpointPath: "/v3/ai_optimization/chat_gpt/llm_responses/live",
    defaultModelName: "gpt-4.1-mini",
  },
  gemini: {
    key: "gemini",
    displayName: "Gemini",
    provider: "dataforseo",
    enabled: true,
    supportsCitations: true,
    supportsBrandMentions: true,
    // Gemini live endpoint does not document web_search_country_iso_code / city.
    supportsLocation: false,
    supportsScheduledMonitoring: true,
    allowedPlans: ["founder", "growth", "pro", "portfolio", "enterprise"],
    requestStrategy: "llm_response",
    liveEndpointPath: "/v3/ai_optimization/gemini/llm_responses/live",
    defaultModelName: "gemini-2.5-flash",
  },
  google_ai_overviews: {
    key: "google_ai_overviews",
    displayName: "Google AI Overviews",
    provider: "dataforseo",
    enabled: true,
    supportsCitations: true,
    supportsBrandMentions: true,
    supportsLocation: true,
    supportsScheduledMonitoring: true,
    allowedPlans: ["pro", "portfolio", "enterprise"],
    requestStrategy: "serp_ai_overview",
    liveEndpointPath: "/v3/serp/google/organic/live/advanced",
  },
  google_ai_mode: {
    key: "google_ai_mode",
    displayName: "Google AI Mode",
    provider: "dataforseo",
    enabled: true,
    supportsCitations: true,
    supportsBrandMentions: true,
    supportsLocation: true,
    supportsScheduledMonitoring: true,
    allowedPlans: ["pro", "portfolio", "enterprise"],
    requestStrategy: "serp_ai_mode",
    liveEndpointPath: "/v3/serp/google/ai_mode/live/advanced",
  },
  perplexity: {
    key: "perplexity",
    displayName: "Perplexity",
    provider: "dataforseo",
    enabled: true,
    supportsCitations: true,
    supportsBrandMentions: true,
    // Perplexity live documents country ISO localization, not city.
    supportsLocation: true,
    supportsScheduledMonitoring: true,
    allowedPlans: ["growth", "pro", "portfolio", "enterprise"],
    requestStrategy: "llm_response",
    liveEndpointPath: "/v3/ai_optimization/perplexity/llm_responses/live",
    defaultModelName: "sonar",
  },
  claude: {
    key: "claude",
    displayName: "Claude",
    provider: "dataforseo",
    enabled: true,
    supportsCitations: true,
    supportsBrandMentions: true,
    supportsLocation: true,
    supportsScheduledMonitoring: true,
    allowedPlans: ["pro", "portfolio", "enterprise"],
    requestStrategy: "llm_response",
    liveEndpointPath: "/v3/ai_optimization/claude/llm_responses/live",
    defaultModelName: "claude-3-5-sonnet-latest",
  },
};

function parseEnabledSurfacesFromEnv(): Set<AiSurfaceKey> | null {
  const raw = process.env.MONITORING_ENABLED_SURFACES;
  if (!raw || !raw.trim()) {
    return null;
  }
  const keys = raw
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean) as AiSurfaceKey[];
  return new Set(keys);
}

export function getAiSurfaceDefinition(key: AiSurfaceKey): AiSurfaceDefinition {
  return SURFACE_DEFINITIONS[key];
}

export function listAiSurfaceDefinitions(): AiSurfaceDefinition[] {
  return Object.values(SURFACE_DEFINITIONS);
}

const DEFAULT_ENABLED_SURFACES: AiSurfaceKey[] = [
  "chatgpt",
  "gemini",
  "perplexity",
  "claude",
  "google_ai_overviews",
  "google_ai_mode",
];

/**
 * Runtime-enabled surfaces: definition.enabled AND allowlisted via env
 * (default all six DataForSEO-backed surfaces).
 */
export function isAiSurfaceEnabled(key: AiSurfaceKey): boolean {
  const definition = SURFACE_DEFINITIONS[key];
  if (!definition.enabled || definition.requestStrategy === "unsupported") {
    return false;
  }
  const allowlist = parseEnabledSurfacesFromEnv();
  if (!allowlist) {
    return DEFAULT_ENABLED_SURFACES.includes(key);
  }
  return allowlist.has(key);
}

export function getEnabledAiSurfaces(): AiSurfaceKey[] {
  return (Object.keys(SURFACE_DEFINITIONS) as AiSurfaceKey[]).filter((key) =>
    isAiSurfaceEnabled(key),
  );
}

export function getSelectableAiSurfacesForPlan(
  planKey: PlanKey,
): AiSurfaceKey[] {
  return getEnabledAiSurfaces().filter((key) => {
    const definition = SURFACE_DEFINITIONS[key];
    return definition.allowedPlans.includes(planKey);
  });
}

export function assertSurfaceExecutable(key: AiSurfaceKey): void {
  if (!isAiSurfaceEnabled(key)) {
    throw new Error(`AI surface is not available for monitoring: ${key}`);
  }
  const definition = SURFACE_DEFINITIONS[key];
  if (
    !EXECUTABLE_STRATEGIES.has(definition.requestStrategy) ||
    !definition.liveEndpointPath
  ) {
    throw new Error(`AI surface has no executable request strategy: ${key}`);
  }
}

export function isSerpSurfaceStrategy(
  strategy: AiSurfaceRequestStrategy,
): boolean {
  return strategy === "serp_ai_overview" || strategy === "serp_ai_mode";
}

const CONSECUTIVE_FAILURE_THRESHOLDS: Record<PlanKey, number> = {
  free: 5,
  founder: 5,
  growth: 5,
  pro: 8,
  portfolio: 8,
  enterprise: 10,
};

export function getMonitoringSafetyLimits(
  planKey: PlanKey,
): MonitoringSafetyLimits {
  const limits = getPlanLimits(planKey);
  return {
    maxActiveMonitorConfigurations: limits.maxActiveMonitorConfigurations,
    maxMonthlyMonitorChecks: limits.maxMonthlyMonitorChecks,
    maxBaselineChecksPerActivation: limits.maxBaselineChecksPerActivation,
    maxConcurrentRunsPerWorkspace: limits.maxConcurrentRunsPerWorkspace,
    maxConsecutiveFailuresBeforeBlock:
      CONSECUTIVE_FAILURE_THRESHOLDS[planKey],
  };
}

/** Scheduled monitor checks per month for a cadence. */
export function cadenceChecksPerMonth(
  cadence: MonitoringFrequency | string,
): number {
  switch (cadence) {
    case "daily":
      return 30;
    case "twice_weekly":
      return 8;
    case "weekly":
      return 4;
    case "manual":
    default:
      return 0;
  }
}

/** Approximate checks per month for cadence × prompt × surface validation. */
export function estimateMonthlyChecks(input: {
  promptCount: number;
  surfaceCount: number;
  cadence: "twice_weekly" | "weekly" | "daily" | "manual";
}): number {
  return (
    input.promptCount *
    input.surfaceCount *
    cadenceChecksPerMonth(input.cadence)
  );
}

/** Sum scheduled checks across concrete monitor configurations. */
export function estimateMonthlyChecksForConfigurations(
  configs: Array<{ scan_frequency?: string | null }>,
  fallbackCadence: MonitoringFrequency,
): number {
  return configs.reduce(
    (sum, config) =>
      sum +
      cadenceChecksPerMonth(
        (config.scan_frequency as MonitoringFrequency) || fallbackCadence,
      ),
    0,
  );
}
