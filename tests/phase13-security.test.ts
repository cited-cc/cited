import { describe, expect, it, beforeEach, afterEach } from "vitest";

import {
  canArchiveInboxEvents,
  canCreateAnnotations,
  canCreateNotebookEntries,
  canExportEvidence,
  canExportWorkspaceArchive,
  canManageWorkspaceSettings,
  canModerateWorkspaceAnnotations,
  canResolveInboxEvents,
  canViewNotebook,
} from "@/lib/auth/permissions";
import { sanitizeReturnPath } from "@/lib/auth/redirects";
import {
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  assertPasswordLength,
  hashPassword,
  verifyPassword,
  verifyPasswordDummy,
} from "@/lib/auth/password";
import { sanitizeCsvCell } from "@/lib/export/csv";
import {
  assertAllowedRuntimeFetchUrl,
  EgressViolationError,
  getEgressInventorySummary,
  isAllowedRuntimeFetchHost,
  RUNTIME_FETCH_HOSTS,
} from "@/lib/security/egress";
import {
  buildSelfHostedContentSecurityPolicy,
  getSecurityHeaders,
} from "@/lib/security/headers";
import { decryptSecret, encryptSecret } from "@/lib/security/encryption";
import { redactObject } from "@/lib/security/logger";
import { isValidSlackWebhookUrl } from "@/lib/notifications/providers/slack";
import {
  resetDeploymentCacheForTests,
  setDeploymentModeOverrideForTests,
} from "@/lib/deployment";
import { validateNormalizedAiResult } from "@/lib/providers/normalization";

describe("phase 13 egress boundaries", () => {
  it("allowlists only official runtime fetch hosts", () => {
    expect(RUNTIME_FETCH_HOSTS).toContain("api.dataforseo.com");
    expect(RUNTIME_FETCH_HOSTS).toContain("hooks.slack.com");
    expect(isAllowedRuntimeFetchHost("api.dataforseo.com")).toBe(true);
    expect(isAllowedRuntimeFetchHost("evil.example.com")).toBe(false);
  });

  it("rejects non-allowlisted fetch URLs", () => {
    expect(() =>
      assertAllowedRuntimeFetchUrl("https://evil.example.com/probe"),
    ).toThrow(EgressViolationError);
  });

  it("permits allowlisted DataForSEO host", () => {
    expect(() =>
      assertAllowedRuntimeFetchUrl("https://api.dataforseo.com/v3/ai_optimization/"),
    ).not.toThrow();
  });

  it("exposes a static egress inventory", () => {
    const summary = getEgressInventorySummary();
    expect(summary.entries.length).toBeGreaterThan(0);
    expect(summary.fetchHosts).toContain("hooks.slack.com");
  });
});

describe("phase 13 self-hosted browser security", () => {
  beforeEach(() => {
    resetDeploymentCacheForTests();
    setDeploymentModeOverrideForTests("self_hosted");
  });

  afterEach(() => {
    resetDeploymentCacheForTests();
  });

  it("builds community-edition CSP without cloud-only origins", () => {
    const csp = buildSelfHostedContentSecurityPolicy();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).not.toContain("clerk");
    expect(csp).not.toContain("stripe.com");
    expect(csp).not.toContain("vercel-scripts.com");
  });

  it("includes standard security headers in production", () => {
    const headers = getSecurityHeaders({ isProduction: true, includeHsts: true });
    const keys = headers.map((header) => header.key);
    expect(keys).toContain("Content-Security-Policy");
    expect(keys).toContain("X-Content-Type-Options");
    expect(keys).toContain("Referrer-Policy");
    expect(keys).toContain("Permissions-Policy");
    expect(keys).toContain("Strict-Transport-Security");
  });
});

describe("phase 13 authentication hardening", () => {
  it("enforces password length bounds", () => {
    expect(MIN_PASSWORD_LENGTH).toBeGreaterThanOrEqual(12);
    expect(() => assertPasswordLength("short")).toThrow();
    expect(() => assertPasswordLength("a".repeat(MAX_PASSWORD_LENGTH + 1))).toThrow();
  });

  it("uses versioned scrypt hashes with unique salts", async () => {
    const hashA = await hashPassword("valid-password-12");
    const hashB = await hashPassword("valid-password-12");
    expect(hashA.startsWith("scrypt-v1$")).toBe(true);
    expect(hashA).not.toEqual(hashB);
    expect(await verifyPassword("valid-password-12", hashA)).toBe(true);
    expect(await verifyPassword("wrong-password-12", hashA)).toBe(false);
  });

  it("runs dummy verification without throwing", async () => {
    await expect(verifyPasswordDummy("any-password-12")).resolves.toBeUndefined();
  });
});

