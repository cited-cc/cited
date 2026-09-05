import { ScrollReveal } from "@/components/marketing/scroll-reveal";
import { PROBLEM_SECTION } from "@/lib/content/marketing";
import { cn } from "@/lib/utils";

type ProblemStripProps = {
  className?: string;
};

export function ProblemStrip({ className }: ProblemStripProps) {
  return (
    <div className={cn(className)}>
      <ScrollReveal className="max-w-2xl">
        <h2 className="type-heading">{PROBLEM_SECTION.heading}</h2>
        <p className="mt-4 type-body text-cited-ink-muted">
          {PROBLEM_SECTION.body}
        </p>
      </ScrollReveal>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {PROBLEM_SECTION.items.map((item, index) => (
          <ScrollReveal
            key={item.title}
            delay={(Math.min(index + 1, 4) as 1 | 2 | 3 | 4)}
          >
            <article className="h-full border-l-[3px] border-l-cited-citation/50 pl-4 sm:pl-5">
              <p className="type-micro text-cited-citation">{item.index}</p>
              <h3 className="mt-2 type-title text-cited-ink-strong">
                {item.title}
              </h3>
              <p className="mt-2 type-body-sm text-cited-ink-muted">
                {item.body}
              </p>
            </article>
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
}
