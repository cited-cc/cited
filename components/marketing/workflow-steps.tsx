import { ScrollReveal } from "@/components/marketing/scroll-reveal";
import { WORKFLOW_SECTION } from "@/lib/content/marketing";
import { cn } from "@/lib/utils";

type WorkflowStepsProps = {
  className?: string;
};

export function WorkflowSteps({ className }: WorkflowStepsProps) {
  return (
    <ol className={cn("relative", className)}>
      <span
        className="pointer-events-none absolute bottom-6 left-[7px] top-6 w-px bg-gradient-to-b from-cited-citation via-cited-line to-transparent sm:left-[7px]"
        aria-hidden
      />
      {WORKFLOW_SECTION.steps.map((step, index) => (
        <ScrollReveal
          key={step.index}
          as="li"
          delay={(Math.min(index + 1, 5) as 1 | 2 | 3 | 4 | 5)}
          className="relative grid gap-3 py-6 pl-8 sm:grid-cols-[7.5rem_1fr] sm:gap-10 sm:pl-10"
        >
          <span
            className="absolute left-0 top-8 flex h-3.5 w-3.5 items-center justify-center"
            aria-hidden
          >
            <span className="absolute inset-0 rounded-full bg-cited-citation/25" />
            <span className="relative h-2 w-2 rounded-full border border-cited-citation bg-cited-canvas shadow-[0_0_0_3px_var(--cited-canvas)]" />
          </span>
          <p className="type-micro text-cited-citation">{step.index}</p>
          <div>
            <h3 className="type-title text-cited-ink-strong">{step.title}</h3>
            <p className="mt-2 max-w-xl type-body-sm text-cited-ink-muted">
              {step.body}
            </p>
          </div>
        </ScrollReveal>
      ))}
    </ol>
  );
}
