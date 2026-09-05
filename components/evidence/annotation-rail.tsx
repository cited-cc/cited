"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { AnnotationCard } from "@/components/evidence/annotation-card";
import {
  AnnotationComposer,
  type AnnotationComposerTarget,
} from "@/components/evidence/annotation-composer";
import { AnnotationEmptyState } from "@/components/evidence/annotation-empty-state";
import { Button } from "@/components/ui/button";
import type { CitationAnnotationItem } from "@/lib/evidence/types";
import { cn } from "@/lib/utils";

type AnnotationRailProps = {
  eventId: string;
  annotations: CitationAnnotationItem[];
  canAnnotate: boolean;
  composerTarget?: AnnotationComposerTarget | null;
  onComposerTargetChange?: (target: AnnotationComposerTarget | null) => void;
  className?: string;
};

export function AnnotationRail({
  eventId,
  annotations,
  canAnnotate,
  composerTarget: controlledTarget,
  onComposerTargetChange,
  className,
}: AnnotationRailProps) {
  const router = useRouter();
  const [internalTarget, setInternalTarget] =
    useState<AnnotationComposerTarget | null>(null);
  const target = controlledTarget ?? internalTarget;

  function setTarget(next: AnnotationComposerTarget | null) {
    if (onComposerTargetChange) onComposerTargetChange(next);
    else setInternalTarget(next);
  }

  return (
    <aside className={cn("space-y-4", className)} aria-label="Annotations">
      <div className="flex items-center justify-between gap-2">
        <p className="type-micro text-cited-ink-faint">Annotations</p>
        {canAnnotate && !target ? (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => setTarget({ kind: "event" })}
          >
            Add note
          </Button>
        ) : null}
      </div>

      {target ? (
        <AnnotationComposer
          eventId={eventId}
          target={target}
          onCancel={() => setTarget(null)}
          onSaved={() => {
            setTarget(null);
            router.refresh();
          }}
        />
      ) : null}

      {annotations.length === 0 && !target ? (
        <AnnotationEmptyState
          canAnnotate={canAnnotate}
          onAdd={() => setTarget({ kind: "event" })}
        />
      ) : (
        <ul className="space-y-2">
          {annotations.map((annotation) => (
            <li key={annotation.id}>
              <AnnotationCard
                annotation={annotation}
                eventId={eventId}
                onChanged={() => router.refresh()}
              />
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
