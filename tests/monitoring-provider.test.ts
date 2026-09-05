import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { MonitoringError } from "@/lib/monitoring/errors";
import { normalizeDataForSeoLiveResponse } from "@/lib/providers/dataforseo";
import { MockCitationMonitoringProvider } from "@/lib/monitoring/providers/mock";
import { redactAndCapPayload, sanitizeCitationUrl } from "@/lib/monitoring/hash";
import type { NormalizedScanRequest } from "@/lib/monitoring/types";
import { requireCronAuthorization, secureCompare } from "@/lib/security/cron";
import { redactObject } from "@/lib/security/logger";

const fixtureDir = join(process.cwd(), "tests/fixtures/dataforseo");

function baseRequest(
  overrides: Partial<NormalizedScanRequest> = {},
): NormalizedScanRequest {
  return {
    scanRunId: "scan-1",
    workspaceId: "ws-1",
    domainId: "dom-1",
    monitoredPromptId: "prompt-1",
    monitorConfigurationId: "mc-1",
    prompt: "Best tools for AI citation monitoring",
    aiSurface: "chatgpt",
    languageCode: "en",
    countryCode: "US",
    scheduledFor: new Date("2026-07-09T12:00:00.000Z"),
    runType: "baseline",
    correlationId: "corr-1",
    ...overrides,
  };
}

describe("DataForSEO normalization", () => {
  it("normalizes citation annotations from live ChatGPT fixture", () => {
    const envelope = JSON.parse(
      readFileSync(join(fixtureDir, "chatgpt-live-citation.json"), "utf8"),
    );
    const result = normalizeDataForSeoLiveResponse({
      envelope,
      request: baseRequest(),
    });
    expect(result.provider).toBe("dataforseo");
    expect(result.responseText).toContain("Cited Test Brand");
    expect(result.citations.length).toBeGreaterThanOrEqual(2);
    expect(result.citations[0]?.hostname).toBe("cited-test.example");
    expect(result.providerCostType).toBe("actual");
    expect(result.providerCostUsd).toBeGreaterThan(0);
  });

  it("normalizes citation annotations from live Perplexity fixture", () => {
    const envelope = JSON.parse(
      readFileSync(join(fixtureDir, "perplexity-live-citation.json"), "utf8"),
    );
    const result = normalizeDataForSeoLiveResponse({
      envelope,
      request: baseRequest({ aiSurface: "perplexity" }),
    });
    expect(result.aiSurface).toBe("perplexity");
    expect(result.modelName).toBe("sonar");
    expect(result.responseText).toContain("Perplexity");
    expect(result.citations.length).toBeGreaterThanOrEqual(2);
    expect(result.citations[0]?.hostname).toBe("cited-test.example");
  });

  it("normalizes citation annotations from live Claude fixture", () => {
    const envelope = JSON.parse(
      readFileSync(join(fixtureDir, "claude-live-citation.json"), "utf8"),
    );
    const result = normalizeDataForSeoLiveResponse({
      envelope,
      request: baseRequest({ aiSurface: "claude" }),
    });
    expect(result.aiSurface).toBe("claude");
    expect(result.modelName).toBe("claude-sonnet-4-0");
    expect(result.responseText).toContain("Cited Test Brand");
    expect(result.citations.length).toBeGreaterThanOrEqual(2);
  });

  it("fails safely on empty message items", () => {
    const envelope = JSON.parse(
      readFileSync(join(fixtureDir, "chatgpt-live-malformed.json"), "utf8"),
    );
    expect(() =>
      normalizeDataForSeoLiveResponse({
        envelope,
        request: baseRequest(),
      }),
    ).toThrow(MonitoringError);
  });
});

describe("MockCitationMonitoringProvider", () => {
  it("returns labeled mock citation data", async () => {
    const provider = new MockCitationMonitoringProvider({
      fixture: "citation_exact",
    });
    const result = await provider.submitScan(baseRequest());
    expect(result.status).toBe("completed");
    if (result.status !== "completed") return;
    expect(result.result.responseText).toContain("[MOCK DATA]");
    expect(result.result.citations.length).toBeGreaterThan(0);
  });

  it("returns retryable rate limit fixture", async () => {
    const provider = new MockCitationMonitoringProvider({
      fixture: "rate_limit",
    });
    const result = await provider.submitScan(baseRequest());
    expect(result.status).toBe("failed");
    if (result.status !== "failed") return;
    expect(result.retryable).toBe(true);
    expect(result.code).toBe("provider_rate_limited");
  });

  it("supports pending poll completion", async () => {
    const provider = new MockCitationMonitoringProvider({
      fixture: "partial_result",
    });
    const submitted = await provider.submitScan(baseRequest());
    expect(submitted.status).toBe("pending");
    if (submitted.status !== "pending") return;
    const polled = await provider.pollTask!({
      providerTaskId: submitted.providerTaskId,
      request: baseRequest(),
    });
    expect(polled.status).toBe("completed");
  });
});

describe("payload safety", () => {
  it("redacts secrets and caps payload size", () => {
    const capped = redactAndCapPayload(
      {
        authorization: "secret",
        password: "x",
        nested: { api_key: "k", text: "ok" },
      },
      10_000,
    );
    const asRecord = capped.payload as Record<string, unknown>;
    expect(asRecord.authorization).toBe("[REDACTED]");
    expect(asRecord.password).toBe("[REDACTED]");
  });

  it("rejects unsafe citation URL protocols", () => {
    expect(sanitizeCitationUrl("javascript:alert(1)")).toBeNull();
    expect(sanitizeCitationUrl("data:text/html,hi")).toBeNull();
    expect(sanitizeCitationUrl("https://cited-test.example/path")).toContain(
      "cited-test.example",
    );
  });
});

describe("cron authorization", () => {
  it("rejects missing or incorrect secrets with timing-safe compare", () => {
    expect(secureCompare("abc", "abd")).toBe(false);
    expect(secureCompare("same", "same")).toBe(true);
    expect(requireCronAuthorization(null, "secret")).toBe(false);
    expect(requireCronAuthorization("Bearer wrong", "secret")).toBe(false);
    expect(requireCronAuthorization("Bearer secret", "secret")).toBe(true);
    expect(requireCronAuthorization("Bearer secret", undefined)).toBe(false);
  });
});

describe("logger redaction", () => {
  it("redacts prompts, responses, and secrets from log metadata", () => {
    const redacted = redactObject({
      promptText: "secret prompt",
      responseText: "full response",
      authorization: "Bearer xyz",
      workspaceId: "ws-1",
      scanRunId: "scan-1",
    });
    expect(redacted.promptText).toBe("[REDACTED]");
    expect(redacted.responseText).toBe("[REDACTED]");
    expect(redacted.authorization).toBe("[REDACTED]");
    expect(redacted.workspaceId).toBe("ws-1");
  });
});
