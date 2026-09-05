import { describe, expect, it } from "vitest";

import { redactObject } from "@/lib/observability/redact";
import { mapDataForSeoEnvelopeStatus } from "@/lib/providers/dataforseo/errors";
import { clampDataForSeoBatchSize } from "@/lib/providers/dataforseo/rate-limit";

describe("provider and observability rescue guards", () => {
  it("maps DataForSEO envelope statuses to safe codes", () => {
    expect(mapDataForSeoEnvelopeStatus(40201)).toBe("provider_rate_limited");
    expect(mapDataForSeoEnvelopeStatus(50000)).toBe("provider_unavailable");
    expect(mapDataForSeoEnvelopeStatus(40000)).toBe("provider_validation_error");
  });

  it("clamps provider batch sizes", () => {
    expect(clampDataForSeoBatchSize(100)).toBeLessThanOrEqual(5);
    expect(clampDataForSeoBatchSize(0)).toBe(1);
  });

  it("redacts sensitive keys", () => {
    const redacted = redactObject({
      prompt: "secret prompt",
      responseText: "secret response",
      sourceUrl: "https://example.com",
      noteBody: "private note",
      event: "ok",
      status: 200,
    });
    expect(redacted.prompt).toBe("[REDACTED]");
    expect(redacted.responseText).toBe("[REDACTED]");
    expect(redacted.sourceUrl).toBe("[REDACTED]");
    expect(redacted.noteBody).toBe("[REDACTED]");
    expect(redacted.event).toBe("ok");
  });
});
