import type { Metadata } from "next";
import Link from "next/link";

import { LegalEffectiveDate } from "@/components/legal/legal-effective-date";
import { LegalSubprocessorTable } from "@/components/legal/legal-definition-list";
import {
  Eyebrow,
  MarketingContainer,
  MarketingSection,
} from "@/components/marketing/marketing-primitives";
import {
  LEGAL_EFFECTIVE_DATE,
  LEGAL_LAST_UPDATED,
  SUBPROCESSORS,
  getLegalContactEmail,
} from "@/lib/content/legal";
import { BreadcrumbJsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata("subprocessors");

export default function SubprocessorsPage() {
  const supportEmail = getLegalContactEmail("support");

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Subprocessors", path: "/subprocessors" },
        ]}
      />
      <MarketingSection className="pt-16 sm:pt-20 pb-24">
        <MarketingContainer width="narrow">
          <Eyebrow>Legal</Eyebrow>
          <h1 className="mt-4 type-heading text-[clamp(1.75rem,4vw,2.5rem)]">
            Subprocessors
          </h1>
          <LegalEffectiveDate
            effectiveDate={LEGAL_EFFECTIVE_DATE}
            lastUpdated={LEGAL_LAST_UPDATED}
          />
          <p className="mt-6 max-w-prose type-body text-cited-ink-muted">
            Cited engages the following service providers as subprocessors to
            operate, secure, bill, and support the Service. This list includes
            only providers actually used by Cited in the ordinary course of
            providing the product. Optional providers are used only when a
            customer enables the related feature. Learn Domains is not a
            subprocessor unless a customer explicitly starts a handoff.
          </p>
          <p className="mt-4 max-w-prose type-body text-cited-ink-muted">
            Cited may update this list as providers change. Material updates
            will be reflected on this page. Engagement of a subprocessor does
            not expand Cited’s warranties or create a direct contractual
            relationship between you and that provider.
          </p>
          <LegalSubprocessorTable items={SUBPROCESSORS} />
          <p className="mt-8 type-body-sm text-cited-ink-muted">
            Customers can contact{" "}
            <a
              href={`mailto:${supportEmail}`}
              className="underline underline-offset-4"
            >
              {supportEmail}
            </a>{" "}
            with questions about subprocessors. Related:{" "}
            <Link href="/privacy" className="underline underline-offset-4">
              Privacy
            </Link>{" "}
            ·{" "}
            <Link href="/dpa" className="underline underline-offset-4">
              DPA request
            </Link>{" "}
            ·{" "}
            <Link href="/security" className="underline underline-offset-4">
              Security
            </Link>
            .
          </p>
        </MarketingContainer>
      </MarketingSection>
    </>
  );
}
