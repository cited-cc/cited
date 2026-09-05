import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ALL_DEPLOYMENT_CAPABILITIES,
  DeploymentConfigurationError,
  getDeploymentCapabilities,
  getDeploymentMode,
  getPublicDeploymentConfig,
  getPublicDeploymentStatusForHealth,
  guardDeploymentCapabilityRoute,
  hasDeploymentCapability,
  isCapabilityAvailable,
  isCloudDeployment,
  isSelfHostedDeployment,
  listDeploymentCapabilities,
  listUnavailableCapabilities,
  parseDeploymentMode,
  requireDeploymentCapability,
  resetDeploymentCacheForTests,
  setDeploymentModeOverrideForTests,
} from "@/lib/deployment";
import {
  isCitedChatbotEnabled,
  isFreeScanEnabled,
  isHostedAnalyticsEnabled,
  isLearnDomainsEnabled,
  isStripeBillingEnabled,
} from "@/lib/config/features";
import { isIndexableDeployment } from "@/lib/seo/site";
import { isBillingReconciliationEnabled, resetEnvCacheForTests } from "@/lib/env";

function resetDeploymentTestState(): void {
  resetDeploymentCacheForTests();
  resetEnvCacheForTests();
  setDeploymentModeOverrideForTests(null);
  vi.unstubAllEnvs();
}

describe("deployment mode parsing", () => {
  beforeEach(() => {
    resetDeploymentTestState();
  });

  afterEach(() => {
    resetDeploymentTestState();
  });

  it("accepts self_hosted values", () => {
    expect(parseDeploymentMode("self_hosted")).toBe("self_hosted");
    expect(parseDeploymentMode("SELF_HOSTED")).toBe("self_hosted");
  });

  it("parses cloud as a known value but community runtime rejects it", () => {
    expect(parseDeploymentMode("cloud")).toBe("cloud");
    expect(parseDeploymentMode("hybrid")).toBeUndefined();
    expect(parseDeploymentMode("")).toBeUndefined();
    setDeploymentModeOverrideForTests("cloud");
    expect(() => getDeploymentMode()).toThrow(DeploymentConfigurationError);
  });

  it("defaults to self_hosted in development when unset", () => {
    vi.stubEnv("NODE_ENV", "development");
    setDeploymentModeOverrideForTests(undefined);
    expect(getDeploymentMode()).toBe("self_hosted");
  });

  it("defaults to self_hosted in test when unset", () => {
    setDeploymentModeOverrideForTests(undefined);
    expect(getDeploymentMode()).toBe("self_hosted");
  });

  it("fails closed in production when unset", () => {
    vi.stubEnv("NODE_ENV", "production");
    setDeploymentModeOverrideForTests(undefined);
    expect(() => getDeploymentMode()).toThrow(DeploymentConfigurationError);
  });

  it("does not leak between tests", () => {
    setDeploymentModeOverrideForTests("self_hosted");
    expect(getDeploymentMode()).toBe("self_hosted");
    resetDeploymentTestState();
    expect(getDeploymentMode()).toBe("self_hosted");
  });
});

describe("deployment capabilities", () => {
  beforeEach(() => {
    resetDeploymentTestState();
  });

  afterEach(() => {
    resetDeploymentTestState();
  });

  it("exposes core capabilities in self_hosted mode", () => {
    expect(hasDeploymentCapability("self_hosted", "monitoring")).toBe(true);
    expect(hasDeploymentCapability("self_hosted", "evidenceLedger")).toBe(true);
    expect(hasDeploymentCapability("self_hosted", "internalSchedulerEndpoints")).toBe(
      true,
    );
  });

  it("marks self-hosted authentication capabilities available", () => {
    const registry = getDeploymentCapabilities();
    expect(registry.selfHostedAuthentication.readiness).toBe("available");
    expect(registry.selfHostedBootstrap.readiness).toBe("available");
    expect(hasDeploymentCapability("self_hosted", "selfHostedAuthentication")).toBe(
      true,
    );
    expect(hasDeploymentCapability("self_hosted", "selfHostedBootstrap")).toBe(true);
    expect(registry.selfHostedEntitlements.readiness).toBe("available");
    expect(hasDeploymentCapability("self_hosted", "selfHostedEntitlements")).toBe(
      true,
    );
  });

  it("covers every declared capability", () => {
    expect(ALL_DEPLOYMENT_CAPABILITIES.length).toBeGreaterThan(10);
    for (const capability of ALL_DEPLOYMENT_CAPABILITIES) {
      expect(getDeploymentCapabilities()[capability]).toBeDefined();
    }
  });

  it("returns immutable capability definitions", () => {
    const registry = getDeploymentCapabilities();
    expect(Object.isFrozen(registry)).toBe(true);
    expect(() => {
      (registry.monitoring as { publicDescription: string }).publicDescription =
        "mutated";
    }).toThrow();
  });
});

