import { toPublicCapabilities } from "@/lib/deployment/capabilities";
import type {
  DeploymentMode,
  DeploymentPublicConfig,
} from "@/lib/deployment/types";
import { DEPLOYMENT_MODES } from "@/lib/deployment/types";

/** Client-safe mirror env var name. Authoritative mode stays server-side. */
export const PUBLIC_DEPLOYMENT_MODE_ENV =
  "NEXT_PUBLIC_CITED_DEPLOYMENT_MODE" as const;

function normalizePublicMode(raw: unknown): DeploymentMode | undefined {
  if (raw === undefined || raw === null) {
    return undefined;
  }
  const normalized = String(raw).trim().toLowerCase();
  if (normalized === "cloud") {
    return undefined;
  }
  if ((DEPLOYMENT_MODES as readonly string[]).includes(normalized)) {
    return normalized as DeploymentMode;
  }
  return undefined;
}

/**
 * Client-safe deployment mode from NEXT_PUBLIC_CITED_DEPLOYMENT_MODE.
 * Community edition always resolves to self_hosted.
 */
export function getPublicDeploymentMode(
  raw: unknown = process.env[PUBLIC_DEPLOYMENT_MODE_ENV],
): DeploymentMode {
  return normalizePublicMode(raw) ?? "self_hosted";
}

/** Minimal client-safe deployment fields for providers and conditional UI. */
export function getPublicDeploymentConfig(
  overrides?: Partial<DeploymentPublicConfig>,
): DeploymentPublicConfig {
  const mode = overrides?.mode ?? getPublicDeploymentMode();
  const capabilities =
    overrides?.capabilities ?? toPublicCapabilities(mode);

  return Object.freeze({
    mode,
    isCloud: false,
    isSelfHosted: true,
    capabilities,
  });
}

/** Serialize safe public deployment fields for layout or provider injection. */
export function serializePublicDeploymentConfig(): DeploymentPublicConfig {
  return getPublicDeploymentConfig();
}
