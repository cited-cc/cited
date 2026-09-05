import type { Metadata } from "next";
import Link from "next/link";

import { DocsLayout } from "@/components/docs/docs-layout";
import { TrackCta } from "@/components/marketing/track-cta";
import { MarketingPageView } from "@/components/marketing/marketing-page-view";
import {
  DOCS_INDEX,
  DOCS_NAV_GROUPS,
  getDocsArticle,
  getDocsPath,
} from "@/lib/content/docs";
import { BreadcrumbJsonLd } from "@/lib/seo/json-ld";
import { buildDocsMetadata } from "@/lib/seo/docs-metadata";

export const metadata: Metadata = buildDocsMetadata();

export default function DocsPage() {
  return (
    <>
      <MarketingPageView event="marketing_docs_viewed" route="/docs" />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Documentation", path: "/docs" },
        ]}
      />

      <DocsLayout showSearch>
        <div className="max-w-3xl">
          <p className="type-micro text-cited-accent">{DOCS_INDEX.eyebrow}</p>
          <h1 className="mt-3 type-heading text-[clamp(1.75rem,4vw,2.75rem)]">
            {DOCS_INDEX.headline}
          </h1>
          <p className="mt-4 type-body text-cited-ink-muted">
            {DOCS_INDEX.supporting}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <TrackCta href={DOCS_INDEX.primaryCta.href} cta="docs_open_cited">
              {DOCS_INDEX.primaryCta.label}
            </TrackCta>
            <TrackCta
              href={DOCS_INDEX.secondaryCta.href}
              cta="docs_scan"
              variant="secondary"
            >
              {DOCS_INDEX.secondaryCta.label}
            </TrackCta>
          </div>

          <div className="mt-12 space-y-10">
            {DOCS_NAV_GROUPS.map((group) => (
              <section key={group.id}>
                <h2 className="type-title">{group.title}</h2>
                <ul className="mt-4 divide-y divide-cited-line-subtle border-y border-cited-line-subtle">
                  {group.slugs.map((slug) => {
                    const article = getDocsArticle(slug);
                    if (!article) return null;
                    return (
                      <li key={slug} className="py-4">
                        <Link
                          href={getDocsPath(slug)}
                          className="type-body text-cited-ink-strong underline-offset-4 hover:underline"
                        >
                          {article.title}
                        </Link>
                        <p className="mt-1 type-body-sm text-cited-ink-muted">
                          {article.description}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </DocsLayout>
    </>
  );
}
