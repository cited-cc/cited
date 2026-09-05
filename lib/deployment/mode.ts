import "server-only";

import {
  readDeploymentModeRawForResolution,
  setDeploymentModeOverrideForTests,
} from "@/lib/deployment/config";
import { DeploymentConfigurationError } from "@/lib/deployment/errors";
import type { DeploymentMode, RuntimeEnvironment } from "@/lib/deployment/types";
import { DEPLOYMENT_MODES } from "@/lib/deployment/types";

const DEV_DEFAULT_MODE: DeploymentMode = "self_hosted";

let cachedDeploymentMode: DeploymentMode | null = null;
let developmentDefaultWarningEmitted = false;

function normalizeDeploymentMode(raw: unknown): DeploymentMode | undefined {
  if (raw === undefined || raw === null) {
    return undefined;
  }
  const normalized = String(raw).trim().toLowerCase();
  if (normalized === "") {
    return undefined;
  }
  if ((DEPLOYMENT_MODES as readonly string[]).includes(normalized)) {
    return normalized as DeploymentMode;
  }
  return undefined;
}

/**
 * Parse deployment mode from an explicit value.
 * Returns undefined when unset or invalid.
 */
export function parseDeploymentMode(raw: unknown): DeploymentMode | undefined {
  return normalizeDeploymentMode(raw);
}

function getRuntimeEnvironmentInternal(): RuntimeEnvironment {
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv === "test") return "test";
  if (nodeEnv === "production") return "production";
  return "development";
}

function resolveDeploymentModeUncached(raw: unknown): DeploymentMode {
  const parsed = parseDeploymentMode(raw);
  if (parsed === "cloud") {
    throw new DeploymentConfigurationError(
      "deployment_mode_invalid",
      "CITED_DEPLOYMENT_MODE=cloud is not available in the community edition. Use self_hosted or visit https://cited.cc for managed hosting.",
      "cloud",
    );
  }
  if (parsed === "self_hosted") {
    return parsed;
  }

  const runtime = getRuntimeEnvironmentInternal();
  const rawString =
    raw === undefined || raw === null ? undefined : String(raw).trim();

  if (runtime === "production") {
    if (!rawString) {
      throw new DeploymentConfigurationError(
        "deployment_mode_missing",
        "CITED_DEPLOYMENT_MODE must be set explicitly in production. Accepted value: self_hosted.",
      );
    }
    throw new DeploymentConfigurationError(
      "deployment_mode_invalid",
      `CITED_DEPLOYMENT_MODE must be self_hosted in the community edition. Received an invalid value.`,
      rawString,
    );
  }

  if (!developmentDefaultWarningEmitted && runtime === "development") {
    developmentDefaultWarningEmitted = true;
    console.warn(
      "[cited] CITED_DEPLOYMENT_MODE is unset; defaulting to self_hosted for local development.",
    );
  }

  return DEV_DEFAULT_MODE;
}

/**
 * Resolve the authoritative deployment mode for server-side code.
 * Lazy: no production validation at module import time.
 */
export function getDeploymentMode(): DeploymentMode {
  if (cachedDeploymentMode) {
    return cachedDeploymentMode;
  }

  cachedDeploymentMode = resolveDeploymentModeUncached(
    readDeploymentModeRawForResolution(),
  );
  return cachedDeploymentMode;
}

export function isCloudDeployment(
  mode: DeploymentMode = getDeploymentMode(),
): boolean {
  return mode === "cloud";
}

export function isSelfHostedDeployment(
  mode: DeploymentMode = getDeploymentMode(),
): boolean {
  return mode === "self_hosted";
}

/** Runtime environment from NODE_ENV. Not a deployment-mode substitute. */
export function getRuntimeEnvironment(): RuntimeEnvironment {
  return getRuntimeEnvironmentInternal();
}

export function isRuntimeProduction(): boolean {
  return getRuntimeEnvironment() === "production";
}

export function resetDeploymentCacheForTests(): void {
  cachedDeploymentMode = null;
  developmentDefaultWarningEmitted = false;
  setDeploymentModeOverrideForTests(null);
}
