import type {
  MonitoringProviderId,
  ProviderConfigurationResult,
} from "@/lib/providers/types";
import { AI_SURFACE_KEYS, type AiSurfaceKey } from "@/types/product";

const CANONICAL_PROVIDER_ENV = "CITED_MONITORING_PROVIDER";
const LEGACY_PROVIDER_ENV = "MONITORING_PROVIDER";
const SURFACE_MAP_ENV = "CITED_SURFACE_PROVIDER_MAP";
const ALLOW_MOCK_ENV = "CITED_ALLOW_MOCK_PROVIDER";
const LEGACY_ALLOW_MOCK_ENV = "MONITORING_ALLOW_MOCK_PROVIDER";
const DEPLOYMENT_MODE_ENV = "CITED_DEPLOYMENT_MODE";

let warnedLegacyProvider = false;
let warnedLegacyAllowMock = false;

function readDeploymentModeForProviders(): "cloud" | "self_hosted" {
  const raw = process.env[DEPLOYMENT_MODE_ENV]?.trim().toLowerCase();
  if (raw === "cloud" || raw === "self_hosted") {
    return raw;
  }
  return "self_hosted";
}

function isRuntimeProductionForProviders(): boolean {
  return process.env.NODE_ENV === "production";
}

function normalizeProviderId(raw: unknown): MonitoringProviderId | undefined {
  if (raw === undefined || raw === null) {
    return undefined;
  }
  const normalized = String(raw).trim().toLowerCase();
  if (normalized === "dataforseo" || normalized === "mock") {
    return normalized;
  }
  return undefined;
}

function warnLegacyProviderOnce(): void {
  if (warnedLegacyProvider) return;
  warnedLegacyProvider = true;
  if (process.env[LEGACY_PROVIDER_ENV] && !process.env[CANONICAL_PROVIDER_ENV]) {
    console.warn(
      `[cited] ${LEGACY_PROVIDER_ENV} is deprecated. Use ${CANONICAL_PROVIDER_ENV} instead.`,
    );
  }
}

function warnLegacyAllowMockOnce(): void {
  if (warnedLegacyAllowMock) return;
  warnedLegacyAllowMock = true;
  if (process.env[LEGACY_ALLOW_MOCK_ENV] && !process.env[ALLOW_MOCK_ENV]) {
    console.warn(
      `[cited] ${LEGACY_ALLOW_MOCK_ENV} is deprecated. Use ${ALLOW_MOCK_ENV} instead.`,
    );
  }
}

export function resolveDefaultMonitoringProviderId(): MonitoringProviderId {
  warnLegacyProviderOnce();
  const canonical = normalizeProviderId(process.env[CANONICAL_PROVIDER_ENV]);
  if (canonical) {
    return canonical;
  }
  const legacy = normalizeProviderId(process.env[LEGACY_PROVIDER_ENV]);
  if (legacy) {
    return legacy;
  }
  if (process.env.NODE_ENV === "test" || process.env.NODE_ENV === "development") {
    return "mock";
  }
  return "dataforseo";
}

export function parseSurfaceProviderMap(
  raw: unknown = process.env[SURFACE_MAP_ENV],
): Partial<Record<AiSurfaceKey, MonitoringProviderId>> {
  if (!raw || typeof raw !== "string" || !raw.trim()) {
    return {};
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(
      `${SURFACE_MAP_ENV} must be a JSON object mapping surface IDs to provider IDs.`,
    );
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${SURFACE_MAP_ENV} must be a JSON object.`);
  }

  const entries = Object.entries(parsed as Record<string, unknown>);
  const seenSurfaces = new Set<string>();
  const map: Partial<Record<AiSurfaceKey, MonitoringProviderId>> = {};

  for (const [surfaceKey, providerValue] of entries) {
    if (!AI_SURFACE_KEYS.includes(surfaceKey as AiSurfaceKey)) {
      throw new Error(`${SURFACE_MAP_ENV} contains unknown surface: ${surfaceKey}`);
    }
    if (seenSurfaces.has(surfaceKey)) {
      throw new Error(`${SURFACE_MAP_ENV} contains duplicate surface: ${surfaceKey}`);
    }
    seenSurfaces.add(surfaceKey);

    const providerId = normalizeProviderId(providerValue);
    if (!providerId) {
      throw new Error(
        `${SURFACE_MAP_ENV} contains unknown provider for ${surfaceKey}.`,
      );
    }
    map[surfaceKey as AiSurfaceKey] = providerId;
  }

  return map;
}

export function isMockProviderAllowed(): boolean {
  warnLegacyAllowMockOnce();
  const allowMockRaw =
    process.env[ALLOW_MOCK_ENV] ?? process.env[LEGACY_ALLOW_MOCK_ENV];
  const allowMock = String(allowMockRaw ?? "").trim().toLowerCase();
  const explicitlyAllowed = ["1", "true", "yes", "on"].includes(allowMock);

  if (readDeploymentModeForProviders() === "cloud") {
    return false;
  }

  if (!isRuntimeProductionForProviders()) {
    return true;
  }

  return explicitlyAllowed;
}

export function assertMonitoringProviderSelection(
  providerId: MonitoringProviderId,
): ProviderConfigurationResult | { ok: true } {
  if (providerId === "mock") {
    if (readDeploymentModeForProviders() === "cloud") {
      return {
        ok: false,
        providerId,
        code: "configuration_error",
        safeMessage: "Mock monitoring provider is not allowed in Cited Cloud.",
        warnings: [],
      };
    }
    if (!isMockProviderAllowed()) {
      return {
        ok: false,
        providerId,
        code: "configuration_error",
        safeMessage:
          "Mock monitoring provider requires CITED_ALLOW_MOCK_PROVIDER=true in self-hosted production.",
        warnings: [],
      };
    }
  }

  if (
    isRuntimeProductionForProviders() &&
    providerId === "dataforseo" &&
    readDeploymentModeForProviders() === "cloud"
  ) {
    // Live provider must be explicitly configured in production cloud.
    const explicit =
      process.env[CANONICAL_PROVIDER_ENV] ?? process.env[LEGACY_PROVIDER_ENV];
    if (!explicit) {
      return {
        ok: false,
        providerId,
        code: "configuration_error",
        safeMessage:
          "CITED_MONITORING_PROVIDER must be set explicitly in production.",
        warnings: [],
      };
    }
  }

  return { ok: true };
}

export function readDeploymentModeForProviderConfig(): "cloud" | "self_hosted" {
  return readDeploymentModeForProviders();
}

export function resetProviderConfigWarningsForTests(): void {
  warnedLegacyProvider = false;
  warnedLegacyAllowMock = false;
}

export {
  ALLOW_MOCK_ENV,
  CANONICAL_PROVIDER_ENV,
  LEGACY_ALLOW_MOCK_ENV,
  LEGACY_PROVIDER_ENV,
  SURFACE_MAP_ENV,
};
