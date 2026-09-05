import Link from "next/link";

import { cn } from "@/lib/utils";
import {
  DOCS_NAV_GROUPS,
  getDocsArticle,
  getDocsPath,
  type DocsArticleMeta,
} from "@/lib/content/docs";

type DocsSidebarProps = {
  currentSlug?: string;
  className?: string;
};

export function DocsSidebar({ currentSlug, className }: DocsSidebarProps) {
  return (
    <nav
      aria-label="Documentation"
      className={cn("space-y-6", className)}
    >
      <div>
        <Link
          href="/docs"
          className={cn(
            "type-meta transition hover:text-cited-ink",
            !currentSlug ? "text-cited-accent" : "text-cited-ink-subtle",
          )}
        >
          Docs home
        </Link>
      </div>
      {DOCS_NAV_GROUPS.map((group) => (
        <div key={group.id}>
          <p className="type-micro text-cited-ink-faint">{group.title}</p>
          <ul className="mt-2 space-y-1">
            {group.slugs.map((slug) => {
              const article = getDocsArticle(slug);
              if (!article) return null;
              const active = currentSlug === slug;
              return (
                <li key={slug}>
                  <Link
                    href={getDocsPath(slug)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "block rounded-md px-2 py-1.5 text-sm transition",
                      active
                        ? "bg-cited-surface-raised text-cited-ink-strong"
                        : "text-cited-ink-muted hover:bg-cited-surface-hover hover:text-cited-ink",
                    )}
                  >
                    {article.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

type DocsTableOfContentsProps = {
  items: DocsArticleMeta["tableOfContents"];
  className?: string;
};

export function DocsTableOfContents({
  items,
  className,
}: DocsTableOfContentsProps) {
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

type DocsArticleHeaderProps = {
  article: DocsArticleMeta;
};

export function DocsArticleHeader({ article }: DocsArticleHeaderProps) {
  return (
    <header className="border-b border-cited-line-subtle border-l-[3px] border-l-cited-citation/60 pl-4 pb-8 sm:pl-5">
      <p className="type-micro text-cited-citation">[ DOCS ]</p>
      <nav aria-label="Breadcrumb" className="mt-3 type-meta text-cited-ink-subtle">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/docs" className="hover:text-cited-ink">
              Docs
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li className="text-cited-ink">{article.title}</li>
        </ol>
      </nav>
      <h1 className="mt-4 type-heading">{article.title}</h1>
      <p className="mt-3 max-w-2xl type-body text-cited-ink-muted">
        {article.description}
      </p>
      <div className="mt-4 flex flex-wrap gap-3 type-citation-meta text-cited-ink-faint">
        <span>Updated {article.lastUpdated}</span>
        <span aria-hidden>·</span>
        <span>{article.estimatedReadingTime} read</span>
      </div>
    </header>
  );
}

type DocsRelatedArticlesProps = {
  articles: DocsArticleMeta[];
};

export function DocsRelatedArticles({ articles }: DocsRelatedArticlesProps) {
  if (articles.length === 0) return null;
  return (
    <section className="mt-14 border-t border-cited-line-subtle pt-8">
      <h2 className="type-title">Related articles</h2>
      <ul className="mt-4 divide-y divide-cited-line-subtle border-y border-cited-line-subtle">
        {articles.map((article) => (
          <li key={article.slug} className="py-4">
            <Link
              href={getDocsPath(article.slug)}
              className="type-body text-cited-ink-strong underline-offset-4 hover:underline"
            >
              {article.title}
            </Link>
            <p className="mt-1 type-body-sm text-cited-ink-muted">
              {article.description}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

type DocsCalloutProps = {
  title?: string;
  tone?: "info" | "warning" | "citation";
  children: React.ReactNode;
};

export function DocsCallout({
  title,
  tone = "info",
  children,
}: DocsCalloutProps) {
  const toneClass =
    tone === "citation" || tone === "warning"
      ? "border-cited-accent/30 bg-cited-accent-muted"
      : "border-cited-line bg-cited-surface";

  return (
    <aside
      role="note"
      className={cn("my-6 rounded-md border px-4 py-3", toneClass)}
    >
      {title ? (
        <p className="mb-1 font-mono text-[11px] font-medium tracking-[0.08em] uppercase text-cited-ink-subtle">
          {title}
        </p>
      ) : null}
      <div className="type-body-sm text-cited-ink">{children}</div>
    </aside>
  );
}

export function DocsStepList({
  steps,
}: {
  steps: { title: string; body: string }[];
}) {
  return (
    <ol className="my-6 space-y-4">
      {steps.map((step, index) => (
        <li key={step.title} className="flex gap-4">
          <span className="mt-0.5 font-mono text-[11px] text-cited-accent">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div>
            <p className="type-title text-base">{step.title}</p>
            <p className="mt-1 type-body-sm text-cited-ink-muted">{step.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function DocsDefinitionList({
  items,
}: {
  items: { id?: string; term: string; definition: string }[];
}) {
  return (
    <dl className="my-6 space-y-5">
      {items.map((item) => (
        <div key={item.term} id={item.id}>
          <dt className="type-title text-base">{item.term}</dt>
          <dd className="mt-1 type-body-sm text-cited-ink-muted">
            {item.definition}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function DocsExampleCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="my-6 rounded-md border border-cited-line bg-cited-surface px-4 py-4 cited-note-shadow">
      <p className="type-micro text-cited-citation">{title}</p>
      <div className="mt-3 space-y-2 type-body-sm text-cited-ink">{children}</div>
    </div>
  );
}

export function DocsCodeLikeBlock({ children }: { children: string }) {
  return (
    <pre className="my-4 overflow-x-auto rounded-md border border-cited-line bg-cited-canvas-elevated px-4 py-3 font-mono text-[12px] leading-relaxed text-cited-ink whitespace-pre-wrap break-all">
      {children}
    </pre>
  );
}

export function DocsTerminologyCard({
  term,
  definition,
}: {
  term: string;
  definition: string;
}) {
  return (
    <div className="rounded-md border border-cited-line-subtle bg-cited-surface/70 px-4 py-3">
      <p className="type-title text-base">{term}</p>
      <p className="mt-1 type-body-sm text-cited-ink-muted">{definition}</p>
    </div>
  );
}

export function DocsLimitTable({
  rows,
}: {
  rows: {
    plan: string;
    prompts: number;
    surfaces: string;
    emailAlerts: string;
    history: string;
  }[];
}) {
  return (
    <div className="my-6 overflow-x-auto rounded-md border border-cited-line">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-cited-line bg-cited-surface">
          <tr>
            <th className="px-3 py-2 type-meta">Plan</th>
            <th className="px-3 py-2 type-meta">Prompts</th>
            <th className="px-3 py-2 type-meta">Surfaces</th>
            <th className="px-3 py-2 type-meta">Email alerts</th>
            <th className="px-3 py-2 type-meta">History</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.plan} className="border-b border-cited-line-subtle">
              <td className="px-3 py-2 text-cited-ink">{row.plan}</td>
              <td className="px-3 py-2 text-cited-ink-muted">{row.prompts}</td>
              <td className="px-3 py-2 text-cited-ink-muted">{row.surfaces}</td>
              <td className="px-3 py-2 text-cited-ink-muted">{row.emailAlerts}</td>
              <td className="px-3 py-2 text-cited-ink-muted">{row.history}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DocsPlanNote({ children }: { children: React.ReactNode }) {
  return (
    <DocsCallout title="Plan note" tone="info">
      {children}
    </DocsCallout>
  );
}

export function DocsFeedbackPrompt() {
  return (
    <div className="mt-10 rounded-md border border-dashed border-cited-line px-4 py-4">
      <p className="type-title text-base">Was this useful?</p>
      <p className="mt-1 type-body-sm text-cited-ink-muted">
        If something is unclear, open{" "}
        <Link href="/docs/contact" className="underline underline-offset-4">
          Contact
        </Link>{" "}
        and tell us which page needs a clearer explanation.
      </p>
    </div>
  );
}
