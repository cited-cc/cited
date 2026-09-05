import Link from "next/link";

import {
  Eyebrow,
  MarketingContainer,
  MarketingSection,
} from "@/components/marketing/marketing-primitives";
import { LegalEffectiveDate } from "@/components/legal/legal-effective-date";
import { LegalSection } from "@/components/legal/legal-section";
import { LegalTableOfContents } from "@/components/legal/legal-table-of-contents";
import {
  LEGAL_EFFECTIVE_DATE,
  LEGAL_LAST_UPDATED,
  type LegalPageContent,
} from "@/lib/content/legal";
import { cn } from "@/lib/utils";

type LegalLayoutProps = {
  page: LegalPageContent;
  children?: React.ReactNode;
  className?: string;
  showToc?: boolean;
};

export function LegalLayout({
  page,
  children,
  className,
  showToc = true,
}: LegalLayoutProps) {
  return (
    <MarketingSection className={cn("pt-16 sm:pt-20 pb-24", className)}>
      <MarketingContainer width="narrow">
        <Eyebrow>{page.eyebrow}</Eyebrow>
        <h1 className="mt-4 type-heading">{page.title}</h1>
        <LegalEffectiveDate
          effectiveDate={LEGAL_EFFECTIVE_DATE}
          lastUpdated={LEGAL_LAST_UPDATED}
        />
        <p className="mt-6 max-w-prose type-legal">{page.intro}</p>

        {showToc && page.sections.length > 3 ? (
          <LegalTableOfContents sections={page.sections} />
        ) : null}

        <div className="mt-10 space-y-12">
          {page.sections.map((section) => (
            <LegalSection key={section.id} section={section} />
          ))}
          {children}
        </div>

        {page.relatedLinks && page.relatedLinks.length > 0 ? (
          <nav
            aria-label="Related legal pages"
            className="mt-12 border-t border-cited-line-subtle pt-6"
          >
            <p className="type-meta text-cited-ink-subtle">Related</p>
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
              {page.relatedLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="type-body-sm text-cited-ink underline-offset-4 hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </MarketingContainer>
    </MarketingSection>
  );
}
