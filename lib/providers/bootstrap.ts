import { registerMonitoringProvider, finalizeMonitoringProviderRegistry } from "@/lib/providers/registry";
import { DATAFORSEO_PROVIDER_METADATA } from "@/lib/providers/dataforseo/metadata";
import { DataForSeoMonitoringProvider } from "@/lib/providers/dataforseo/client";
import { MOCK_PROVIDER_METADATA } from "@/lib/providers/mock/metadata";
import { MockMonitoringProvider } from "@/lib/providers/mock";

let bootstrapped = false;

export function ensureMonitoringProviderRegistry(): void {
  if (bootstrapped) {
    return;
  }

  registerMonitoringProvider({
    metadata: DATAFORSEO_PROVIDER_METADATA,
    create: () => new DataForSeoMonitoringProvider(),
  });

  registerMonitoringProvider({
    metadata: MOCK_PROVIDER_METADATA,
    create: () => new MockMonitoringProvider(),
  });

  finalizeMonitoringProviderRegistry();
  bootstrapped = true;
}

export function resetMonitoringProviderBootstrapForTests(): void {
  bootstrapped = false;
}

ensureMonitoringProviderRegistry();
