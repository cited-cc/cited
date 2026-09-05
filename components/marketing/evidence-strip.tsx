import { ScrollReveal } from "@/components/marketing/scroll-reveal";
import { DISCOVERY_SECTION } from "@/lib/content/marketing";
import { cn } from "@/lib/utils";

type EvidenceStripProps = {
  className?: string;
};

export function EvidenceStrip({ className }: EvidenceStripProps) {
  return (
    <ol
      className={cn(
        "grid gap-0 overflow-hidden rounded-md border border-cited-line bg-cited-paper cited-note-shadow sm:grid-cols-3",
        className,
      )}
    >
      {DISCOVERY_SECTION.strip.map((item, index) => (
        <ScrollReveal
          key={item.index}
          as="li"
          delay={(index + 1) as 1 | 2 | 3}
          className={cn(
            "group relative px-5 py-6 sm:px-6 sm:py-7",
            index > 0 && "border-t border-cited-line-subtle sm:border-t-0 sm:border-l",
          )}
        >
          <span
            className="pointer-events-none absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-cited-citation transition-transform duration-[420ms] ease-[var(--cited-ease)] group-hover:scale-x-100 motion-reduce:hidden"
            aria-hidden
          />
          <p className="type-micro text-cited-citation">
            [{item.index}] {item.title}
          </p>
          <p className="mt-3 type-title text-[1.05rem] text-cited-ink-strong">
            {item.title}
          </p>
          <p className="mt-2 type-body-sm text-cited-ink-muted">{item.body}</p>
        </ScrollReveal>
      ))}
    </ol>
  );
}
