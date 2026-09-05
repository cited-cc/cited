import { FootnoteGlyph } from "@/components/shared/cited-glyphs";
import { HighlightedEvidence } from "@/components/shared/highlighted-evidence";
import { EXAMPLE_CITATION_NOTE } from "@/lib/content/marketing";
import { cn } from "@/lib/utils";

type HeroCitationPreviewProps = {
  className?: string;
};

/**
 * Signature marketing artifact: a physical citation note / source slip.
 * Server component: no client hooks; keeps LCP-adjacent hero JS lean.
 */
export function HeroCitationPreview({ className }: HeroCitationPreviewProps) {
  const evidence = EXAMPLE_CITATION_NOTE.evidence;
  const highlightPhrase = EXAMPLE_CITATION_NOTE.highlightPhrase;
  const highlightStart = evidence
    .toLowerCase()
    .indexOf(highlightPhrase.toLowerCase());
  const matches =
    highlightStart >= 0
      ? [
          {
            start: highlightStart,
            end: highlightStart + highlightPhrase.length,
            type: "citation" as const,
          },
        ]
      : [];

  return (
    <div className={cn("relative text-cited-ink", className)}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="type-micro text-cited-citation">
          [ {EXAMPLE_CITATION_NOTE.label} ]
        </p>
        <p className="type-citation-meta text-cited-ink-faint">
          Illustrative evidence
        </p>
      </div>

      <article
        aria-label="Citation Note example"
        className={cn(
          "cited-paper-texture motion-rise relative overflow-hidden rounded-md border border-cited-line-strong cited-note-shadow",
          "border-l-[3px] border-l-cited-citation",
          "transition-[border-color,transform,box-shadow] duration-200 ease-[var(--cited-ease)]",
          "hover:border-cited-citation/50 hover:shadow-[0_12px_28px_rgba(28,28,24,0.12)]",
          "motion-reduce:hover:translate-y-0",
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-cited-line-subtle px-4 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-sm border border-cited-citation/30 bg-cited-citation-muted px-2 py-1 font-mono text-[10px] font-medium tracking-[0.1em] text-cited-ink-strong uppercase">
              <FootnoteGlyph size={12} className="text-cited-ink-strong" />
              {EXAMPLE_CITATION_NOTE.badge}
            </span>
          </div>
          <span className="shrink-0 type-citation-meta text-cited-ink-faint">
            {EXAMPLE_CITATION_NOTE.surfaceLabel}
          </span>
        </div>

        <div className="space-y-5 px-4 py-5 sm:px-5">
          <MetaRow label="Prompt">
            <p className="type-evidence text-[1.05rem] text-cited-ink-strong [overflow-wrap:anywhere]">
              &ldquo;{EXAMPLE_CITATION_NOTE.prompt}&rdquo;
            </p>
          </MetaRow>

          <div className="grid gap-4 sm:grid-cols-2">
            <MetaRow label="Surface">
              <p className="type-meta text-cited-ink">
                {EXAMPLE_CITATION_NOTE.surfaceLabel}
              </p>
            </MetaRow>
            <MetaRow label="First seen by Cited">
              <p className="type-meta text-cited-ink">
                {EXAMPLE_CITATION_NOTE.firstSeen}
              </p>
            </MetaRow>
          </div>

          <MetaRow label="Source">
            <div className="rounded-sm border border-cited-line bg-cited-canvas/60 px-3 py-2">
              <p className="truncate font-mono text-[12px] tracking-[0.01em] text-cited-ink">
                {EXAMPLE_CITATION_NOTE.citedPage}
              </p>
            </div>
          </MetaRow>

          <div>
            <div className="mb-2 flex items-center gap-2">
              <p className="type-micro text-cited-citation">Evidence</p>
              <span
                className="font-mono text-[11px] text-cited-ink-strong"
                aria-hidden
              >
                [1]
              </span>
            </div>
            <div className="cited-evidence-sweep rounded-sm border border-cited-citation/25 bg-cited-citation-muted/50 px-3 py-3">
              <HighlightedEvidence text={evidence} matches={matches} />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-cited-line-subtle px-4 py-2.5 sm:px-5">
          <p className="type-citation-meta">Open the receipt</p>
          <p className="type-citation-meta text-cited-ink-faint">
            Evidence beats guessing
          </p>
        </div>
      </article>
    </div>
  );
}

function MetaRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="type-micro mb-1.5 text-cited-ink-faint">{label}</p>
      {children}
    </div>
  );
}
