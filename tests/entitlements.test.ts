import { describe, expect, it } from "vitest";

import {
  canUseFrequency,
  canUseSurface,
  getPlanEntitlements,
  isWithinLimit,
} from "@/lib/entitlements/plan-entitlements";

describe("plan entitlements", () => {
  it("defines free plan limits", () => {
    const free = getPlanEntitlements("free");
    expect(free.domains).toBe(1);
    expect(free.activePrompts).toBe(3);
    expect(free.allowedFrequencies).toEqual(["manual"]);
    expect(canUseFrequency("free", "daily")).toBe(false);
    expect(canUseSurface("free", "chatgpt")).toBe(true);
    expect(canUseSurface("free", "claude")).toBe(false);
  });

  it("defines founder and growth baselines", () => {
    const founder = getPlanEntitlements("founder");
    expect(founder.activePrompts).toBe(10);
    expect(founder.allowedSurfaces).toContain("gemini");
    expect(founder.allowedSurfaces).not.toContain("perplexity");
    expect(founder.emailAlerts).toBe(true);
    expect(founder.historyDays).toBe(90);

    const growth = getPlanEntitlements("growth");
    expect(growth.activePrompts).toBe(25);
    expect(growth.allowedSurfaces).toContain("perplexity");
    expect(growth.allowedSurfaces).not.toContain("claude");
    expect(growth.competitorWatch).toBe(true);
    expect(growth.slackAlerts).toBe(false);
    expect(growth.historyDays).toBe(365);
  });

  it("defines pro daily scans and locations", () => {
    const pro = getPlanEntitlements("pro");
    expect(pro.activePrompts).toBe(30);
    expect(canUseFrequency("pro", "daily")).toBe(true);
    expect(pro.allowedSurfaces).toEqual([
      "chatgpt",
      "gemini",
      "perplexity",
      "claude",
      "google_ai_overviews",
      "google_ai_mode",
    ]);
    expect(canUseSurface("pro", "google_ai_mode")).toBe(true);
    expect(canUseSurface("growth", "google_ai_overviews")).toBe(false);
    expect(pro.multipleLocations).toBe(true);
    expect(pro.teamAlerts).toBe(true);
  });

  it("defines portfolio multi-domain pro capabilities", () => {
    const portfolio = getPlanEntitlements("portfolio");
    expect(portfolio.maxDomains).toBe(5);
    expect(portfolio.maxPrompts).toBe(50);
    expect(portfolio.monitoringCadence).toBe("daily");
    expect(portfolio.monthlyScans).toBe(13_500);
    expect(canUseSurface("portfolio", "google_ai_mode")).toBe(true);
    expect(portfolio.teamAlerts).toBe(true);
  });

  it("treats null limits as unlimited", () => {
    expect(isWithinLimit(999, null)).toBe(true);
    expect(isWithinLimit(3, 3)).toBe(false);
    expect(isWithinLimit(2, 3)).toBe(true);
  });
});
