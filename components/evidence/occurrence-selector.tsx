"use client";

import { useRouter } from "next/navigation";

import type { OccurrenceLedgerItem } from "@/lib/evidence/types";
import { cn } from "@/lib/utils";

type OccurrenceSelectorProps = {
  occurrences: OccurrenceLedgerItem[];
  eventId: string;
  selectedOccurrenceId: string;
  className?: string;
};

export function OccurrenceSelector({
  occurrences,
  eventId,
  selectedOccurrenceId,
  className,
}: OccurrenceSelectorProps) {
  const router = useRouter();

  if (occurrences.length <= 1) return null;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <label
        htmlFor="occurrence-selector"
        className="type-micro shrink-0 text-cited-ink-faint"
      >
        Observation
      </label>
      <select
        id="occurrence-selector"
        className="h-8 min-w-0 flex-1 rounded-sm border border-cited-line bg-cited-canvas-elevated px-2 font-mono text-[11px] text-cited-ink focus-visible:border-cited-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cited-accent/40"
        value={selectedOccurrenceId}
        onChange={(e) => {
          const params = new URLSearchParams(window.location.search);
          params.set("occurrence", e.target.value);
          router.push(`/app/inbox/${eventId}?${params.toString()}`, {
            scroll: false,
          });
        }}
        aria-label="Select observation"
      >
        {occurrences.map((item) => (
          <option key={item.id} value={item.id}>
            {item.change.label}
            {item.sourceHostname ? ` · ${item.sourceHostname}` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
