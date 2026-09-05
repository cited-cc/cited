type TocSection = {
  id: string;
  number?: string;
  title: string;
};

type LegalTableOfContentsProps = {
  sections: TocSection[];
};

export function LegalTableOfContents({ sections }: LegalTableOfContentsProps) {
  return (
    <nav
      aria-label="Table of contents"
      className="mt-8 rounded-lg border border-cited-line-subtle bg-cited-surface/40 p-4 sm:p-5"
    >
      <p className="type-meta text-cited-ink-subtle">Contents</p>
      <ol className="mt-3 space-y-2">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className="type-body-sm text-cited-ink-muted underline-offset-4 hover:text-cited-ink hover:underline"
            >
              {section.number ? `${section.number}. ` : null}
              {section.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
