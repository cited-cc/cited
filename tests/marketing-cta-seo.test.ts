import { describe, expect, it } from "vitest";

import {
  getPlanCtaHref,
  getSignUpHref,
  preservePlanInPath,
  readPlanIntent,
} from "@/lib/marketing/cta";
import { parsePublicPlanKey } from "@/lib/content/plans";
import { buildPageMetadata, getPageSeo } from "@/lib/seo/metadata";
import { isIndexableDeployment } from "@/lib/seo/site";

describe("plan CTA destinations", () => {
  it("routes unauthenticated users to sign-up with plan intent", () => {
    expect(getPlanCtaHref({ plan: "founder" })).toBe("/sign-up?plan=founder");
    expect(getPlanCtaHref({ plan: "growth" })).toBe("/sign-up?plan=growth");
    expect(getPlanCtaHref({ plan: "pro" })).toBe("/sign-up?plan=pro");
  });

  it("routes authenticated users to the app", () => {
    expect(getPlanCtaHref({ plan: "founder", authenticated: true })).toBe(
      "/app",
    );
  });

  it("preserves plan through sign-up helper", () => {
    expect(getSignUpHref("growth")).toBe("/sign-up?plan=growth");
    expect(getSignUpHref("enterprise")).toBe("/sign-up");
    expect(getSignUpHref(null)).toBe("/sign-up");
  });

  it("parses and preserves plan query params safely", () => {
    expect(parsePublicPlanKey("Founder")).toBe("founder");
    expect(parsePublicPlanKey("free")).toBeNull();
    expect(preservePlanInPath("/sign-up", "growth")).toBe("/sign-up?plan=growth");
    expect(readPlanIntent(new URLSearchParams("plan=pro"))).toBe("pro");
  });
});

describe("marketing SEO defaults", () => {
  it("does not index self-hosted deployments", () => {
    expect(isIndexableDeployment()).toBe(false);
  });

  it("builds page metadata from SEO registry", () => {
    const seo = getPageSeo("pricing");
    expect(seo.title).toBeTruthy();
    expect(buildPageMetadata("pricing").title).toBeTruthy();
  });
});
