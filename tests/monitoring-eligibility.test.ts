import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  resetDeploymentCacheForTests,
  setDeploymentModeOverrideForTests,
} from "@/lib/deployment";
import { resolveMonitorEligibility } from "@/lib/monitoring/eligibility";

describe("monitor eligibility", () => {
  beforeEach(() => {
    resetDeploymentCacheForTests();
    setDeploymentModeOverrideForTests("self_hosted");
  });

  afterEach(() => {
    resetDeploymentCacheForTests();
    setDeploymentModeOverrideForTests(null);
  });
  const base = {
    workspaceId: "ws_test",
    planKey: "growth" as const,
    status: "active" as const,
    billingStatus: "active" as const,
    domainVerified: true,
    activationStatus: "active",
    aiSurface: "chatgpt" as const,
    currentActiveMonitorCount: 0,
    monthlyChecksUsed: 0,
    monthlyCheckLimit: 1000,
    providerConfigured: true,
    monitoringEnabled: true,
  };

  it("blocks unverified domains", () => {
    const result = resolveMonitorEligibility({
      ...base,
      domainVerified: false,
    });
    expect(result.eligible).toBe(false);
    expect(result.status).toBe("verification_required");
  });

  it("does not block monitoring on legacy billing status in self-hosted mode", () => {
    const result = resolveMonitorEligibility({
      ...base,
      status: "canceled",
      billingStatus: "canceled",
      currentPeriodEnd: "2020-01-01T00:00:00.000Z",
    });
    expect(result.eligible).toBe(true);
  });

  it("blocks surfaces outside the runtime allowlist", () => {
    const previous = process.env.MONITORING_ENABLED_SURFACES;
    process.env.MONITORING_ENABLED_SURFACES = "chatgpt,gemini";
    try {
      const result = resolveMonitorEligibility({
        ...base,
        aiSurface: "google_ai_overviews",
      });
      expect(result.eligible).toBe(false);
      expect(result.status).toBe("provider_blocked");
    } finally {
      if (previous === undefined) {
        delete process.env.MONITORING_ENABLED_SURFACES;
      } else {
        process.env.MONITORING_ENABLED_SURFACES = previous;
      }
    }
  });

  it("allows Google AI Overviews when enabled for an eligible workspace", () => {
    const result = resolveMonitorEligibility({
      ...base,
      planKey: "pro",
      aiSurface: "google_ai_overviews",
    });
    expect(result.eligible).toBe(true);
    expect(result.status).toBe("active");
  });

  it("blocks usage safety limit", () => {
    const result = resolveMonitorEligibility({
      ...base,
      monthlyChecksUsed: 950,
      monthlyCheckLimit: 1000,
      usageSafetyPercent: 95,
    });
    expect(result.eligible).toBe(false);
    expect(result.status).toBe("usage_limit_blocked");
  });

  it("allows eligible active monitors", () => {
    const result = resolveMonitorEligibility(base);
    expect(result.eligible).toBe(true);
    expect(result.status).toBe("active");
  });

  it("returns disabled when monitoring is off", () => {
    const result = resolveMonitorEligibility({
      ...base,
      monitoringEnabled: false,
    });
    expect(result.eligible).toBe(false);
    expect(result.status).toBe("disabled");
  });

  it("blocks persisted blocked monitors", () => {
    const result = resolveMonitorEligibility({
      ...base,
      activationStatus: "blocked",
    });
    expect(result.eligible).toBe(false);
    expect(result.status).toBe("plan_limit_blocked");
  });
});
