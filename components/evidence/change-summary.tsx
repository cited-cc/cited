import type { MaterialChangeResult } from "@/lib/evidence/types";
import { cn } from "@/lib/utils";

type ChangeSummaryProps = {
  change: MaterialChangeResult;
  className?: string;
};

export function ChangeSummary({ change, className }: ChangeSummaryProps) {
  return (
    <div
      className={cn(
        "rounded-md border border-cited-line-subtle bg-cited-surface px-3 py-3",
        className,
      )}
    >
      <p className="type-micro text-cited-ink-faint">Change</p>
      <p className="mt-1.5 font-mono text-xs tracking-[0.02em] text-cited-ink">
        {change.label}
      </p>
      <p className="mt-1.5 type-body-sm text-cited-ink-muted">{change.summary}</p>
    </div>
  );
}
