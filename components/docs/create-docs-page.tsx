import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DocsArticleBody } from "@/components/docs/docs-article-body";
import { DocsArticleShell } from "@/components/docs/docs-layout";
import { MarketingPageView } from "@/components/marketing/marketing-page-view";
import {
  DOCS_FAQ_ITEMS,
  getDocsArticle,
  getDocsPath,
  type DocsSlug,
} from "@/lib/content/docs";
import { BreadcrumbJsonLd, FaqPageJsonLd, TechArticleJsonLd } from "@/lib/seo/json-ld";
import { buildDocsMetadata } from "@/lib/seo/docs-metadata";

export function createDocsArticlePage(slug: DocsSlug) {
  async function generateMetadata(): Promise<Metadata> {
    return buildDocsMetadata(slug);
  }

  async function Page() {
    const article = getDocsArticle(slug);
    if (!article) notFound();

    return (
      <>
        <MarketingPageView
          event="marketing_docs_viewed"
          route={getDocsPath(slug)}
        />
        <BreadcrumbJsonLd
          items={[
            { name: "Home", path: "/" },
            { name: "Documentation", path: "/docs" },
            { name: article.title, path: getDocsPath(slug) },
          ]}
        />
        <TechArticleJsonLd
          title={article.title}
          description={article.description}
          path={getDocsPath(slug)}
          lastUpdated={article.lastUpdated}
        />
        {slug === "faq" ? <FaqPageJsonLd items={DOCS_FAQ_ITEMS} /> : null}
        <DocsArticleShell article={article}>
          <DocsArticleBody slug={slug} />
        </DocsArticleShell>
      </>
    );
  }

  return { generateMetadata, Page };
}
