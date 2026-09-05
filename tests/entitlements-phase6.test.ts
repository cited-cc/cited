import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  resetDeploymentCacheForTests,
  setDeploymentModeOverrideForTests,
} from "@/lib/deployment";
import {
  assertEntitlementSourceMatchesDeployment,
  entitlementSourceForDeployment,
  getEntitlementProvider,
  resolveWorkspaceEntitlements,
  selfHostedEntitlementProvider,
  SELF_HOSTED_UNLIMITED_SENTINEL,
} from "@/lib/entitlements";
import {
  canAddDomain,
  canRunMonitoring,
} from "@/lib/entitlements/checks";
import { resetEnvCacheForTests } from "@/lib/env";

function resetState(): void {
  resetEnvCacheForTests();
  resetDeploymentCacheForTests();
  setDeploymentModeOverrideForTests(null);
  vi.unstubAllEnvs();
}

describe("entitlement provider resolution", () => {
  beforeEach(resetState);
  afterEach(resetState);

  it("resolves configuration-backed provider in self-hosted mode", () => {
    setDeploymentModeOverrideForTests("self_hosted");
    expect(entitlementSourceForDeployment()).toBe("self_hosted");
    expect(getEntitlementProvider("self_hosted")).toBe(
      selfHostedEntitlementProvider,
    );
  });

  it("fails closed on unknown provider source", () => {
    expect(() =>
      getEntitlementProvider("unknown" as "self_hosted"),
    ).toThrow(/not available in the community edition/i);
  });

  it("fails closed when source mismatches deployment mode", () => {
    setDeploymentModeOverrideForTests("self_hosted");
    expect(() => assertEntitlementSourceMatchesDeployment("stripe")).toThrow(
      /community edition deployment/i,
    );
  });
});

describe("self-hosted entitlements", () => {
  beforeEach(resetState);
  afterEach(resetState);

  it("grants core access without Stripe variables", () => {
    setDeploymentModeOverrideForTests("self_hosted");
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET;

    const snapshot = resolveWorkspaceEntitlements({
      workspaceId: "ws_self",
      planKey: "free",
      status: "active",
    });

    expect(snapshot.source).toBe("self_hosted");
    expect(snapshot.access.canRunMonitoring).toBe(true);
    expect(snapshot.features.exportData).toBe(true);
    expect(snapshot.features.competitorWatch).toBe(true);
    expect(snapshot.limits.maxDomains).toBeNull();
  });

  it("enforces configured safety limits without upgrade language", () => {
    setDeploymentModeOverrideForTests("self_hosted");
    process.env.CITED_SELF_HOSTED_MAX_DOMAINS = "2";
    resetEnvCacheForTests();

    const snapshot = resolveWorkspaceEntitlements({
      workspaceId: "ws_self",
      planKey: "free",
      status: "active",
    });
    expect(snapshot.limits.maxDomains).toBe(2);

    const denied = canAddDomain(
      {
        workspaceId: "ws_self",
        planKey: "free",
        status: "active",
      },
      2,
    );
    expect(denied.allowed).toBe(false);
    if (!denied.allowed) {
      expect(denied.safeMessage).toMatch(/CITED_SELF_HOSTED_MAX_DOMAINS/);
      expect(denied.safeMessage).not.toMatch(/upgrade/i);
    }
  });

  it("accepts unlimited sentinel for safety limits", () => {
    setDeploymentModeOverrideForTests("self_hosted");
    process.env.CITED_SELF_HOSTED_MAX_PROMPTS = SELF_HOSTED_UNLIMITED_SENTINEL;
    resetEnvCacheForTests();

    const snapshot = resolveWorkspaceEntitlements({
      workspaceId: "ws_self",
      planKey: "free",
      status: "active",
    });
    expect(snapshot.limits.maxPrompts).toBeNull();
  });

  it("does not hide history using Cloud plan windows by default", () => {
    setDeploymentModeOverrideForTests("self_hosted");
    const snapshot = resolveWorkspaceEntitlements({
      workspaceId: "ws_self",
      planKey: "free",
      status: "active",
    });
    expect(snapshot.limits.historyDays).toBeNull();
  });

  it("allows monitoring without billing status", () => {
    setDeploymentModeOverrideForTests("self_hosted");
    const result = canRunMonitoring({
      workspaceId: "ws_self",
      planKey: "free",
      status: "active",
      billingStatus: null,
    });
    expect(result.allowed).toBe(true);
  });
});
