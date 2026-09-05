import "server-only";

import { getOptionalServerEnv } from "@/lib/env";

/** Documented unlimited sentinel for administrator configuration. */
export const SELF_HOSTED_UNLIMITED_SENTINEL = "unlimited" as const;

/** Reject limits above this to avoid unsafe integer behavior. */
export const SELF_HOSTED_MAX_SAFE_LIMIT = 1_000_000;

export type SelfHostedSafetyLimits = Readonly<{
  maxUsers: number | null;
  maxDomains: number | null;
  maxMonitors: number | null;
  maxPrompts: number | null;
  historyDays: number | null;
}>;

export type SelfHostedLimitEnvKey =
  | "CITED_SELF_HOSTED_MAX_USERS"
  | "CITED_SELF_HOSTED_MAX_DOMAINS"
  | "CITED_SELF_HOSTED_MAX_MONITORS"
  | "CITED_SELF_HOSTED_MAX_PROMPTS"
  | "CITED_SELF_HOSTED_HISTORY_DAYS";

function parseSelfHostedLimitValue(
  raw: string | undefined,
  envKey: SelfHostedLimitEnvKey,
): number | null {
  if (raw === undefined || raw.trim() === "") {
    return null;
  }

  const normalized = raw.trim().toLowerCase();
  if (normalized === SELF_HOSTED_UNLIMITED_SENTINEL) {
    return null;
  }

  const parsed = Number.parseInt(normalized, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(
      `${envKey} must be a positive integer or "${SELF_HOSTED_UNLIMITED_SENTINEL}".`,
    );
  }

  if (parsed > SELF_HOSTED_MAX_SAFE_LIMIT) {
    throw new Error(
      `${envKey} exceeds the maximum supported value (${SELF_HOSTED_MAX_SAFE_LIMIT}).`,
    );
  }

  return parsed;
}

/**
 * Parse optional self-hosted safety limits from environment variables.
 * Defaults are unlimited (null). Invalid values fail closed at parse time.
 */
export function getSelfHostedSafetyLimits(): SelfHostedSafetyLimits {
  const env = getOptionalServerEnv();

  try {
    return Object.freeze({
      maxUsers: parseSelfHostedLimitValue(
        env.CITED_SELF_HOSTED_MAX_USERS,
        "CITED_SELF_HOSTED_MAX_USERS",
      ),
      maxDomains: parseSelfHostedLimitValue(
        env.CITED_SELF_HOSTED_MAX_DOMAINS,
        "CITED_SELF_HOSTED_MAX_DOMAINS",
      ),
      maxMonitors: parseSelfHostedLimitValue(
        env.CITED_SELF_HOSTED_MAX_MONITORS,
        "CITED_SELF_HOSTED_MAX_MONITORS",
      ),
      maxPrompts: parseSelfHostedLimitValue(
        env.CITED_SELF_HOSTED_MAX_PROMPTS,
        "CITED_SELF_HOSTED_MAX_PROMPTS",
      ),
      historyDays: parseSelfHostedLimitValue(
        env.CITED_SELF_HOSTED_HISTORY_DAYS,
        "CITED_SELF_HOSTED_HISTORY_DAYS",
      ),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid self-hosted limit configuration.";
    throw new Error(message);
  }
}

export function formatSelfHostedLimitLabel(value: number | null): string {
  return value === null ? "Unlimited" : String(value);
}

export const SELF_HOSTED_LIMIT_ENV_KEYS: readonly SelfHostedLimitEnvKey[] =
  Object.freeze([
    "CITED_SELF_HOSTED_MAX_USERS",
    "CITED_SELF_HOSTED_MAX_DOMAINS",
    "CITED_SELF_HOSTED_MAX_MONITORS",
    "CITED_SELF_HOSTED_MAX_PROMPTS",
    "CITED_SELF_HOSTED_HISTORY_DAYS",
  ]);
