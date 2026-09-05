"use client";

import { useRouter } from "next/navigation";

import { SURFACE_LABELS } from "@/components/shared/ai-surface-badge";
import type { OccurrenceLedgerItem } from "@/lib/evidence/types";
import {
  formatAbsoluteUtc,
  formatRelativeUtc,
} from "@/lib/inbox/serializers";
import { cn } from "@/lib/utils";

type OccurrenceRowProps = {
  occurrence: OccurrenceLedgerItem;
  eventId: string;
  className?: string;
};

export function OccurrenceRow({
  occurrence,
  eventId,
  className,
}: OccurrenceRowProps) {
  const router = useRouter();
  const surface = occurrence.aiSurface
    ? SURFACE_LABELS[occurrence.aiSurface]
    : null;

  function select() {
    const params = new URLSearchParams(window.location.search);
    params.set("occurrence", occurrence.id);
    router.push(`/app/inbox/${eventId}?${params.toString()}`, {
      scroll: false,
    });
  }

  return (
    <button
      type="button"
      role="option"
      aria-selected={occurrence.isSelected}
      onClick={select}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          select();
        }
      }}
      className={cn(
        "w-full rounded-md border px-3 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cited-accent/50",
        occurrence.isSelected
          ? "border-cited-accent/40 bg-cited-accent-muted/30"
          : "border-cited-line-subtle bg-cited-surface hover:border-cited-line hover:bg-cited-surface-hover",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <time
          dateTime={occurrence.observedAt}
          title={formatAbsoluteUtc(occurrence.observedAt)}
          className="font-mono text-xs text-cited-ink"
        >
          {formatRelativeUtc(occurrence.observedAt)}
        </time>
        <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-cited-ink-faint">
          {occurrence.change.label}
        </span>
      </div>
      <p className="mt-1.5 font-mono text-[11px] text-cited-ink-muted">
        {[
          surface,
          occurrence.sourceHostname,
          occurrence.citationPosition != null
            ? `#${occurrence.citationPosition}`
            : null,
          occurrence.isFirst ? "First" : null,
          occurrence.isLatest ? "Latest" : null,
        ]
          .filter(Boolean)
          .join(" · ")}
      </p>
    </button>
  );
}
