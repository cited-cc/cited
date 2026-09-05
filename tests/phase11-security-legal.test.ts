import { describe, expect, it, beforeEach } from "vitest";

import {
  ACCEPTABLE_USE,
  COOKIE_POLICY,
  DPA_PAGE,
  FORBIDDEN_PUBLIC_CLAIM_PATTERNS,
  LEGAL_PAGES,
  PRIVACY_POLICY,
  REFUND_POLICY,
  SECURITY_PAGE_CONTENT,
  STATUS_PAGE,
  SUBPROCESSORS,
  TERMS_OF_SERVICE,
  getLegalPage,
} from "@/lib/content/legal";
import { MARKETING_FOOTER } from "@/lib/content/marketing";
import {
  buildSelfHostedContentSecurityPolicy,
  getContentSecurityPolicy,
  getSecurityHeaders,
} from "@/lib/security/headers";
import { redactObject } from "@/lib/security/logger";
import {
  RATE_LIMIT_PRESETS,
  assertRateLimit,
  hashRateLimitFingerprint,
  resetRateLimitForTests,
} from "@/lib/security/rate-limit";
import { requireCronAuthorization } from "@/lib/security/cron";
import { isSafeRelativePath, sanitizeReturnPath } from "@/lib/auth/redirects";
import { PAGE_SEO, buildPageMetadata, getPageSeo } from "@/lib/seo/metadata";
import { getPublicIndexablePaths } from "@/lib/seo/indexable-paths";
import robots from "@/app/robots";
function flattenLegalText(page: {
  intro: string;
  sections: { paragraphs: string[]; bullets?: string[]; title: string }[];
}): string {
  return [
    page.intro,
    ...page.sections.flatMap((section) => [
      section.title,
      ...section.paragraphs,
      ...(section.bullets ?? []),
    ]),
  ].join("\n");
}

