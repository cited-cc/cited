import Link from "next/link";

import { TrackCta } from "@/components/marketing/track-cta";
import { NoteCard } from "@/components/ui/note-card";
import { cn } from "@/lib/utils";

type BlogCtaVariant = "scan" | "demo" | "pricing" | "custom";

type BlogCtaCardProps = {
  variant?: BlogCtaVariant;
  title?: string;
  body?: string;
  buttonLabel?: string;
  href?: string;
  className?: string;
};

const CTA_COPY: Record<
  Exclude<BlogCtaVariant, "custom">,
  { title: string; body: string; buttonLabel: string; href: string }
> = {
  scan: {
    title: "Want the receipt?",
    body: "Check whether selected AI answers cite, mention, recommend, or miss your website.",
    buttonLabel: "Check a domain",
    href: "/scan",
  },
  demo: {
    title: "See the citation inbox.",
    body: "Open a fictional demo workspace and see how Cited turns AI-search evidence into notes.",
    buttonLabel: "See demo",
    href: "/demo",
  },
  pricing: {
    title: "Start monitoring the prompts that matter.",
    body: "Founder starts at $19/month.",
    buttonLabel: "View pricing",
    href: "/pricing",
  },
};

export function BlogCtaCard({
  variant = "scan",
  title,
  body,
  buttonLabel,
  href,
  className,
}: BlogCtaCardProps) {
  const preset = variant === "custom" ? null : CTA_COPY[variant];
  const resolvedTitle = title ?? preset?.title ?? "Want the receipt?";
  const resolvedBody =
    body ??
    preset?.body ??
    "Cited monitors the prompts you choose and saves the evidence.";
  const resolvedLabel = buttonLabel ?? preset?.buttonLabel ?? "Check a domain";
  const resolvedHref = href ?? preset?.href ?? "/scan";

  return (
    <aside
      className={cn(
        "my-8 rounded-md border border-cited-line border-l-[3px] border-l-cited-citation bg-cited-surface px-5 py-5 cited-note-shadow",
        className,
      )}
    >
      <p className="type-micro text-cited-citation">[ CITED ]</p>
      <p className="mt-2 type-title text-base text-cited-ink-strong">
        {resolvedTitle}
      </p>
      <p className="mt-2 type-body-sm text-cited-ink-muted">{resolvedBody}</p>
      <div className="mt-4">
        <TrackCta href={resolvedHref} cta={`blog_${variant}_cta`} size="md">
          {resolvedLabel}
        </TrackCta>
      </div>
    </aside>
  );
}

export function InlineProductNote({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <aside
      role="note"
      className="my-6 rounded-md border border-cited-accent/30 bg-cited-accent-muted px-4 py-3"
    >
      <p className="mb-1 font-mono text-[11px] font-medium tracking-[0.08em] uppercase text-cited-ink-subtle">
        Product note
      </p>
      <div className="type-body-sm text-cited-ink">{children}</div>
    </aside>
  );
}

export function ArticleFooterCta() {
  return (
    <section className="mt-12 rounded-md border border-cited-line bg-cited-canvas-elevated px-5 py-6 cited-paper-texture">
      <p className="type-micro text-cited-citation">[ NEXT STEP ]</p>
      <h2 className="mt-2 type-title">Evidence beats guessing.</h2>
      <p className="mt-2 max-w-xl type-body-sm text-cited-ink-muted">
        Start with the buyer prompts that matter. Cited turns monitored
        AI-search checks into citation notes you can revisit, annotate, and
        export.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <TrackCta href="/scan" cta="blog_footer_scan" size="md">
          Check a domain
        </TrackCta>
        <TrackCta
          href="/demo"
          cta="blog_footer_demo"
          variant="secondary"
          size="md"
        >
          See demo
        </TrackCta>
        <TrackCta
          href="/pricing"
          cta="blog_footer_pricing"
          variant="ghost"
          size="md"
          asLink
          className="type-body-sm text-cited-ink-muted underline-offset-4 hover:underline"
        >
          View pricing
        </TrackCta>
      </div>
    </section>
  );
}

