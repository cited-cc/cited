import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import type { NormalizedScanRequest } from "@/lib/monitoring/types";
import { resolveDataForSeoLocationCode } from "@/lib/providers/dataforseo/locations";
import { normalizeDataForSeoSerpResponse } from "@/lib/providers/dataforseo/normalize-serp";
import { getDataForSeoLiveEndpoint } from "@/lib/providers/dataforseo/surfaces";
import { buildDataForSeoSerpTask } from "@/lib/providers/dataforseo/serp-tasks";

const fixtureDir = join(process.cwd(), "tests/fixtures/dataforseo");

function baseRequest(
  overrides: Partial<NormalizedScanRequest> = {},
): NormalizedScanRequest {
  return {
    scanRunId: "scan-serp-1",
    workspaceId: "ws-1",
    domainId: "dom-1",
    monitoredPromptId: "prompt-1",
    monitorConfigurationId: "mc-1",
    prompt: "Best tools for AI citation monitoring",
    aiSurface: "google_ai_overviews",
    languageCode: "en",
    countryCode: "US",
    city: "New York",
    scheduledFor: new Date("2026-07-09T12:00:00.000Z"),
    runType: "baseline",
    correlationId: "corr-serp-1",
    ...overrides,
  };
}

describe("DataForSEO SERP locations", () => {
  it("resolves country codes and ignores city for now", () => {
    expect(resolveDataForSeoLocationCode({ countryCode: "US" })).toBe(2840);
    expect(
      resolveDataForSeoLocationCode({
        countryCode: "US",
        city: "New York",
      }),
    ).toBe(2840);
  });

  it("rejects unsupported countries", () => {
    expect(() =>
      resolveDataForSeoLocationCode({ countryCode: "ZZ" }),
    ).toThrow(/Unsupported monitoring location/);
  });
});

describe("DataForSEO SERP task builder", () => {
  it("maps Google surfaces to SERP endpoints", () => {
    expect(getDataForSeoLiveEndpoint("google_ai_overviews")).toContain(
      "organic/live/advanced",
    );
    expect(getDataForSeoLiveEndpoint("google_ai_mode")).toContain(
      "ai_mode/live/advanced",
    );
  });

  it("builds organic AI Overview payloads with async load", () => {
    const [payload] = buildDataForSeoSerpTask(baseRequest());
    expect(payload.keyword).toBe("Best tools for AI citation monitoring");
    expect(payload.language_code).toBe("en");
    expect(payload.location_code).toBe(2840);
    expect(payload.load_async_ai_overview).toBe(true);
    expect(payload.device).toBe("desktop");
  });

  it("builds AI Mode payloads without async overview flag", () => {
    const [payload] = buildDataForSeoSerpTask(
      baseRequest({ aiSurface: "google_ai_mode", city: null }),
    );
    expect(payload.location_code).toBe(2840);
    expect(payload.load_async_ai_overview).toBeUndefined();
  });

  it("rejects non-English AI Mode requests", () => {
    expect(() =>
      buildDataForSeoSerpTask(
        baseRequest({
          aiSurface: "google_ai_mode",
          languageCode: "fr",
        }),
      ),
    ).toThrow(/English only/);
  });
});

describe("DataForSEO SERP normalization", () => {
  it("normalizes AI Overview references from organic SERP", () => {
    const envelope = JSON.parse(
      readFileSync(
        join(fixtureDir, "google-ai-overviews-serp-with-overview.json"),
        "utf8",
      ),
    );
    const result = normalizeDataForSeoSerpResponse({
      envelope,
      request: baseRequest(),
    });
    expect(result.aiSurface).toBe("google_ai_overviews");
    expect(result.responseText).toContain("Cited Test Brand");
    expect(result.responseText).not.toMatch(/##|\*\*/);
    expect(result.citations.length).toBeGreaterThanOrEqual(2);
    expect(result.citations[0]?.hostname).toBe("cited-test.example");
    expect(result.providerCostType).toBe("actual");
    expect(result.metadata?.missingAiOverview).toBe(false);
  });

  it("completes with empty evidence when AI Overview is absent", () => {
    const envelope = JSON.parse(
      readFileSync(
        join(fixtureDir, "google-ai-overviews-serp-no-overview.json"),
        "utf8",
      ),
    );
    const result = normalizeDataForSeoSerpResponse({
      envelope,
      request: baseRequest(),
    });
    expect(result.responseText).toBe("");
    expect(result.citations).toEqual([]);
    expect(result.metadata?.missingAiOverview).toBe(true);
  });

  it("normalizes Google AI Mode overview references", () => {
    const envelope = JSON.parse(
      readFileSync(
        join(fixtureDir, "google-ai-mode-live-with-overview.json"),
        "utf8",
      ),
    );
    const result = normalizeDataForSeoSerpResponse({
      envelope,
      request: baseRequest({ aiSurface: "google_ai_mode" }),
    });
    expect(result.aiSurface).toBe("google_ai_mode");
    expect(result.responseText).toContain("Cited Test Brand");
    expect(result.responseText).not.toMatch(/##|\*\*/);
    expect(result.citations.length).toBeGreaterThanOrEqual(2);
    expect(result.metadata?.seType).toBe("ai_mode");
  });
});
