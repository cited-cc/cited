import "server-only";

import { getOptionalServerEnv, isMonitoringEnabled } from "@/lib/env";
import { MonitoringError } from "@/lib/monitoring/errors";
import type { CitationMonitoringProvider } from "@/lib/monitoring/provider";
import type { NormalizedScanRequest } from "@/lib/monitoring/types";
import {
  assertMonitoringProviderSelection,
  isMockProviderAllowed,
  resolveDefaultMonitoringProviderId,
} from "@/lib/providers/config";
import {
  assertProviderSupportsSurface,
  getMonitoringProvider,
  getMonitoringProviderForSurface,
} from "@/lib/providers/registry";
import type { MonitoringProviderId } from "@/lib/providers/types";
import { MockMonitoringProvider } from "@/lib/providers/mock";

import "@/lib/providers/bootstrap";

/**
 * Resolve the monitoring provider for the current environment.
 * Mock is never selected in Cited Cloud production.
 */
export function createMonitoringProvider(
  kind?: MonitoringProviderId,
): CitationMonitoringProvider {
  const requested = kind ?? resolveDefaultMonitoringProviderId();
  const selection = assertMonitoringProviderSelection(requested);
  if ("ok" in selection && selection.ok === false) {
    throw new MonitoringError({
      category: "provider_validation_error",
      message: selection.safeMessage,
      safeMessage: selection.safeMessage,
      retryable: false,
    });
  }

  if (requested === "mock" && !isMockProviderAllowed()) {
    throw new MonitoringError({
      category: "provider_validation_error",
      message: "Mock monitoring provider is not allowed in this environment.",
      safeMessage: "Monitoring provider is not configured.",
      retryable: false,
    });
  }

  if (requested === "dataforseo") {
    const env = getOptionalServerEnv();
    if (!isMonitoringEnabled(env)) {
      throw new MonitoringError({
        category: "monitoring_disabled",
        message: "MONITORING_ENABLED is false.",
        retryable: false,
      });
    }
  }

  return getMonitoringProvider(requested);
}

export function createMonitoringProviderForSurface(
  request: Pick<NormalizedScanRequest, "aiSurface">,
): CitationMonitoringProvider {
  return getMonitoringProviderForSurface(request.aiSurface);
}

/** Soft factory for tests that always allows mock. */
export function createTestMonitoringProvider(
  fixture?: ConstructorParameters<typeof MockMonitoringProvider>[0],
): CitationMonitoringProvider {
  return new MockMonitoringProvider(fixture);
}

export function assertSurfaceProviderRoute(
  aiSurface: NormalizedScanRequest["aiSurface"],
): void {
  const providerId = resolveDefaultMonitoringProviderId();
  assertProviderSupportsSurface(providerId, aiSurface);
}
