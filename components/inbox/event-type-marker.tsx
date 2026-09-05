import type { CitationEventType } from "@/types/product";
import { eventTypeLabel } from "@/lib/inbox/serializers";
import { cn } from "@/lib/utils";

const MARKER_CLASS: Record<CitationEventType, string> = {
  citation: "bg-cited-accent-bright text-cited-accent-ink",
  mention: "bg-cited-accent text-cited-accent-ink",
  recommendation: "bg-cited-accent-bright text-cited-accent-ink",
  competitor_citation: "bg-cited-accent text-cited-accent-ink",
  missed_opportunity: "bg-cited-accent text-cited-accent-ink",
};

type EventTypeMarkerProps = {
  type: CitationEventType;
  className?: string;
  showLabel?: boolean;
};

export function EventTypeMarker({
  type,
  className,
  showLabel = true,
}: EventTypeMarkerProps) {
  const label = eventTypeLabel(type);
  const [dotClass, textClass] = MARKER_CLASS[type].split(" ");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.16em] uppercase",
        textClass,
        className,
      )}
      aria-label={`Event type: ${label}`}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dotClass)} aria-hidden />
      {showLabel ? label : null}
    </span>
  );
}
