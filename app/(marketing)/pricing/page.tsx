import type { Metadata } from "next";

import { FaqAccordion } from "@/components/marketing/faq-accordion";
import {
  Eyebrow,
  MarketingContainer,
  MarketingSection,
} from "@/components/marketing/marketing-primitives";
import { MarketingPageView } from "@/components/marketing/marketing-page-view";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { PricingComparison } from "@/components/marketing/pricing-comparison";
import { Callout } from "@/components/ui/callout";
import { PRICING_FAQ } from "@/lib/content/faq";
import { PRICING_PAGE } from "@/lib/content/marketing";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getSessionPrincipal } from "@/lib/auth/session";
import { BreadcrumbJsonLd, FaqPageJsonLd, OfferCatalogJsonLd } from "@/lib/seo/json-ld";

export const metadata: Metadata = buildPageMetadata("pricing");

export default async function PricingPage() {
  const principal = await getSessionPrincipal();
  const authenticated = Boolean(principal?.userId);

  return (
    <>
      <MarketingPageView event="marketing_pricing_viewed" route="/pricing" />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Pricing", path: "/pricing" },
        ]}
      />
      <FaqPageJsonLd items={PRICING_FAQ} />
      <OfferCatalogJsonLd />

      <MarketingSection
        className="pt-16 sm:pt-20"
        dataFastScroll="scroll_to_pricing_plans"
      >
        <MarketingContainer width="wide">
          <div className="max-w-2xl">
            <Eyebrow>{PRICING_PAGE.eyebrow}</Eyebrow>
            <h1 className="mt-4 type-heading text-[clamp(1.75rem,4vw,2.75rem)]">
              {PRICING_PAGE.headline}
            </h1>
            <p className="mt-4 type-body text-cited-ink-muted">
              {PRICING_PAGE.supporting}
            </p>
          </div>
          <PricingCards className="mt-12" authenticated={authenticated} />
        </MarketingContainer>
      </MarketingSection>

      <MarketingSection>
        <MarketingContainer width="wide">
          <h2 className="type-heading text-[clamp(1.35rem,3vw,1.75rem)]">
            Compare plans
          </h2>
          <PricingComparison className="mt-8" />
          <Callout className="mt-8" tone="info" title="Predictable limits">
            {PRICING_PAGE.limitsNote}
          </Callout>
          <p className="mt-4 max-w-3xl type-body-sm text-cited-ink-subtle">
            {PRICING_PAGE.availabilityNote}
          </p>
        </MarketingContainer>
      </MarketingSection>

      <MarketingSection className="pb-24">
        <MarketingContainer width="narrow">
          <h2 className="type-heading text-[clamp(1.35rem,3vw,1.75rem)]">
            Pricing questions
          </h2>
          <FaqAccordion items={PRICING_FAQ} className="mt-8" />
        </MarketingContainer>
      </MarketingSection>
    </>
  );
}
