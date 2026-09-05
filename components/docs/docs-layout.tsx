import {
  DocsArticleHeader,
  DocsFeedbackPrompt,
  DocsRelatedArticles,
  DocsSidebar,
  DocsTableOfContents,
} from "@/components/docs/docs-primitives";
import { DocsMobileNav, DocsSearchBox } from "@/components/docs/docs-nav-client";
import { MarketingContainer } from "@/components/marketing/marketing-primitives";
import {
  getDocsArticle,
  getRelatedArticles,
  type DocsArticleMeta,
} from "@/lib/content/docs";

type DocsLayoutProps = {
  currentSlug?: string;
  children: React.ReactNode;
  showSearch?: boolean;
};

export function DocsLayout({
  currentSlug,
  children,
  showSearch = true,
}: DocsLayoutProps) {
  const article = currentSlug ? getDocsArticle(currentSlug) : null;

  return (
    <MarketingContainer width="wide" className="py-10 sm:py-14">
      <div className="mb-6 flex flex-col gap-4 lg:hidden">
        {showSearch ? <DocsSearchBox /> : null}
        <DocsMobileNav currentSlug={currentSlug} />
      </div>

      <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_180px]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-6">
            {showSearch ? <DocsSearchBox /> : null}
            <DocsSidebar currentSlug={currentSlug} />
          </div>
        </aside>

        <div className="min-w-0">{children}</div>

        <aside className="hidden xl:block">
          {article ? (
            <div className="sticky top-24">
              <DocsTableOfContents items={article.tableOfContents} />
            </div>
          ) : null}
        </aside>
      </div>
    </MarketingContainer>
  );
}

type DocsArticleShellProps = {
  article: DocsArticleMeta;
  children: React.ReactNode;
};

export function DocsArticleShell({ article, children }: DocsArticleShellProps) {
  const related = getRelatedArticles(article.slug);

  return (
    <DocsLayout currentSlug={article.slug}>
      <article className="max-w-3xl">
        <DocsArticleHeader article={article} />
        <div className="docs-prose mt-8 space-y-4 type-body text-cited-ink">
          {children}
        </div>
        <DocsFeedbackPrompt />
        <DocsRelatedArticles articles={related} />
      </article>
    </DocsLayout>
  );
}
