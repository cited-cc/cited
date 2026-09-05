"use client";

import { SourceEvidenceCard } from "@/components/evidence/source-evidence-card";
import type { EvidenceSourceItem } from "@/lib/evidence/types";
import { cn } from "@/lib/utils";

type EvidenceSourceListProps = {
  sources: EvidenceSourceItem[];
  onAnnotate?: (source: EvidenceSourceItem) => void;
  canAnnotate?: boolean;
  className?: string;
};

export function EvidenceSourceList({
  sources,
  onAnnotate,
  canAnnotate = false,
  className,
}: EvidenceSourceListProps) {
  if (sources.length === 0) {
    return (
      <div
        className={cn(
          "rounded-md border border-dashed border-cited-line bg-cited-surface/60 px-3 py-4",
          className,
        )}
      >
        <p className="type-micro text-cited-ink-faint">Sources</p>
        <p className="mt-2 type-body-sm text-cited-ink-muted">
          No attributable source evidence was retained for this observation.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <p className="type-micro text-cited-ink-faint">Sources</p>
      <ul className="space-y-2" aria-label="Evidence sources">
        {sources.map((source) => (
          <li key={source.id}>
            <SourceEvidenceCard
              source={source}
              canAnnotate={canAnnotate}
              onAnnotate={onAnnotate}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
