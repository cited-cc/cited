import { describe, expect, it } from "vitest";

import {
  buildSignInHref,
  buildSignUpHref,
  getDefaultPostAuthDestination,
  isSafeRelativePath,
  sanitizeReturnPath,
} from "@/lib/auth/redirects";

describe("safe return URL validation", () => {
  it("accepts same-origin relative paths", () => {
    expect(isSafeRelativePath("/app")).toBe(true);
    expect(isSafeRelativePath("/onboarding")).toBe(true);
  });

  it("rejects absolute and protocol-relative URLs", () => {
    expect(isSafeRelativePath("https://evil.example/phish")).toBe(false);
    expect(isSafeRelativePath("//evil.example")).toBe(false);
    expect(isSafeRelativePath("\\\\evil.example")).toBe(false);
    expect(isSafeRelativePath("javascript:alert(1)")).toBe(false);
    expect(isSafeRelativePath("")).toBe(false);
    expect(isSafeRelativePath(null)).toBe(false);
  });

  it("sanitizes to a safe default and preserves allowlisted query keys", () => {
    expect(sanitizeReturnPath("https://evil.example")).toBe("/app");
    expect(sanitizeReturnPath("//evil.example")).toBe("/app");
    expect(sanitizeReturnPath("/onboarding?step=2&email=a@example.com")).toBe(
      "/onboarding?step=2",
    );
    expect(sanitizeReturnPath("/app?utm_source=x")).toBe("/app");
  });

  it("builds auth hrefs without open redirects", () => {
    expect(buildSignInHref("https://evil.example")).toBe("/sign-in");
    expect(buildSignInHref("/onboarding")).toBe(
      "/sign-in?redirect_url=%2Fonboarding",
    );
    expect(buildSignUpHref({ plan: "founder" })).toBe("/sign-up?plan=founder");
    expect(buildSignUpHref({ plan: "free" })).toBe("/sign-up");
    expect(getDefaultPostAuthDestination("growth")).toBe("/onboarding");
    expect(getDefaultPostAuthDestination(null)).toBe("/app");
  });
});
