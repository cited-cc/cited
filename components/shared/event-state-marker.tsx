import type { CitationEventStatus } from "@/types/product";
import { cn } from "@/lib/utils";

const STATE_COPY: Record<CitationEventStatus, string> = {
  new: "New",
  seen: "Seen",
  saved: "Saved",
  archived: "Archived",
  resolved: "Resolved",
};

type EventStateMarkerProps = {
  state: CitationEventStatus;
  className?: string;
};

export function EventStateMarker({ state, className }: EventStateMarkerProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.08em] uppercase",
        state === "new" && "text-cited-accent",
        state === "seen" && "text-cited-ink-subtle",
        state === "saved" && "text-cited-citation",
        state === "archived" && "text-cited-ink-faint",
        state === "resolved" && "text-cited-ink-muted",
        className,
      )}
      aria-label={`Event state: ${STATE_COPY[state]}`}
    >
      <span
        className={cn(
          "h-1 w-1 rounded-full",
          state === "new" && "bg-cited-accent",
          state === "seen" && "bg-cited-ink-subtle",
          state === "saved" && "bg-cited-citation",
          state === "archived" && "bg-cited-ink-faint",
          state === "resolved" && "bg-cited-ink-muted",
        )}
        aria-hidden
      />
      {STATE_COPY[state]}
    </span>
  );
}
