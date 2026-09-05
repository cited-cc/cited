import type { Metadata } from "next";

import {
  Eyebrow,
  MarketingContainer,
  MarketingSection,
} from "@/components/marketing/marketing-primitives";
import { MarketingPageView } from "@/components/marketing/marketing-page-view";
import { TrackCta } from "@/components/marketing/track-cta";
import { NoteCard } from "@/components/ui/note-card";
import { HOW_IT_WORKS } from "@/lib/content/marketing";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { BreadcrumbJsonLd, HowToJsonLd } from "@/lib/seo/json-ld";

export const metadata: Metadata = buildPageMetadata("howItWorks");

const TAXONOMY_VARIANTS = [
  "citation",
  "mention",
  "default",
  "opportunity",
] as const;

export default function HowItWorksPage() {
  return (
    <>
      <MarketingPageView
        event="marketing_how_it_works_viewed"
        route="/how-it-works"
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "How it works", path: "/how-it-works" },
        ]}
      />
      <HowToJsonLd
        name={HOW_IT_WORKS.headline}
        description={HOW_IT_WORKS.supporting}
        steps={HOW_IT_WORKS.steps.map((step) => ({
          name: step.title,
          text: step.body,
        }))}
      />

      <MarketingSection className="pt-16 sm:pt-20">
        <MarketingContainer width="narrow">
          <Eyebrow>{HOW_IT_WORKS.eyebrow}</Eyebrow>
          <h1 className="mt-4 type-heading text-[clamp(1.75rem,4vw,2.75rem)]">
            {HOW_IT_WORKS.headline}
          </h1>
          <p className="mt-4 type-body text-cited-ink-muted">
            {HOW_IT_WORKS.supporting}
          </p>
        </MarketingContainer>
      </MarketingSection>

      <MarketingSection className="pt-0">
        <MarketingContainer width="wide">
          <ol className="grid gap-4 md:grid-cols-2">
            {HOW_IT_WORKS.steps.map((step) => (
              <li
                key={step.index}
                className="rounded-lg border border-cited-line bg-cited-surface p-6"
              >
                <p className="type-micro text-cited-citation">{step.index}</p>
                <h2 className="mt-2 type-title">{step.title}</h2>
                <p className="mt-2 type-body-sm">{step.body}</p>
              </li>
            ))}
          </ol>
        </MarketingContainer>
      </MarketingSection>

      <MarketingSection>
        <MarketingContainer width="wide">
          <h2 className="type-heading text-[clamp(1.35rem,3vw,1.75rem)]">
            What Cited recognizes
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {HOW_IT_WORKS.taxonomy.map((item, index) => (
              <NoteCard
                key={item.title}
                variant={TAXONOMY_VARIANTS[index] ?? "default"}
                title={item.title}
              >
                <p className="type-body-sm">{item.body}</p>
              </NoteCard>
            ))}
          </div>
        </MarketingContainer>
      </MarketingSection>

      <MarketingSection>
        <MarketingContainer width="narrow">
          <h2 className="type-heading text-[clamp(1.35rem,3vw,1.75rem)]">
            {HOW_IT_WORKS.boundary.heading}
          </h2>
          <p className="mt-3 type-body text-cited-ink-muted">
            {HOW_IT_WORKS.boundary.body}
          </p>
          <p className="mt-4 type-body-sm text-cited-ink-subtle">
            {HOW_IT_WORKS.boundary.note}
          </p>
        </MarketingContainer>
      </MarketingSection>

      <MarketingSection className="pb-24">
        <MarketingContainer width="narrow">
          <TrackCta href={HOW_IT_WORKS.cta.href} cta="how_check_domain" size="lg">
            {HOW_IT_WORKS.cta.label}
          </TrackCta>
        </MarketingContainer>
      </MarketingSection>
    </>
  );
}
