"use client";

import { AiSurfaceBadge } from "@/components/shared/ai-surface-badge";
import { Badge } from "@/components/ui/badge";
import { NoteCard } from "@/components/ui/note-card";
import {
  demoEventTypeLabel,
  type DemoEvent,
} from "@/lib/demo/demo-events";
import { cn } from "@/lib/utils";

type DemoEventCardProps = {
  event: DemoEvent;
  selected: boolean;
  saved: boolean;
  onSelect: () => void;
  onToggleSaved: () => void;
};

function variantFor(event: DemoEvent) {
  switch (event.eventType) {
    case "citation":
      return "citation" as const;
    case "mention":
      return "mention" as const;
    case "recommendation":
      return "default" as const;
    case "competitor_citation":
      return "competitor" as const;
    case "missed_opportunity":
      return "opportunity" as const;
    default: {
      const _exhaustive: never = event.eventType;
      return _exhaustive;
    }
  }
}

export function DemoEventCard({
  event,
  selected,
  saved,
  onSelect,
  onToggleSaved,
}: DemoEventCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg transition-shadow",
        selected && "ring-2 ring-cited-accent/50",
      )}
      data-testid="demo-event-card"
    >
      <NoteCard
        example
        variant={variantFor(event)}
        badge={demoEventTypeLabel(event.eventType)}
        title={event.title}
        meta={event.lastSeenLabel}
        footer={
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            <AiSurfaceBadge surface={event.surface} showMark={false} />
            <div className="flex items-center gap-2">
              {saved ? <Badge variant="success">Saved</Badge> : null}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSaved();
                }}
                className="type-meta text-cited-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cited-accent"
              >
                {saved ? "Unsave" : "Save"}
              </button>
            </div>
          </div>
        }
      >
        <button
          type="button"
          onClick={onSelect}
          className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cited-accent"
        >
          <p className="type-body-sm text-cited-ink-muted line-clamp-2">
            {event.prompt}
          </p>
          <p className="mt-2 type-meta text-cited-ink-subtle">
            {event.sourceHostname
              ? `${event.sourceHostname}${event.sourcePath ?? ""}`
              : "No direct source link detected"}
          </p>
        </button>
      </NoteCard>
    </div>
  );
}
