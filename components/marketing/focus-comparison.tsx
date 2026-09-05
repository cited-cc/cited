import { ScrollReveal } from "@/components/marketing/scroll-reveal";
import { FOCUS_SECTION } from "@/lib/content/marketing";
import { cn } from "@/lib/utils";

type FocusComparisonProps = {
  className?: string;
};

export function FocusComparison({ className }: FocusComparisonProps) {
  return (
    <div
      className={cn(
        "grid overflow-hidden rounded-lg border border-cited-line bg-cited-surface cited-note-shadow md:grid-cols-2",
        className,
      )}
    >
      <ScrollReveal
        delay={1}
        className="relative border-b border-cited-line-subtle p-6 sm:p-8 md:border-b-0 md:border-r"
      >
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-cited-citation"
          aria-hidden
        />
        <p className="type-micro text-cited-accent">Cited</p>
        <ul className="mt-5 space-y-3">
          {FOCUS_SECTION.cited.map((item) => (
            <li
              key={item}
              className="flex items-start gap-3 type-body-sm text-cited-ink"
            >
              <span
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cited-citation ring-[3px] ring-cited-accent-muted"
                aria-hidden
              />
              {item}
            </li>
          ))}
        </ul>
      </ScrollReveal>
      <ScrollReveal delay={2} className="bg-cited-canvas/40 p-6 sm:p-8">
        <p className="type-micro text-cited-ink-faint">Not Cited</p>
        <ul className="mt-5 space-y-3">
          {FOCUS_SECTION.notCited.map((item) => (
            <li
              key={item}
              className="flex items-start gap-3 type-body-sm text-cited-ink-subtle"
            >
              <span
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cited-ink-faint/70"
                aria-hidden
              />
              {item}
            </li>
          ))}
        </ul>
      </ScrollReveal>
    </div>
  );
}
