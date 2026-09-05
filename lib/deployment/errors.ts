import "server-only";

import type {
  DeploymentCapability,
  DeploymentCapabilityErrorCode,
  DeploymentConfigurationErrorCode,
  DeploymentMode,
} from "@/lib/deployment/types";

export class DeploymentConfigurationError extends Error {
  readonly code: DeploymentConfigurationErrorCode;
  readonly modeRaw: string | undefined;

  constructor(
    code: DeploymentConfigurationErrorCode,
    message: string,
    modeRaw?: string,
  ) {
    super(message);
    this.name = "DeploymentConfigurationError";
    this.code = code;
    this.modeRaw = modeRaw;
  }
}

export class DeploymentCapabilityError extends Error {
  readonly code: DeploymentCapabilityErrorCode;
  readonly capability: DeploymentCapability;
  readonly mode: DeploymentMode;

  constructor(options: {
    capability: DeploymentCapability;
    mode: DeploymentMode;
    code?: DeploymentCapabilityErrorCode;
    message?: string;
  }) {
    const message =
      options.message ??
      `Capability "${options.capability}" is not available in this deployment.`;
    super(message);
    this.name = "DeploymentCapabilityError";
    this.code = options.code ?? "capability_unavailable";
    this.capability = options.capability;
    this.mode = options.mode;
  }

  toPublicPayload(): {
    error: string;
    code: DeploymentCapabilityErrorCode;
  } {
    return {
      error: "This feature is not available in this deployment.",
      code: this.code,
    };
  }
}
