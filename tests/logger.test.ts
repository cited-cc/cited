import { describe, expect, it } from "vitest";

import { redactObject } from "@/lib/security/logger";

describe("logger redaction", () => {
  it("redacts secrets and prompt/response fields", () => {
    const redacted = redactObject({
      event: "test",
      apiKey: "sk_live_secret",
      authorization: "Bearer abc",
      promptText: "secret prompt",
      response_text: "secret response",
      workspaceId: "ws_123",
    });

    expect(redacted.apiKey).toBe("[REDACTED]");
    expect(redacted.authorization).toBe("[REDACTED]");
    expect(redacted.promptText).toBe("[REDACTED]");
    expect(redacted.response_text).toBe("[REDACTED]");
    expect(redacted.workspaceId).toBe("ws_123");
  });
});
