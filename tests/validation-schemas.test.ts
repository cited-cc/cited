import { describe, expect, it } from "vitest";

import {
  domainInputSchema,
  exportRequestSchema,
  freeScanRequestSchema,
  promptTextSchema,
  slackWebhookSchema,
} from "@/lib/validation/schemas";

describe("validation schemas", () => {
  it("accepts a clean domain", () => {
    expect(
      domainInputSchema.parse({ hostname: "cited.example" }).hostname,
    ).toBe("cited.example");
  });

  it("rejects HTML in prompt text", () => {
    expect(() =>
      promptTextSchema.parse({ promptText: "<script>alert(1)</script>" }),
    ).toThrow();
  });

  it("rejects unknown fields on export requests", () => {
    expect(() =>
      exportRequestSchema.parse({
        format: "csv",
        rawProviderPayload: true,
      }),
    ).toThrow();
  });

  it("rejects non-Slack webhook URLs", () => {
    expect(() =>
      slackWebhookSchema.parse({
        webhookUrl: "https://evil.example/hooks/abc",
      }),
    ).toThrow();
  });

  it("accepts free scan email + domain", () => {
    const parsed = freeScanRequestSchema.parse({
      email: "founder@example.com",
      domain: "cited.example",
    });
    expect(parsed.email).toBe("founder@example.com");
  });
});
