import type { InboxMemberState } from "@/lib/inbox/types";
import { cn } from "@/lib/utils";

type MemberStateMarkerProps = {
  state: InboxMemberState;
  className?: string;
};

export function MemberStateMarker({ state, className }: MemberStateMarkerProps) {
  const markers: Array<{ key: string; label: string; className: string }> = [];

  if (!state.seenAt) {
    markers.push({
      key: "new",
      label: "New",
      className: "text-cited-accent",
    });
  }
  if (state.savedAt) {
    markers.push({
      key: "saved",
      label: "Saved",
      className: "text-cited-citation",
    });
  }
  if (state.archivedAt) {
    markers.push({
      key: "archived",
      label: "Archived",
      className: "text-cited-ink-faint",
    });
  }
  if (state.resolvedAt) {
    markers.push({
      key: "resolved",
      label: "Resolved",
      className: "text-cited-ink-muted",
    });
  }

  if (markers.length === 0) return null;

  return (
    <span className={cn("inline-flex flex-wrap items-center gap-2", className)}>
      {markers.map((marker) => (
        <span
          key={marker.key}
          className={cn(
            "font-mono text-[10px] tracking-[0.1em] uppercase",
            marker.className,
          )}
        >
          {marker.label}
        </span>
      ))}
    </span>
  );
}