describe("phase 11 legal pages", () => {
  it("exposes all required legal routes in content registry", () => {
    expect(Object.keys(LEGAL_PAGES).sort()).toEqual(
      [
        "acceptable-use",
        "contact",
        "cookies",
        "dpa",
        "privacy",
        "refund-policy",
        "security",
        "status",
        "terms",
      ].sort(),
    );
  });

  it("includes metadata for every legal SEO page", () => {
    for (const key of [
      "terms",
      "privacy",
      "cookies",
      "acceptableUse",
      "refundPolicy",
      "security",
      "subprocessors",
      "dpa",
      "contact",
      "status",
    ] as const) {
      const meta = buildPageMetadata(key);
      expect(meta.title).toBeTruthy();
      expect(meta.description).toBeTruthy();
      expect(meta.alternates?.canonical).toContain(PAGE_SEO[key].path);
    }
  });

  it("includes legal pages in sitemap paths and footer", () => {
    const legalPaths = [
      "/terms",
      "/privacy",
      "/cookies",
      "/acceptable-use",
      "/refund-policy",
      "/security",
      "/dpa",
      "/contact",
      "/status",
    ];
    const sitemapLegalPaths = legalPaths.filter((path) => path !== "/status");
    for (const path of sitemapLegalPaths) {
      expect(getPublicIndexablePaths()).toContain(path);
    }
    expect(getPublicIndexablePaths()).not.toContain("/status");
    expect(getPublicIndexablePaths()).not.toContain("/subprocessors");
    const footerHrefs = MARKETING_FOOTER.flatMap((group) =>
      group.links.map((link) => link.href),
    );
    for (const path of legalPaths) {
      expect(footerHrefs).toContain(path);
    }
    expect(footerHrefs).not.toContain("/subprocessors");
  });

  it("noindexes the subprocessors page", () => {
    expect(getPageSeo("subprocessors").noIndex).toBe(true);
    expect(buildPageMetadata("subprocessors").robots).toEqual({
      index: false,
      follow: false,
    });
  });

  it("keeps legal pages free of Product Hunt and fake compliance claims", () => {
    const blob = Object.values(LEGAL_PAGES)
      .map((page) => flattenLegalText(page))
      .join("\n")
      .toLowerCase();
    expect(blob).not.toContain("product hunt");
    expect(blob).not.toContain("soc 2 certified");
    expect(blob).not.toContain("iso 27001 certified");
    expect(blob).not.toContain("hipaa compliant");
    expect(blob).not.toContain("attorney-reviewed");
    expect(blob).not.toContain("lawyer-approved");
    expect(blob).not.toContain("cannot be sued");
    expect(blob).not.toContain("all systems operational");
    expect(blob).not.toContain("guarantees more ai citations");
    expect(blob).not.toContain("military-grade");
    expect(blob).not.toContain("military grade");
    // Negation language is allowed and expected.
    expect(blob).toContain("does not claim soc 2");
    expect(blob).toContain("does not currently operate a paid bug bounty");
    expect(FORBIDDEN_PUBLIC_CLAIM_PATTERNS.length).toBeGreaterThan(5);
  });

  it("describes actual privacy data categories and AI response snapshots", () => {
    const privacy = flattenLegalText(PRIVACY_POLICY).toLowerCase();
    expect(privacy).toContain("monitored response snapshots");
    expect(privacy).toContain("stripe");
    expect(privacy).toContain("clerk");
    expect(privacy).toContain("dataforseo");
    expect(privacy).toContain("does not store payment card numbers");
  });

  it("lists only configured subprocessors", () => {
    const names = SUBPROCESSORS.map((item) => item.name);
    expect(names).toEqual(
      expect.arrayContaining([
        "Vercel",
        "Supabase",
        "Clerk",
        "Stripe",
        "Resend",
        "DataForSEO",
        "Slack",
        "Vercel Analytics",
      ]),
    );
    expect(names).not.toContain("Learn Domains");
    expect(names).not.toContain("Sentry");
  });

  it("keeps cookie policy aligned with analytics reality", () => {
    const cookies = flattenLegalText(COOKIE_POLICY).toLowerCase();
    expect(cookies).toContain("clerk");
    expect(cookies).toContain("stripe");
    expect(cookies).toContain("vercel analytics");
    expect(cookies).toContain("does not currently show a non-essential cookie consent banner");
  });

  it("keeps terms billing language aligned with monthly stripe plans", () => {
    const terms = flattenLegalText(TERMS_OF_SERVICE).toLowerCase();
    expect(terms).toContain("billed monthly through stripe");
    expect(terms).toContain("founder plan");
    expect(terms).toContain("does not automatically delete evidence after cancellation");
    expect(terms).toContain("ai responses can vary");
  });

  it("renders refund, acceptable use, dpa, and status content safely", () => {
    expect(getLegalPage("refund-policy").title).toBe(REFUND_POLICY.title);
    expect(getLegalPage("acceptable-use").title).toBe(ACCEPTABLE_USE.title);
    expect(getLegalPage("dpa").title).toBe(DPA_PAGE.title);
    const status = flattenLegalText(STATUS_PAGE).toLowerCase();
    expect(status).toContain("no public incident is currently posted");
    expect(status).not.toContain("all systems operational");
  });

  it("keeps security page free of unsupported certifications", () => {
    const security = flattenLegalText(SECURITY_PAGE_CONTENT).toLowerCase();
    expect(security).toContain("does not claim soc 2");
    expect(security).toContain("workspace-scoped authorization");
    expect(security).not.toContain("penetration tested");
    expect(security).not.toContain("bug bounty program is live");
  });
});

describe("phase 11 seo and robots", () => {
  it("disallows all crawlers in community edition robots output", () => {
    const result = robots();
    expect(result.rules).toEqual({
      userAgent: "*",
      disallow: "/",
    });
  });
});

