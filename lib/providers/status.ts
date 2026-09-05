import "server-only";

import {
  getMonitoringProvider,
  listMonitoringProviders,
  resolveProviderForSurface,
} from "@/lib/providers/registry";
import {
  isMockProviderAllowed,
  readDeploymentModeForProviderConfig,
  resolveDefaultMonitoringProviderId,
} from "@/lib/providers/config";
import { getEnabledAiSurfaces } from "@/lib/monitoring/surfaces";
import type { MonitoringProviderMetadata } from "@/lib/providers/types";

export type ProviderStatusView = Readonly<{
  selectedProviderId: ReturnType<typeof resolveDefaultMonitoringProviderId>;
  isMockMode: boolean;
  mockAllowed: boolean;
  deploymentMode: "cloud" | "self_hosted";
  configurationReady: boolean;
  configurationMessage: string;
  supportedSurfaces: ReturnType<typeof getEnabledAiSurfaces>;
  providers: readonly MonitoringProviderMetadata[];
  surfaceRoutes: Array<{
    surface: string;
    providerId: string;
    providerDisplayName: string;
  }>;
}>;

export function getProviderStatusView(): ProviderStatusView {
  const selectedProviderId = resolveDefaultMonitoringProviderId();
  const providers = listMonitoringProviders();
  const supportedSurfaces = getEnabledAiSurfaces();
  const provider = getMonitoringProvider(selectedProviderId);
  const validation = provider.validateConfiguration();
  const isMockMode = selectedProviderId === "mock";

  return Object.freeze({
    selectedProviderId,
    isMockMode,
    mockAllowed: isMockProviderAllowed(),
    deploymentMode: readDeploymentModeForProviderConfig(),
    configurationReady: validation.ok && (validation.ok ? validation.ready : false),
    configurationMessage: validation.ok
      ? validation.ready
        ? "Monitoring provider configuration looks ready."
        : "Monitoring provider credentials or settings are incomplete."
      : validation.safeMessage,
    supportedSurfaces,
    providers,
    surfaceRoutes: supportedSurfaces.map((surface) => {
      const providerId = resolveProviderForSurface(surface, selectedProviderId);
      const metadata = providers.find((entry) => entry.id === providerId);
      return {
        surface,
        providerId,
        providerDisplayName: metadata?.displayName ?? providerId,
      };
    }),
  });
}

export function getPublicProviderHealthPayload(): {
  providerReady: boolean;
  providerId: string;
  mockMode: boolean;
} {
  const selectedProviderId = resolveDefaultMonitoringProviderId();
  try {
    const provider = getMonitoringProvider(selectedProviderId);
    const validation = provider.validateConfiguration();
    return {
      providerReady: validation.ok && validation.ready,
      providerId: selectedProviderId,
      mockMode: selectedProviderId === "mock",
    };
  } catch {
    return {
      providerReady: false,
      providerId: selectedProviderId,
      mockMode: selectedProviderId === "mock",
    };
  }
}