type SourceSlipExampleProps = {
  prompt: string;
  surface?: string;
  evidence: string;
  stored?: string;
  className?: string;
};

export function SourceSlipExample({
  prompt,
  surface = "Supported AI-search surface",
  evidence,
  stored = "prompt · surface · source · timestamp · occurrence history",
  className,
}: SourceSlipExampleProps) {
  return (
    <div
      className={cn(
        "my-8 rounded-md border border-cited-line border-l-[3px] border-l-cited-citation bg-cited-paper px-5 py-5 cited-note-shadow",
        className,
      )}
    >
      <p className="type-micro text-cited-citation">[ SOURCE SLIP ]</p>
      <dl className="mt-4 space-y-3 type-body-sm">
        <div>
          <dt className="type-meta text-cited-ink-faint">Prompt</dt>
          <dd className="mt-1 text-cited-ink">“{prompt}”</dd>
        </div>
        <div>
          <dt className="type-meta text-cited-ink-faint">Surface</dt>
          <dd className="mt-1 text-cited-ink">{surface}</dd>
        </div>
        <div>
          <dt className="type-meta text-cited-ink-faint">Observed evidence</dt>
          <dd className="mt-1 text-cited-ink-muted">{evidence}</dd>
        </div>
        <div>
          <dt className="type-meta text-cited-ink-faint">Stored by Cited</dt>
          <dd className="mt-1 font-mono text-[12px] text-cited-ink-subtle">
            {stored}
          </dd>
        </div>
      </dl>
    </div>
  );
}

type EvidenceExampleCardProps = {
  title: string;
  badge?: string;
  meta?: string;
  children: React.ReactNode;
};

export function EvidenceExampleCard({
  title,
  badge = "EXAMPLE",
  meta,
  children,
}: EvidenceExampleCardProps) {
  return (
    <div className="my-8">
      <NoteCard
        variant="citation"
        indexLabel="01"
        badge={badge}
        meta={meta}
        title={title}
        example
      >
        <div className="type-body-sm text-cited-ink-muted">{children}</div>
      </NoteCard>
    </div>
  );
}

export function BlogDefinitionCard({
  term,
  definition,
}: {
  term: string;
  definition: string;
}) {
  return (
    <div className="my-4 rounded-md border border-cited-line-subtle bg-cited-surface/70 px-4 py-3">
      <p className="type-title text-base">{term}</p>
      <p className="mt-1 type-body-sm text-cited-ink-muted">{definition}</p>
    </div>
  );
}

