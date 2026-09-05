"use client";

import { AiSurfaceBadge } from "@/components/shared/ai-surface-badge";
import { Card, CardBody } from "@/components/ui/card";
import type { DemoOccurrence } from "@/lib/demo/demo-notes";
import { cn } from "@/lib/utils";

type DemoOccurrenceSelectorProps = {
  occurrences: DemoOccurrence[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function DemoOccurrenceSelector({
  occurrences,
  selectedId,
  onSelect,
}: DemoOccurrenceSelectorProps) {
  return (
    <Card className="bg-cited-surface" data-testid="demo-occurrence-selector">
      <CardBody>
        <p className="type-micro mb-3">Occurrence history</p>
        <ul className="space-y-2" role="listbox" aria-label="Occurrences">
          {occurrences.map((occurrence) => {
            const selected = occurrence.id === selectedId;
            return (
              <li key={occurrence.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => onSelect(occurrence.id)}
                  className={cn(
                    "w-full rounded-md border px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cited-accent",
                    selected
                      ? "border-cited-accent/40 bg-cited-accent/5"
                      : "border-cited-line-subtle bg-cited-canvas-elevated hover:border-cited-line",
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="type-meta">{occurrence.seenAtLabel}</span>
                    <AiSurfaceBadge
                      surface={occurrence.surface}
                      showMark={false}
                    />
                  </div>
                  <p className="mt-2 type-body-sm text-cited-ink-muted line-clamp-3">
                    {occurrence.excerpt}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      </CardBody>
    </Card>
  );
}