describe("deployment guards", () => {
  beforeEach(() => {
    resetDeploymentTestState();
    setDeploymentModeOverrideForTests("self_hosted");
  });

  afterEach(() => {
    resetDeploymentTestState();
  });

  it("allows self-hosted routes in self_hosted mode", () => {
    expect(guardDeploymentCapabilityRoute("monitoring")).toBeNull();
    expect(() => requireDeploymentCapability("monitoring")).not.toThrow();
  });

  it("rejects cloud deployment mode in community edition", () => {
    setDeploymentModeOverrideForTests("cloud");
    expect(() => guardDeploymentCapabilityRoute("monitoring")).toThrow(
      DeploymentConfigurationError,
    );
    expect(() => requireDeploymentCapability("monitoring")).toThrow(
      DeploymentConfigurationError,
    );
  });
});

describe("community edition feature gates", () => {
  beforeEach(() => {
    resetDeploymentTestState();
    setDeploymentModeOverrideForTests("self_hosted");
  });

  afterEach(() => {
    resetDeploymentTestState();
  });

  it("disables cloud marketing features", () => {
    vi.stubEnv("NEXT_PUBLIC_CITED_DEPLOYMENT_MODE", "self_hosted");
    vi.stubEnv("FREE_SCAN_ENABLED", "true");
    vi.stubEnv("NEXT_PUBLIC_FREE_SCAN_ENABLED", "true");
    vi.stubEnv("NEXT_PUBLIC_CITED_CHATBOT_ENABLED", "true");
    vi.stubEnv("LEARN_DOMAINS_ENABLED", "true");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_placeholder");

    expect(isFreeScanEnabled()).toBe(false);
    expect(isCitedChatbotEnabled()).toBe(false);
    expect(isLearnDomainsEnabled()).toBe(false);
    expect(isStripeBillingEnabled()).toBe(false);
    expect(isBillingReconciliationEnabled()).toBe(false);
    expect(isHostedAnalyticsEnabled()).toBe(false);
    expect(isIndexableDeployment()).toBe(false);
  });
});

describe("public deployment config and health", () => {
  beforeEach(() => {
    resetDeploymentTestState();
  });

  afterEach(() => {
    resetDeploymentTestState();
  });

  it("mirrors NEXT_PUBLIC_CITED_DEPLOYMENT_MODE for client code", () => {
    vi.stubEnv("NEXT_PUBLIC_CITED_DEPLOYMENT_MODE", "self_hosted");
    expect(getPublicDeploymentConfig().mode).toBe("self_hosted");
  });

  it("returns only safe health fields", () => {
    setDeploymentModeOverrideForTests("self_hosted");
    const payload = getPublicDeploymentStatusForHealth();
    expect(payload).toEqual({
      status: "ok",
      deploymentMode: "self_hosted",
      version: expect.any(String),
      coreReady: true,
    });
    expect(JSON.stringify(payload)).not.toMatch(/secret|password|key/i);
  });
});

describe("self-hosted deployment listing", () => {
  beforeEach(() => {
    resetDeploymentTestState();
    setDeploymentModeOverrideForTests("self_hosted");
  });

  afterEach(() => {
    resetDeploymentTestState();
  });

  it("lists self-hosted capabilities when mode is self_hosted", () => {
    const enabled = listDeploymentCapabilities("self_hosted");
    expect(enabled).toContain("monitoring");
    expect(enabled).toContain("selfHostedAuthentication");
    expect(isCloudDeployment()).toBe(false);
    expect(isSelfHostedDeployment()).toBe(true);
    expect(isCapabilityAvailable("monitoring", "self_hosted")).toBe(true);
    expect(listUnavailableCapabilities("self_hosted").length).toBe(0);
  });
});