export function BlogDoDontTable({
  rows,
}: {
  rows: { do: string; dont: string }[];
}) {
  return (
    <div className="my-6">
      <ul className="grid list-none gap-3 p-0 sm:hidden">
        {rows.map((row) => (
          <li
            key={row.do}
            className="rounded-md border border-cited-line bg-cited-surface px-3 py-3"
          >
            <div>
              <p className="type-meta text-cited-ink-subtle">Do</p>
              <p className="mt-1 text-sm text-cited-ink">{row.do}</p>
            </div>
            <div className="mt-3 border-t border-cited-line-subtle pt-3">
              <p className="type-meta text-cited-ink-subtle">Don&apos;t</p>
              <p className="mt-1 text-sm text-cited-ink-muted">{row.dont}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto rounded-md border border-cited-line sm:block">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-cited-line bg-cited-surface">
            <tr>
              <th className="px-3 py-2 type-meta">Do</th>
              <th className="px-3 py-2 type-meta">Don&apos;t</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.do} className="border-b border-cited-line-subtle">
                <td className="px-3 py-2 text-cited-ink align-top">{row.do}</td>
                <td className="px-3 py-2 text-cited-ink-muted align-top">
                  {row.dont}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function BlogAuditTable({
  rows,
}: {
  rows: {
    prompt: string;
    surface: string;
    cited: string;
    mentioned: string;
    competitor: string;
    evidence: string;
    notes: string;
    next: string;
  }[];
}) {
  return (
    <div className="my-6">
      <ul className="grid list-none gap-3 p-0 md:hidden">
        {rows.map((row) => (
          <li
            key={row.prompt}
            className="rounded-md border border-cited-line bg-cited-surface px-3 py-3"
          >
            <p className="type-title text-sm text-cited-ink">{row.prompt}</p>
            <dl className="mt-3 grid gap-2">
              <div className="flex justify-between gap-3">
                <dt className="type-meta text-cited-ink-subtle">Surface</dt>
                <dd className="text-right text-sm text-cited-ink-muted">
                  {row.surface}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="type-meta text-cited-ink-subtle">Cited?</dt>
                <dd className="text-right text-sm text-cited-ink-muted">
                  {row.cited}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="type-meta text-cited-ink-subtle">Mentioned?</dt>
                <dd className="text-right text-sm text-cited-ink-muted">
                  {row.mentioned}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="type-meta text-cited-ink-subtle">Competitor?</dt>
                <dd className="text-right text-sm text-cited-ink-muted">
                  {row.competitor}
                </dd>
              </div>
              <div>
                <dt className="type-meta text-cited-ink-subtle">Evidence</dt>
                <dd className="mt-0.5 text-sm text-cited-ink-muted">
                  {row.evidence}
                </dd>
              </div>
              <div>
                <dt className="type-meta text-cited-ink-subtle">Notes</dt>
                <dd className="mt-0.5 text-sm text-cited-ink-muted">
                  {row.notes}
                </dd>
              </div>
              <div>
                <dt className="type-meta text-cited-ink-subtle">Next</dt>
                <dd className="mt-0.5 text-sm text-cited-ink-muted">{row.next}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto rounded-md border border-cited-line md:block">
        <table className="min-w-[720px] w-full text-left text-sm">
          <thead className="border-b border-cited-line bg-cited-surface">
            <tr>
              <th className="px-3 py-2 type-meta">Prompt</th>
              <th className="px-3 py-2 type-meta">Surface</th>
              <th className="px-3 py-2 type-meta">Cited?</th>
              <th className="px-3 py-2 type-meta">Mentioned?</th>
              <th className="px-3 py-2 type-meta">Competitor?</th>
              <th className="px-3 py-2 type-meta">Evidence</th>
              <th className="px-3 py-2 type-meta">Notes</th>
              <th className="px-3 py-2 type-meta">Next</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.prompt}
                className="border-b border-cited-line-subtle"
              >
                <td className="px-3 py-2 text-cited-ink">{row.prompt}</td>
                <td className="px-3 py-2 text-cited-ink-muted">{row.surface}</td>
                <td className="px-3 py-2 text-cited-ink-muted">{row.cited}</td>
                <td className="px-3 py-2 text-cited-ink-muted">
                  {row.mentioned}
                </td>
                <td className="px-3 py-2 text-cited-ink-muted">
                  {row.competitor}
                </td>
                <td className="px-3 py-2 text-cited-ink-muted">{row.evidence}</td>
                <td className="px-3 py-2 text-cited-ink-muted">{row.notes}</td>
                <td className="px-3 py-2 text-cited-ink-muted">{row.next}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function BlogFaqList({
  items,
}: {
  items: { id: string; question: string; answer: string }[];
}) {
  return (
    <div className="space-y-6">
      {items.map((item) => (
        <div key={item.id} id={item.id}>
          <h3 className="type-title text-base">{item.question}</h3>
          <p className="mt-2 type-body-sm text-cited-ink-muted">{item.answer}</p>
        </div>
      ))}
    </div>
  );
}

export function BlogTextLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-cited-ink-strong underline underline-offset-4 decoration-cited-line-strong hover:decoration-cited-citation"
    >
      {children}
    </Link>
  );
}
