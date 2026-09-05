import type { AiSurfaceKey } from "@/types/product";

import {
  assertMonitoringProviderSelection,
  parseSurfaceProviderMap,
  resolveDefaultMonitoringProviderId,
} from "@/lib/providers/config";
import { ProviderError } from "@/lib/providers/errors";
import type { MonitoringProvider } from "@/lib/providers/provider";
import type {
  MonitoringProviderId,
  MonitoringProviderMetadata,
} from "@/lib/providers/types";

type ProviderFactory = () => MonitoringProvider;

type RegistryEntry = Readonly<{
  metadata: MonitoringProviderMetadata;
  create: ProviderFactory;
}>;

const REGISTRY = new Map<MonitoringProviderId, RegistryEntry>();
let registryFrozen = false;
const providerInstances = new Map<MonitoringProviderId, MonitoringProvider>();

export function registerMonitoringProvider(entry: RegistryEntry): void {
  if (registryFrozen && REGISTRY.has(entry.metadata.id)) {
    return;
  }
  if (REGISTRY.has(entry.metadata.id)) {
    throw new Error(`Duplicate monitoring provider registration: ${entry.metadata.id}`);
  }
  REGISTRY.set(entry.metadata.id, Object.freeze(entry));
}

export function finalizeMonitoringProviderRegistry(): void {
  registryFrozen = true;
}

export function listMonitoringProviders(): readonly MonitoringProviderMetadata[] {
  return [...REGISTRY.values()]
    .map((entry) => entry.metadata)
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function getProviderMetadata(
  providerId: MonitoringProviderId,
): MonitoringProviderMetadata {
  const entry = REGISTRY.get(providerId);
  if (!entry) {
    throw new ProviderError({
      code: "configuration_error",
      message: `Unknown monitoring provider: ${providerId}`,
      providerId: "dataforseo",
      safeMessage: "Monitoring provider is not configured.",
    });
  }
  return entry.metadata;
}

export function getMonitoringProvider(
  providerId: MonitoringProviderId,
): MonitoringProvider {
  const selection = assertMonitoringProviderSelection(providerId);
  if ("ok" in selection && selection.ok === false) {
    throw new ProviderError({
      code: selection.code,
      message: selection.safeMessage,
      providerId,
      safeMessage: selection.safeMessage,
    });
  }

  const entry = REGISTRY.get(providerId);
  if (!entry) {
    throw new ProviderError({
      code: "configuration_error",
      message: `Unknown monitoring provider: ${providerId}`,
      providerId,
      safeMessage: "Monitoring provider is not configured.",
    });
  }

  const cached = providerInstances.get(providerId);
  if (cached) {
    return cached;
  }

  const instance = entry.create();
  providerInstances.set(providerId, instance);
  return instance;
}

export function resetMonitoringProviderRegistryForTests(): void {
  providerInstances.clear();
  REGISTRY.clear();
  registryFrozen = false;
}

export function resolveProviderForSurface(
  surface: AiSurfaceKey,
  defaultProviderId: MonitoringProviderId = resolveDefaultMonitoringProviderId(),
): MonitoringProviderId {
  const map = parseSurfaceProviderMap();
  return map[surface] ?? defaultProviderId;
}

export function assertProviderSupportsSurface(
  providerId: MonitoringProviderId,
  surface: AiSurfaceKey,
): void {
  const metadata = getProviderMetadata(providerId);
  if (!metadata.supportedSurfaces.includes(surface)) {
    throw new ProviderError({
      code: "unsupported_surface",
      message: `Provider ${providerId} does not support surface ${surface}.`,
      providerId,
    });
  }
}

export function getMonitoringProviderForSurface(
  surface: AiSurfaceKey,
): MonitoringProvider {
  const providerId = resolveProviderForSurface(surface);
  assertProviderSupportsSurface(providerId, surface);
  return getMonitoringProvider(providerId);
}