describe("phase 13 authorization matrix", () => {
  it("denies viewers destructive and export actions", () => {
    expect(canViewNotebook("viewer")).toBe(true);
    expect(canArchiveInboxEvents("viewer")).toBe(false);
    expect(canResolveInboxEvents("viewer")).toBe(false);
    expect(canCreateNotebookEntries("viewer")).toBe(false);
    expect(canCreateAnnotations("viewer")).toBe(false);
    expect(canExportEvidence("viewer")).toBe(false);
    expect(canExportWorkspaceArchive("viewer")).toBe(false);
    expect(canManageWorkspaceSettings("viewer")).toBe(false);
    expect(canModerateWorkspaceAnnotations("viewer")).toBe(false);
  });

  it("permits members evidence export but not workspace archive", () => {
    expect(canExportEvidence("member")).toBe(true);
    expect(canExportWorkspaceArchive("member")).toBe(false);
    expect(canExportWorkspaceArchive("admin")).toBe(true);
  });
});

describe("phase 13 export and redirect safety", () => {
  it("neutralizes CSV formula injection prefixes", () => {
    expect(sanitizeCsvCell("=cmd|")).toBe("'=cmd|");
    expect(sanitizeCsvCell("+1234")).toBe("'+1234");
    expect(sanitizeCsvCell("-100")).toBe("'-100");
    expect(sanitizeCsvCell("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(sanitizeCsvCell("\tmalicious")).toBe("'\tmalicious");
  });

  it("rejects open redirects", () => {
    expect(sanitizeReturnPath("https://evil.example.com", "/app")).toBe("/app");
    expect(sanitizeReturnPath("//evil.example.com", "/app")).toBe("/app");
    expect(sanitizeReturnPath("/app/inbox", "/app")).toBe("/app/inbox");
  });
});

describe("phase 13 provider content safety", () => {
  const baseResult = {
    provider: "mock" as const,
    aiSurface: "chatgpt" as const,
    prompt: "test prompt",
    responseText: "safe text",
    location: { languageCode: "en", countryCode: "US" },
    citations: [] as [],
    mentionCandidates: [] as [],
    completedAt: new Date(),
    providerCostType: "unknown" as const,
    rawPayload: {},
  };

  it("rejects oversized provider response text", () => {
    expect(() =>
      validateNormalizedAiResult(
        {
          ...baseResult,
          responseText: "x".repeat(500_000),
        },
        "mock",
      ),
    ).toThrow();
  });

  it("rejects javascript citation URLs", () => {
    expect(() =>
      validateNormalizedAiResult(
        {
          ...baseResult,
          citations: [
            {
              url: "javascript:alert(1)",
              normalizedUrl: null,
              title: "title",
              snippet: "snippet",
              hostname: null,
              position: 1,
            },
          ],
        },
        "mock",
      ),
    ).toThrow();
  });
});

describe("phase 13 slack webhook validation", () => {
  it("accepts official Slack webhook shape only", () => {
    expect(
      isValidSlackWebhookUrl(
        "https://hooks.slack.com/services/T000/B000/XXXXXXXX",
      ),
    ).toBe(true);
    expect(isValidSlackWebhookUrl("https://hooks.evil.com/services/T/B/x")).toBe(
      false,
    );
    expect(
      isValidSlackWebhookUrl("https://hooks.slack.com.evil.com/services/T/B/x"),
    ).toBe(false);
  });
});

describe("phase 13 logging redaction", () => {
  it("recursively redacts nested secrets and content", () => {
    const redacted = redactObject({
      event: "test",
      password: "secret-value",
      nested: {
        prompt: "do evil",
        authorization: "Bearer token",
      },
      items: [{ responseText: "body" }],
    });

    expect(JSON.stringify(redacted)).not.toContain("secret-value");
    expect(JSON.stringify(redacted)).not.toContain("do evil");
    expect(JSON.stringify(redacted)).not.toContain("Bearer token");
    expect(redacted.event).toBe("test");
  });
});

describe("phase 13 cryptography", () => {
  const key = "0123456789abcdef0123456789abcdef";

  it("round-trips encrypted secrets with authentication tag verification", () => {
    const encrypted = encryptSecret("slack-webhook-placeholder", key);
    expect(decryptSecret(encrypted, key)).toBe("slack-webhook-placeholder");
  });

  it("rejects malformed ciphertext safely", () => {
    expect(() => decryptSecret("not-valid-ciphertext", key)).toThrow();
  });
});
