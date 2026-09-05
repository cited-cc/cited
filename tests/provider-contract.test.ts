import { readFileSync } from "node:fs";
import { join } from "node:path";

import { beforeEach, describe, expect, it } from "vitest";

import {
  getMonitoringProvider,
  listMonitoringProviders,
  resetMonitoringProviderRegistryForTests,
} from "@/lib/providers/registry";
import {
  resetMonitoringProviderBootstrapForTests,
  ensureMonitoringProviderRegistry,
} from "@/lib/providers/bootstrap";
import type { NormalizedScanRequest } from "@/lib/monitoring/types";
import { AI_SURFACE_KEYS } from "@/types/product";
import { ProviderError } from "@/lib/providers/errors";

function baseRequest(
  overrides: Partial<NormalizedScanRequest> = {},
): NormalizedScanRequest {
  return {
    scanRunId: "scan-contract-1",
    workspaceId: "ws-contract-1",
    domainId: "dom-contract-1",
    monitoredPromptId: "prompt-contract-1",
    monitorConfigurationId: "mc-contract-1",
    prompt: "Best fictional tools for AI citation monitoring",
    aiSurface: "chatgpt",
    languageCode: "en",
    countryCode: "US",
    scheduledFor: new Date("2026-09-04T12:00:00.000Z"),
    runType: "baseline",
    correlationId: "corr-contract-1",
    ...overrides,
  };
}

describe("monitoring provider contract", () => {
  beforeEach(() => {
    resetMonitoringProviderRegistryForTests();
    resetMonitoringProviderBootstrapForTests();
    ensureMonitoringProviderRegistry();
  });

  it("registers deterministic provider metadata", () => {
    const providers = listMonitoringProviders();
    expect(providers.map((entry) => entry.id)).toEqual(["dataforseo", "mock"]);
    for (const provider of providers) {
      expect(provider.displayName.length).toBeGreaterThan(0);
      expect(provider.adapterVersion.length).toBeGreaterThan(0);
      expect(provider.supportedSurfaces.length).toBeGreaterThan(0);
      expect(Object.isFrozen(provider)).toBe(true);
    }
  });

  for (const providerId of ["dataforseo", "mock"] as const) {
    it(`${providerId} validates configuration offline`, () => {
      const provider = getMonitoringProvider(providerId);
      const validation = provider.validateConfiguration();
      expect(validation.providerId).toBe(providerId);
      expect(validation.ok).toBeTypeOf("boolean");
    });
  }

  it("mock provider supports every public surface deterministically", async () => {
    const provider = getMonitoringProvider("mock");
    for (const surface of AI_SURFACE_KEYS) {
      const result = await provider.submitScan(baseRequest({ aiSurface: surface }));
      expect(result.status).toBe("completed");
      if (result.status !== "completed") continue;
      expect(result.result.responseText).toContain("[MOCK DATA]");
      expect(result.result.aiSurface).toBe(surface);
      expect(result.result.provider).toBe("mock");
    }
  });

  it("mock provider rejects unsupported combinations only at routing layer", async () => {
    const provider = getMonitoringProvider("mock");
    expect(provider.metadata.supportedSurfaces).toEqual(AI_SURFACE_KEYS);
  });

  it("mock provider simulates pending polling", async () => {
    const { MockMonitoringProvider } = await import("@/lib/providers/mock");
    const provider = new MockMonitoringProvider({ fixture: "partial_result" });
    const submitted = await provider.submitScan(baseRequest());
    expect(submitted.status).toBe("pending");
    if (submitted.status !== "pending") return;
    const polled = await provider.pollTask!({
      providerTaskId: submitted.providerTaskId,
      request: baseRequest(),
    });
    expect(polled.status).toBe("completed");
  });

  it("provider errors never include credential patterns", () => {
    const error = new ProviderError({
      code: "authentication_failure",
      message: "Internal auth failure",
      providerId: "dataforseo",
      safeMessage: "The monitoring provider rejected the configured credentials.",
    });
    expect(error.safeMessage).not.toMatch(/password/i);
    expect(error.message).not.toMatch(/Basic /);
  });

  it("dataforseo adapter import remains server-only", () => {
    const source = readFileSync(
      join(process.cwd(), "lib/providers/dataforseo/client.ts"),
      "utf8",
    );
    expect(source).toMatch(/server-only/);
  });
});
