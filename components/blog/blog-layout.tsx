import Link from "next/link";

import {
  formatBlogDate,
  type BlogArticle,
  type BlogTocItem,
} from "@/lib/content/blog";
import { MarketingContainer } from "@/components/marketing/marketing-primitives";
import { cn } from "@/lib/utils";

export function BlogTableOfContents({
  items,
  className,
}: {
  items: BlogTocItem[];
  className?: string;
}) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="On this page" className={cn("space-y-2", className)}>
      <p className="type-micro text-cited-ink-faint">On this page</p>
      <ul className="space-y-1 border-l border-cited-line-subtle pl-3">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="block py-0.5 text-sm text-cited-ink-muted transition hover:text-cited-ink"
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function BlogArticleHeader({ article }: { article: BlogArticle }) {
  return (
    <header className="border-b border-cited-line-subtle border-l-[3px] border-l-cited-citation/60 pl-4 pb-8 sm:pl-5">
      <p className="type-micro text-cited-citation">[ {article.eyebrow.toUpperCase()} ]</p>
      <nav aria-label="Breadcrumb" className="mt-3 type-meta text-cited-ink-subtle">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/blog" className="hover:text-cited-ink">
              Blog
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-cited-ink">{article.title}</li>
        </ol>
      </nav>
      <p className="mt-4 type-meta text-cited-citation">{article.category}</p>
      <h1 className="mt-2 type-heading">{article.title}</h1>
      <p className="mt-3 max-w-2xl type-body text-cited-ink-muted">
        {article.description}
      </p>
      <div className="mt-4 flex flex-wrap gap-3 type-citation-meta text-cited-ink-faint">
        <span>{article.author}</span>
        <span aria-hidden>·</span>
        <time dateTime={article.publishedAt}>
          {formatBlogDate(article.publishedAt)}
        </time>
        <span aria-hidden>·</span>
        <span>{article.readingTime} read</span>
        {article.updatedAt !== article.publishedAt ? (
          <>
            <span aria-hidden>·</span>
            <span>Updated {formatBlogDate(article.updatedAt)}</span>
          </>
        ) : null}
      </div>
    </header>
  );
}

type BlogArticleShellProps = {
  article: BlogArticle;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function BlogArticleShell({
  article,
  children,
  footer,
}: BlogArticleShellProps) {
  return (
    <MarketingContainer width="wide" className="py-10 sm:py-14">
      <div className="mb-6 lg:hidden">
        <BlogTableOfContents items={article.tableOfContents} />
      </div>
      <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_200px]">
        <article className="min-w-0 max-w-3xl">
          <BlogArticleHeader article={article} />
          <div className="mt-8 space-y-4 type-body text-cited-ink">
            {children}
          </div>
          {footer}
        </article>
        <aside className="hidden xl:block">
          <div className="sticky top-24">
            <BlogTableOfContents items={article.tableOfContents} />
          </div>
        </aside>
      </div>
    </MarketingContainer>
  );
}
