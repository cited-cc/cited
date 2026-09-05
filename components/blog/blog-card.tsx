import Link from "next/link";

import {
  formatBlogDate,
  getBlogPath,
  type BlogArticle,
} from "@/lib/content/blog";
import { cn } from "@/lib/utils";

type BlogCardProps = {
  article: BlogArticle;
  className?: string;
};

export function BlogCard({ article, className }: BlogCardProps) {
  return (
    <Link
      href={getBlogPath(article.slug)}
      className={cn(
        "group block rounded-md border border-cited-line border-l-[3px] border-l-cited-citation/70 bg-cited-paper px-5 py-5 cited-note-shadow transition hover:border-cited-line-strong hover:border-l-cited-citation",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2 type-meta text-cited-ink-faint">
        <span className="text-cited-citation">{article.category}</span>
        <span aria-hidden>·</span>
        <span>{article.readingTime} read</span>
        <span aria-hidden>·</span>
        <time dateTime={article.publishedAt}>
          {formatBlogDate(article.publishedAt)}
        </time>
      </div>
      <h2 className="mt-3 type-title text-cited-ink-strong transition group-hover:text-cited-ink">
        {article.title}
      </h2>
      <p className="mt-2 type-body-sm text-cited-ink-muted">
        {article.description}
      </p>
      <p className="mt-4 type-micro text-cited-ink-faint transition group-hover:text-cited-citation">
        Open field note →
      </p>
    </Link>
  );
}

type BlogRelatedArticlesProps = {
  articles: BlogArticle[];
};

export function BlogRelatedArticles({ articles }: BlogRelatedArticlesProps) {
  if (articles.length === 0) return null;
  return (
    <section className="mt-14 border-t border-cited-line-subtle pt-8">
      <h2 className="type-title">Related field notes</h2>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2">
        {articles.map((article) => (
          <li key={article.slug}>
            <BlogCard article={article} />
          </li>
        ))}
      </ul>
    </section>
  );
}
