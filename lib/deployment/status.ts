import "server-only";

import {
  listDeploymentCapabilities,
  listUnavailableCapabilities,
  toPublicCapabilities,
} from "@/lib/deployment/capabilities";
import { getDeploymentMode } from "@/lib/deployment/mode";
import type { DeploymentStatusPayload } from "@/lib/deployment/types";

function resolvePublicVersion(): string {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA?.trim();
  if (sha) {
    return sha.slice(0, 7);
  }
  return process.env.npm_package_version ?? "dev";
}

export function getDeploymentStatusPayload(): DeploymentStatusPayload {
  const mode = getDeploymentMode();
  const enabledCapabilities = listDeploymentCapabilities(mode);
  const disabledCapabilities = listUnavailableCapabilities(mode);
  const coreReady = [
    "monitoring",
    "evidenceLedger",
    "inbox",
    "notebook",
    "domainVerification",
    "basicExport",
  ].every((capability) => enabledCapabilities.includes(capability as never));

  return Object.freeze({
    mode,
    version: resolvePublicVersion(),
    coreReady,
    enabledCapabilities,
    disabledCapabilities,
    configurationReady: true,
  });
}

export function getPublicDeploymentStatusForHealth(): {
  status: "ok";
  deploymentMode: DeploymentStatusPayload["mode"];
  version: string;
  coreReady: boolean;
} {
  const payload = getDeploymentStatusPayload();
  return {
    status: "ok",
    deploymentMode: payload.mode,
    version: payload.version,
    coreReady: payload.coreReady,
  };
}

export function getAuthenticatedDeploymentStatusView(): {
  mode: DeploymentStatusPayload["mode"];
  version: string;
  enabledCapabilities: DeploymentStatusPayload["enabledCapabilities"];
  disabledCapabilities: DeploymentStatusPayload["disabledCapabilities"];
  configurationReady: boolean;
  publicCapabilities: ReturnType<typeof toPublicCapabilities>;
} {
  const payload = getDeploymentStatusPayload();
  return {
    mode: payload.mode,
    version: payload.version,
    enabledCapabilities: payload.enabledCapabilities,
    disabledCapabilities: payload.disabledCapabilities,
    configurationReady: payload.configurationReady,
    publicCapabilities: toPublicCapabilities(payload.mode),
  };
}