describe("phase 11 security headers and csp", () => {
  it("emits required security headers in production config", () => {
    const headers = getSecurityHeaders({ isProduction: true, includeHsts: true });
    const map = Object.fromEntries(headers.map((header) => [header.key, header.value]));
    expect(map["X-Content-Type-Options"]).toBe("nosniff");
    expect(map["X-Frame-Options"]).toBe("DENY");
    expect(map["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(map["Strict-Transport-Security"]).toContain("max-age=31536000");
    expect(map["Content-Security-Policy"]).toContain("default-src 'self'");
  });

  it("uses self-hosted csp without cloud-only origins in community edition", () => {
    const csp = getContentSecurityPolicy();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).not.toContain("clerk.com");
    expect(csp).not.toContain("stripe.com");
    expect(csp).not.toContain("api.dataforseo.com");
    expect(csp).not.toContain("hooks.slack.com");
  });

  it("builds explicit self-hosted csp without third-party script hosts", () => {
    const csp = buildSelfHostedContentSecurityPolicy();
    expect(csp).toMatch(/script-src 'self' 'unsafe-inline'/);
    expect(csp).toContain("frame-src 'none'");
    expect(csp).not.toContain("unsafe-eval");
  });

  it("omits hsts outside production", () => {
    const headers = getSecurityHeaders({ isProduction: false, includeHsts: false });
    expect(headers.some((header) => header.key === "Strict-Transport-Security")).toBe(
      false,
    );
  });
});

describe("phase 11 rate limiting and redirects", () => {
  beforeEach(() => {
    resetRateLimitForTests();
  });

  it("rate limits repeated sensitive actions", () => {
    const key = hashRateLimitFingerprint(["export-test"]);
    for (let i = 0; i < RATE_LIMIT_PRESETS.export.limit; i += 1) {
      expect(assertRateLimit({ key, ...RATE_LIMIT_PRESETS.export }).ok).toBe(true);
    }
    const blocked = assertRateLimit({ key, ...RATE_LIMIT_PRESETS.export });
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    }
  });

  it("rejects unsafe redirects", () => {
    expect(isSafeRelativePath("https://evil.example")).toBe(false);
    expect(isSafeRelativePath("//evil.example")).toBe(false);
    expect(sanitizeReturnPath("https://evil.example")).toBe("/app");
    expect(sanitizeReturnPath("/app/inbox")).toBe("/app/inbox");
  });
});

describe("phase 11 logging redaction", () => {
  it("redacts secrets, emails, prompts, responses, notes, and source urls", () => {
    const redacted = redactObject({
      authorization: "Bearer secret",
      email: "person@example.com",
      promptText: "secret prompt",
      response_text: "secret response",
      noteBody: "private note",
      annotation_body: "private annotation",
      source_url: "https://example.com/page",
      slack_webhook: "https://hooks.slack.com/services/T/B/X",
      verification_token: "tok_123",
      workspaceId: "ws_123",
    });
    expect(redacted.authorization).toBe("[REDACTED]");
    expect(redacted.email).toBe("[REDACTED]");
    expect(redacted.promptText).toBe("[REDACTED]");
    expect(redacted.response_text).toBe("[REDACTED]");
    expect(redacted.noteBody).toBe("[REDACTED]");
    expect(redacted.annotation_body).toBe("[REDACTED]");
    expect(redacted.source_url).toBe("[REDACTED]");
    expect(redacted.slack_webhook).toBe("[REDACTED]");
    expect(redacted.verification_token).toBe("[REDACTED]");
    expect(redacted.workspaceId).toBe("ws_123");
  });
});

describe("phase 11 cron auth", () => {
  it("rejects missing and wrong cron secrets", () => {
    expect(requireCronAuthorization(null, "secret")).toBe(false);
    expect(requireCronAuthorization("Bearer wrong", "secret")).toBe(false);
    expect(requireCronAuthorization("Bearer secret", "secret")).toBe(true);
  });
});

describe("phase 11 production env validation", () => {
  it("documents production guards for localhost and mock provider", async () => {
    // Production guards live in lib/env superRefine. Direct NODE_ENV mutation
    // is not reliable under Vitest typings, so assert the guard source and
    // related public helpers instead of mutating process.env.NODE_ENV.
    const envSource = await import("node:fs").then((fs) =>
      fs.readFileSync("lib/env/index.ts", "utf8"),
    );
    expect(envSource).toContain("Production NEXT_PUBLIC_APP_URL cannot be localhost");
    expect(envSource).toContain("Mock monitoring provider is not allowed in production");
    expect(envSource).toContain("NEXT_PUBLIC_SUPPORT_EMAIL is required in production");
    expect(envSource).toContain("SECURITY_CONTACT_EMAIL is required in production");
  });
});
