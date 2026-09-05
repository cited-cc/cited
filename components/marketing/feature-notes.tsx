import {
  AlertSlip,
  EvidenceMarker,
  NotebookGlyph,
  OccurrenceLedger,
  PromptGlyph,
  SourceSlip,
} from "@/components/shared/cited-glyphs";
import { ScrollReveal } from "@/components/marketing/scroll-reveal";
import { EXAMPLE_SOURCE_SLIP, FEATURE_SECTION } from "@/lib/content/marketing";
import { cn } from "@/lib/utils";

type FeatureNotesProps = {
  className?: string;
};

const ARTIFACT_GLYPH = {
  monitor: PromptGlyph,
  inbox: NotebookGlyph,
  evidence: EvidenceMarker,
  source: SourceSlip,
  ledger: OccurrenceLedger,
  alert: AlertSlip,
} as const;

export function FeatureNotes({ className }: FeatureNotesProps) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-2 xl:grid-cols-3", className)}>
      {FEATURE_SECTION.features.map((feature, index) => {
        const Glyph = ARTIFACT_GLYPH[feature.artifact];
        const isSource = feature.artifact === "source";
        const delay = (Math.min(index + 1, 5) as 1 | 2 | 3 | 4 | 5);

        return (
          <ScrollReveal key={feature.title} delay={delay} className="h-full">
            <article
              className={cn(
                "motion-rise group flex h-full flex-col rounded-md border border-cited-line border-l-[3px] border-l-cited-citation/70 bg-cited-paper p-5 cited-note-shadow",
                "transition-[border-color,background-color,box-shadow] duration-200 ease-[var(--cited-ease)]",
                "hover:border-cited-line-strong hover:bg-cited-paper-soft",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="type-micro text-cited-citation">{feature.meta}</p>
                <Glyph
                  className="shrink-0 text-cited-ink-subtle transition-colors duration-200 group-hover:text-cited-citation"
                  size={18}
                />
              </div>
              <h3 className="mt-4 type-title text-cited-ink-strong">
                {feature.title}
              </h3>
              <p className="mt-2 flex-1 type-body-sm text-cited-ink-muted">
                {feature.body}
              </p>
              {isSource ? (
                <div className="mt-4 space-y-2 border-t border-cited-line-subtle pt-4">
                  <p className="type-citation-meta text-cited-ink-muted">
                    {EXAMPLE_SOURCE_SLIP.body}
                  </p>
                  <div className="grid gap-1.5">
                    <p className="type-citation-meta">
                      Prompt · &ldquo;{EXAMPLE_SOURCE_SLIP.prompt}&rdquo;
                    </p>
                    <p className="type-citation-meta">
                      Surface · {EXAMPLE_SOURCE_SLIP.surface}
                    </p>
                    <p className="type-citation-meta">
                      Observed · {EXAMPLE_SOURCE_SLIP.observed}
                    </p>
                  </div>
                </div>
              ) : null}
            </article>
          </ScrollReveal>
        );
      })}
    </div>
  );
}
