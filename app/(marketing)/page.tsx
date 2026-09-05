import type { Metadata } from "next";

import { EvidenceStrip } from "@/components/marketing/evidence-strip";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { FeatureNotes } from "@/components/marketing/feature-notes";
import { FocusComparison } from "@/components/marketing/focus-comparison";
import { HeroCitationPreview } from "@/components/marketing/hero-citation-preview";
import { HeroDomainCapture } from "@/components/marketing/hero-domain-capture";
import { InboxPreview } from "@/components/marketing/inbox-preview";
import {
  Eyebrow,
  InlineCta,
  MarketingContainer,
  MarketingSection,
} from "@/components/marketing/marketing-primitives";
import { MarketingPageView } from "@/components/marketing/marketing-page-view";
import { PricingTeaser } from "@/components/marketing/pricing-teaser";
import { ProblemStrip } from "@/components/marketing/problem-strip";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";
import { SurfacesGrid } from "@/components/marketing/surfaces-grid";
import { TrackCta } from "@/components/marketing/track-cta";
import { WorkflowSteps } from "@/components/marketing/workflow-steps";
import {
  AlertSlip,
  EvidenceMarker,
  NotebookGlyph,
} from "@/components/shared/cited-glyphs";
import { HOME_FAQ } from "@/lib/content/faq";
import {
  ALERTS_SECTION,
  ARTIFACTS_SECTION,
  DISCOVERY_SECTION,
  EVIDENCE_SECTION,
  FEATURE_SECTION,
  FINAL_CTA,
  FOCUS_SECTION,
  HERO,
  INBOX_SECTION,
  NOTEBOOK_SECTION,
  PRICING_TEASER,
  PROOF_SECTION,
  WORKFLOW_SECTION,
} from "@/lib/content/marketing";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  FaqPageJsonLd,
  OrganizationJsonLd,
  SoftwareApplicationJsonLd,
  WebSiteJsonLd,
} from "@/lib/seo/json-ld";
import { cn } from "@/lib/utils";
import { getSessionPrincipal } from "@/lib/auth/session";

export const metadata: Metadata = buildPageMetadata("home");

