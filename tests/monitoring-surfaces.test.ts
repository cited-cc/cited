import { describe, expect, it } from "vitest";

import {
  cadenceChecksPerMonth,
  estimateMonthlyChecks,
  estimateMonthlyChecksForConfigurations,
  getMonitoringSafetyLimits,
  getSelectableAiSurfacesForPlan,
  isAiSurfaceEnabled,
} from "@/lib/monitoring/surfaces";

describe("AI surface configuration", () => {
  it("enables all six DataForSEO surfaces by default", () => {
    expect(isAiSurfaceEnabled("chatgpt")).toBe(true);
    expect(isAiSurfaceEnabled("gemini")).toBe(true);
    expect(isAiSurfaceEnabled("perplexity")).toBe(true);
    expect(isAiSurfaceEnabled("claude")).toBe(true);
    expect(isAiSurfaceEnabled("google_ai_overviews")).toBe(true);
    expect(isAiSurfaceEnabled("google_ai_mode")).toBe(true);
  });

  it("filters selectable surfaces by plan entitlements", () => {
    const founder = getSelectableAiSurfacesForPlan("founder");
    expect(founder).toContain("chatgpt");
    expect(founder).toContain("gemini");
    expect(founder).not.toContain("perplexity");
    expect(founder).not.toContain("claude");
    expect(founder).not.toContain("google_ai_overviews");

    const growth = getSelectableAiSurfacesForPlan("growth");
    expect(growth).toContain("chatgpt");
    expect(growth).toContain("gemini");
    expect(growth).toContain("perplexity");
    expect(growth).not.toContain("claude");
    expect(growth).not.toContain("google_ai_mode");

    const pro = getSelectableAiSurfacesForPlan("pro");
    expect(pro).toContain("perplexity");
    expect(pro).toContain("claude");
    expect(pro).toContain("google_ai_overviews");
    expect(pro).toContain("google_ai_mode");
  });

  it("exposes monitoring safety limits per plan", () => {
    expect(getMonitoringSafetyLimits("founder").maxMonthlyMonitorChecks).toBe(
      160,
    );
    expect(getMonitoringSafetyLimits("growth").maxActiveMonitorConfigurations).toBe(
      50,
    );
    expect(getMonitoringSafetyLimits("pro").maxConcurrentRunsPerWorkspace).toBe(
      5,
    );
    expect(getMonitoringSafetyLimits("portfolio").maxMonthlyMonitorChecks).toBe(
      13_500,
    );
    expect(
      getMonitoringSafetyLimits("portfolio").maxActiveMonitorConfigurations,
    ).toBe(150);
  });

  it("estimates monthly checks from prompts x surfaces x cadence", () => {
    expect(
      estimateMonthlyChecks({
        promptCount: 10,
        surfaceCount: 2,
        cadence: "twice_weekly",
      }),
    ).toBe(160);
    expect(
      estimateMonthlyChecks({
        promptCount: 30,
        surfaceCount: 2,
        cadence: "daily",
      }),
    ).toBe(1800);
  });

  it("sums checks across concrete monitor configurations", () => {
    expect(
      estimateMonthlyChecksForConfigurations(
        [
          { scan_frequency: "twice_weekly" },
          { scan_frequency: "twice_weekly" },
          { scan_frequency: "daily" },
        ],
        "twice_weekly",
      ),
    ).toBe(46);
    expect(cadenceChecksPerMonth("daily")).toBe(30);
  });
});
