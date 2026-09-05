import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { resetEnvCacheForTests } from "@/lib/env";

describe("email provider registry", () => {
  beforeEach(() => {
    resetEnvCacheForTests();
    vi.stubEnv("CITED_EMAIL_PROVIDER", "disabled");
  });

  afterEach(() => {
    resetEnvCacheForTests();
    vi.unstubAllEnvs();
  });

  it("uses disabled provider when explicitly configured", async () => {
    const { resolveEmailProviderId, sendNotificationEmail } = await import(
      "@/lib/notifications/providers/registry"
    );
    expect(resolveEmailProviderId()).toBe("disabled");
    const result = await sendNotificationEmail({
      to: "owner@example.com",
      subject: "Test",
      html: "<p>Hi</p>",
      text: "Hi",
    });
    expect(result).toEqual({
      status: "suppressed",
      reason: "email_provider_disabled",
    });
  });
});

describe("slack provider", () => {
  const originalFetch = global.fetch;
  const key = "b".repeat(64);

  beforeEach(() => {
    resetEnvCacheForTests();
    vi.stubEnv("NOTIFICATIONS_ENABLED", "true");
    vi.stubEnv("SLACK_WEBHOOK_ENCRYPTION_KEY", key);
    vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_ANON_KEY", "anon");
  });

  afterEach(() => {
    global.fetch = originalFetch;
    resetEnvCacheForTests();
    vi.unstubAllEnvs();
  });

  it("sends encrypted webhook without exposing URL", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    }) as unknown as typeof fetch;

    const { encryptSlackWebhookUrl, sendSlackWebhook } = await import(
      "@/lib/notifications/providers/slack"
    );
    const encrypted = encryptSlackWebhookUrl(
      "https://hooks.slack.com/services/T00/B00/XXXX",
    );
    const result = await sendSlackWebhook({
      encryptedWebhookUrl: encrypted,
      payload: { text: "hello" },
    });
    expect(result).toEqual({ status: "sent" });
    const call = (global.fetch as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(String(call[0])).toContain("hooks.slack.com");
    expect(encrypted).not.toContain("hooks.slack.com");
  });

  it("retries on 429", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      headers: { get: () => "30" },
    }) as unknown as typeof fetch;

    const { encryptSlackWebhookUrl, sendSlackWebhook } = await import(
      "@/lib/notifications/providers/slack"
    );
    const encrypted = encryptSlackWebhookUrl(
      "https://hooks.slack.com/services/T00/B00/XXXX",
    );
    const result = await sendSlackWebhook({
      encryptedWebhookUrl: encrypted,
      payload: { text: "hello" },
    });
    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.retryable).toBe(true);
      expect(result.retryAfterSeconds).toBe(30);
    }
  });

  it("marks revoked webhook permanent", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      headers: { get: () => null },
    }) as unknown as typeof fetch;

    const { encryptSlackWebhookUrl, sendSlackWebhook } = await import(
      "@/lib/notifications/providers/slack"
    );
    const encrypted = encryptSlackWebhookUrl(
      "https://hooks.slack.com/services/T00/B00/XXXX",
    );
    const result = await sendSlackWebhook({
      encryptedWebhookUrl: encrypted,
      payload: { text: "hello" },
    });
    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.retryable).toBe(false);
      expect(result.code).toBe("slack_webhook_revoked");
    }
  });
});