export default async function HomePage() {
  const principal = await getSessionPrincipal();
  const authenticated = Boolean(principal?.userId);

  return (
    <>
      <MarketingPageView event="marketing_home_viewed" route="/" />
      <OrganizationJsonLd />
      <WebSiteJsonLd />
      <SoftwareApplicationJsonLd />
      <FaqPageJsonLd items={HOME_FAQ} />

      <MarketingSection className="pt-12 sm:pt-24">
        <MarketingContainer width="wide">
          <div className="grid items-start gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            <div className="min-w-0">
              <Eyebrow>{HERO.eyebrow}</Eyebrow>
              <h1 className="mt-4 type-display text-balance">{HERO.headline}</h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-cited-ink-muted sm:text-lg">
                {HERO.supporting}
              </p>
              <div className="mt-8">
                <HeroDomainCapture />
              </div>
              <p className="mt-4 max-w-md type-body-sm text-cited-ink-subtle">
                {HERO.truthLine}{" "}
                <TrackCta
                  href={HERO.secondaryCta.href}
                  cta="hero_how_it_works"
                  variant="ghost"
                  size="sm"
                  asLink
                  className="inline px-0 text-cited-ink-muted underline-offset-4 hover:text-cited-ink hover:underline"
                >
                  {HERO.secondaryCta.label}
                </TrackCta>
              </p>
            </div>
            <div className="min-w-0">
              <HeroCitationPreview />
              <p className="mt-4 type-meta text-cited-ink-faint">
                {HERO.previewCaption}
              </p>
            </div>
          </div>
        </MarketingContainer>
      </MarketingSection>

      <MarketingSection dataFastScroll="scroll_to_problem">
        <MarketingContainer width="wide">
          <ProblemStrip />
        </MarketingContainer>
      </MarketingSection>

      <MarketingSection dataFastScroll="scroll_to_surfaces">
        <MarketingContainer width="wide">
          <SurfacesGrid />
        </MarketingContainer>
      </MarketingSection>

      <MarketingSection dataFastScroll="scroll_to_discovery">
        <MarketingContainer width="wide">
          <ScrollReveal className="max-w-2xl">
            <h2 className="type-heading">{DISCOVERY_SECTION.heading}</h2>
            <p className="mt-4 type-body text-cited-ink-muted">
              {DISCOVERY_SECTION.body}
            </p>
          </ScrollReveal>
          <EvidenceStrip className="mt-10" />
        </MarketingContainer>
      </MarketingSection>

      <MarketingSection dataFastScroll="scroll_to_workflow">
        <MarketingContainer width="wide">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-16">
            <ScrollReveal>
              <h2 className="type-heading">{WORKFLOW_SECTION.heading}</h2>
              <p className="mt-4 type-body-sm text-cited-ink-subtle">
                {WORKFLOW_SECTION.microcopy}
              </p>
            </ScrollReveal>
            <WorkflowSteps />
          </div>
        </MarketingContainer>
      </MarketingSection>

      <MarketingSection dataFastScroll="scroll_to_inbox">
        <MarketingContainer width="wide">
          <ScrollReveal className="max-w-2xl">
            <h2 className="type-heading">
              {INBOX_SECTION.heading}
              <span className="mt-2 block text-cited-ink-muted">
                {INBOX_SECTION.subheading}
              </span>
            </h2>
            <p className="mt-4 type-body text-cited-ink-muted">
              {INBOX_SECTION.body}
            </p>
          </ScrollReveal>
          <InboxPreview className="mt-10" />
        </MarketingContainer>
      </MarketingSection>

      <MarketingSection>
        <MarketingContainer width="wide">
          <ScrollReveal className="max-w-2xl">
            <h2 className="type-heading">{FEATURE_SECTION.heading}</h2>
          </ScrollReveal>
          <FeatureNotes className="mt-10" />
        </MarketingContainer>
      </MarketingSection>

      <MarketingSection>
        <MarketingContainer width="wide">
          <ScrollReveal className="max-w-2xl">
            <h2 className="type-heading">{ARTIFACTS_SECTION.heading}</h2>
            <p className="mt-4 type-body text-cited-ink-muted">
              {ARTIFACTS_SECTION.body}
            </p>
          </ScrollReveal>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            <ArtifactPanel
              delay={1}
              glyph={<EvidenceMarker size={20} />}
              label="[ EVIDENCE DETAIL ]"
              title={EVIDENCE_SECTION.heading}
              body={EVIDENCE_SECTION.body}
            />
            <ArtifactPanel
              delay={2}
              glyph={<AlertSlip size={20} />}
              label="[ ALERTS ]"
              title={ALERTS_SECTION.heading}
              body={ALERTS_SECTION.body}
            />
            <ArtifactPanel
              delay={3}
              glyph={<NotebookGlyph size={20} />}
              label="[ NOTEBOOK ]"
              title={NOTEBOOK_SECTION.heading}
              body={NOTEBOOK_SECTION.body}
            />
          </div>
        </MarketingContainer>
      </MarketingSection>

      <MarketingSection>
        <MarketingContainer width="wide">
          <ScrollReveal className="max-w-2xl">
            <h2 className="type-heading">{FOCUS_SECTION.heading}</h2>
            <p className="mt-4 type-body text-cited-ink-muted">
              {FOCUS_SECTION.body}
            </p>
          </ScrollReveal>
          <FocusComparison className="mt-10" />
        </MarketingContainer>
      </MarketingSection>

      <MarketingSection>
        <MarketingContainer width="wide">
          <ScrollReveal className="max-w-2xl">
            <div className="border-l-[3px] border-l-cited-citation pl-5 sm:pl-6">
              <h2 className="type-heading">{PROOF_SECTION.heading}</h2>
              <p className="mt-4 type-body text-cited-ink-muted">
                {PROOF_SECTION.body}
              </p>
              <div className="mt-6">
                <TrackCta
                  href="/scan"
                  cta="proof_check_domain"
                  variant="secondary"
                >
                  Check a domain
                </TrackCta>
              </div>
            </div>
          </ScrollReveal>
        </MarketingContainer>
      </MarketingSection>

      <MarketingSection dataFastScroll="scroll_to_pricing">
        <MarketingContainer width="wide">
          <ScrollReveal className="max-w-2xl">
            <h2 className="type-heading">{PRICING_TEASER.heading}</h2>
            <p className="mt-4 type-body text-cited-ink-muted">
              {PRICING_TEASER.body}
            </p>
          </ScrollReveal>
          <PricingTeaser className="mt-10" authenticated={authenticated} />
        </MarketingContainer>
      </MarketingSection>

      <MarketingSection>
        <MarketingContainer width="narrow">
          <ScrollReveal>
            <h2 className="type-heading">Questions, answered calmly</h2>
          </ScrollReveal>
          <FaqAccordion items={HOME_FAQ} className="mt-8" />
        </MarketingContainer>
      </MarketingSection>

      <MarketingSection className="pb-24" dataFastScroll="scroll_to_final_cta">
        <MarketingContainer width="wide">
          <ScrollReveal>
            <InlineCta
              className="border-cited-citation/25 bg-cited-surface-raised/90"
              title={FINAL_CTA.heading}
              description={FINAL_CTA.body}
              action={
                <div className="w-full sm:max-w-md">
                  <HeroDomainCapture cta="final_domain_submit" />
                </div>
              }
            />
          </ScrollReveal>
        </MarketingContainer>
      </MarketingSection>
    </>
  );
}

function ArtifactPanel({
  glyph,
  label,
  title,
  body,
  delay = 1,
}: {
  glyph: React.ReactNode;
  label: string;
  title: string;
  body: string;
  delay?: 1 | 2 | 3 | 4 | 5;
}) {
  return (
    <ScrollReveal delay={delay} className="h-full">
      <article
        className={cn(
          "motion-rise group flex h-full flex-col rounded-md border border-cited-line border-l-[3px] border-l-cited-citation/60 bg-cited-surface p-5 cited-note-shadow sm:p-6",
          "transition-[border-color,background-color,box-shadow] duration-200 ease-[var(--cited-ease)]",
          "hover:border-cited-line-strong hover:bg-cited-paper-soft",
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="type-micro text-cited-citation">{label}</p>
          <span className="text-cited-ink-subtle transition-colors duration-200 group-hover:text-cited-citation">
            {glyph}
          </span>
        </div>
        <h3 className="mt-4 type-title text-cited-ink-strong">{title}</h3>
        <p className="mt-2 type-body-sm text-cited-ink-muted">{body}</p>
      </article>
    </ScrollReveal>
  );
}
