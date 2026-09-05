import { describe, expect, it } from "vitest";

import type { NormalizedScanRequest } from "@/lib/monitoring/types";
import { getDataForSeoLiveEndpoint } from "@/lib/providers/dataforseo/surfaces";
import { buildDataForSeoLiveTask } from "@/lib/providers/dataforseo/tasks";

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
    city: "New York",
    scheduledFor: new Date("2026-07-09T12:00:00.000Z"),
    runType: "baseline",
    correlationId: "corr-1",
    ...overrides,
  };
}

describe("DataForSEO live task builder", () => {
  it("maps each LLM surface to its live endpoint", () => {
    expect(getDataForSeoLiveEndpoint("chatgpt")).toContain("chat_gpt");
    expect(getDataForSeoLiveEndpoint("gemini")).toContain("gemini");
    expect(getDataForSeoLiveEndpoint("perplexity")).toContain("perplexity");
    expect(getDataForSeoLiveEndpoint("claude")).toContain("claude");
    expect(getDataForSeoLiveEndpoint("google_ai_overviews")).toContain(
      "organic",
    );
    expect(getDataForSeoLiveEndpoint("google_ai_mode")).toContain("ai_mode");
  });

  it("omits web_search and city for Perplexity payloads", () => {
    const [payload] = buildDataForSeoLiveTask(
      baseRequest({ aiSurface: "perplexity" }),
    );
    expect(payload.model_name).toBe("sonar");
    expect(payload.web_search).toBeUndefined();
    expect(payload.web_search_country_iso_code).toBe("US");
    expect(payload.web_search_city).toBeUndefined();
  });

  it("includes web_search and city for Claude payloads", () => {
    const [payload] = buildDataForSeoLiveTask(
      baseRequest({ aiSurface: "claude" }),
    );
    expect(payload.model_name).toBe("claude-3-5-sonnet-latest");
    expect(payload.web_search).toBe(true);
    expect(payload.web_search_country_iso_code).toBe("US");
    expect(payload.web_search_city).toBe("New York");
  });
});
