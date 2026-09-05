import type { Metadata } from "next";

import { DemoShell } from "@/components/demo/demo-shell";
import {
  Eyebrow,
  MarketingContainer,
  MarketingSection,
} from "@/components/marketing/marketing-primitives";
import { MarketingPageView } from "@/components/marketing/marketing-page-view";
import { TrackCta } from "@/components/marketing/track-cta";
import { DEMO_CTA } from "@/lib/content/demo-marketing";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { BreadcrumbJsonLd } from "@/lib/seo/json-ld";

export const metadata: Metadata = buildPageMetadata("demo");

type DemoPageProps = {
  searchParams: Promise<{ screenshot?: string; frame?: string }>;
};

export default async function DemoPage({ searchParams }: DemoPageProps) {
  const params = await searchParams;
  const screenshot = params.screenshot === "1" || params.screenshot === "true";
  const frame = params.frame;

  return (
    <>
      <MarketingPageView event="marketing_demo_viewed" route="/demo" />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Demo", path: "/demo" },
        ]}
      />

      <MarketingSection className={screenshot ? "pt-6 pb-10" : "pt-16 sm:pt-20 pb-24"}>
        <MarketingContainer width="wide">
          {!screenshot ? (
            <div className="max-w-2xl">
              <Eyebrow>Live product tour</Eyebrow>
              <h1 className="mt-4 type-heading">
                Open the citation inbox.
              </h1>
              <p className="mt-4 type-body text-cited-ink-muted">
                Click notes, inspect evidence, and preview alerts in a public
                fictional workspace. Nothing here writes to production data or
                calls monitoring providers.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <TrackCta href={DEMO_CTA.primaryCta.href} cta="demo_page_check">
                  {DEMO_CTA.primaryCta.label}
                </TrackCta>
                <TrackCta
                  href={DEMO_CTA.secondaryCta.href}
                  cta="demo_page_pricing"
                  variant="secondary"
                >
                  {DEMO_CTA.secondaryCta.label}
                </TrackCta>
              </div>
            </div>
          ) : null}

          <div className={screenshot ? "" : "mt-10"}>
            <DemoShell screenshot={screenshot} initialFrame={frame} />
          </div>
        </MarketingContainer>
      </MarketingSection>
    </>
  );
}
