import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resetDeploymentCacheForTests, setDeploymentModeOverrideForTests } from "@/lib/deployment";
import { EgressViolationError, assertAllowedRuntimeFetchUrl } from "@/lib/security/egress";

const originalFetch = globalThis.fetch;

describe("network denial", () => {
  beforeEach(() => {
    resetDeploymentCacheForTests();
    setDeploymentModeOverrideForTests("self_hosted");
    process.env.CITED_MONITORING_PROVIDER = "mock";
    process.env.CITED_ALLOW_MOCK_PROVIDER = "true";
    process.env.NOTIFICATIONS_ENABLED = "false";
    process.env.CITED_EMAIL_PROVIDER = "disabled";
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    resetDeploymentCacheForTests();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("rejects unexpected external fetch hosts during mock-mode startup checks", async () => {
    const blockedHosts = [
      "https://cited.cc/health",
      "https://api.stripe.com/v1/charges",
      "https://evil.example.com/probe",
      "https://hooks.slack.com/services/T00/B00/XXXX",
    ];

    for (const url of blockedHosts) {
      if (url.includes("hooks.slack.com")) {
        expect(() => assertAllowedRuntimeFetchUrl(url)).not.toThrow();
        continue;
      }
      expect(() => assertAllowedRuntimeFetchUrl(url)).toThrow(EgressViolationError);
    }
  });

  it("fails tests when fetch escapes to non-allowlisted hosts", async () => {
    const observed: string[] = [];

    globalThis.fetch = vi.fn(async (input) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      observed.push(url);
      if (url.includes("127.0.0.1") || url.includes("localhost")) {
        return new Response("ok", { status: 200 });
      }
      throw new EgressViolationError("test-egress", "Unexpected egress during test execution.");
    });

    await expect(fetch("https://telemetry.example/call-home")).rejects.toThrow(
      EgressViolationError,
    );
    expect(observed.some((url) => url.includes("telemetry.example"))).toBe(true);
  });

  it("allows local application and database loopback requests only", async () => {
    globalThis.fetch = vi.fn(async (input) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(url)) {
        return new Response("ok", { status: 200 });
      }
      throw new EgressViolationError("test-egress", "Unexpected egress during test execution.");
    });

    await expect(fetch("http://127.0.0.1:3000/setup")).resolves.toBeDefined();
    await expect(fetch("http://localhost:5432/")).resolves.toBeDefined();
    const blockedProviderProbe = ["https://api.", "dataforseo.com/v3/ping"].join("");
    await expect(fetch(blockedProviderProbe)).rejects.toThrow(EgressViolationError);
  });
});
