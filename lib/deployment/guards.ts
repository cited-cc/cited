import "server-only";

import {
  hasDeploymentCapability,
  isCapabilityAvailable,
} from "@/lib/deployment/capabilities";
import { DeploymentCapabilityError } from "@/lib/deployment/errors";
import {
  getDeploymentMode,
  isCloudDeployment,
  isSelfHostedDeployment,
} from "@/lib/deployment/mode";
import type { DeploymentCapability, DeploymentMode } from "@/lib/deployment/types";

export function requireDeploymentMode(required: DeploymentMode): void {
  const mode = getDeploymentMode();
  if (mode !== required) {
    throw new DeploymentCapabilityError({
      capability: "monitoring",
      mode,
      code: "deployment_mode_mismatch",
      message: `This operation requires deployment mode ${required}.`,
    });
  }
}

export function requireCloudDeployment(): void {
  requireDeploymentMode("cloud");
}

export function requireSelfHostedDeployment(): void {
  requireDeploymentMode("self_hosted");
}

export function requireDeploymentCapability(
  capability: DeploymentCapability,
): void {
  const mode = getDeploymentMode();
  if (!isCapabilityAvailable(capability, mode)) {
    throw new DeploymentCapabilityError({ capability, mode });
  }
}

/** @deprecated Prefer requireDeploymentCapability */
export function requireCapability(capability: DeploymentCapability): void {
  requireDeploymentCapability(capability);
}

export function assertCloudCapability(capability: DeploymentCapability): void {
  requireCloudDeployment();
  requireDeploymentCapability(capability);
}

/** Run a callback only in cloud mode. Returns undefined in self_hosted. */
export function whenCloud<T>(fn: () => T): T | undefined {
  if (!isCloudDeployment()) return undefined;
  return fn();
}

/** Run a callback only in self_hosted mode. Returns undefined in cloud. */
export function whenSelfHosted<T>(fn: () => T): T | undefined {
  if (!isSelfHostedDeployment()) return undefined;
  return fn();
}

/** Returns the result of fn when capability is available, otherwise fallback. */
export function withCapability<T>(
  capability: DeploymentCapability,
  fn: () => T,
  fallback: T,
): T {
  if (!isCapabilityAvailable(capability, getDeploymentMode())) {
    return fallback;
  }
  return fn();
}

export function isCloudCapabilityEnabled(
  capability: DeploymentCapability,
): boolean {
  return hasDeploymentCapability(getDeploymentMode(), capability);
}

export { DeploymentCapabilityError as DeploymentGuardError };
