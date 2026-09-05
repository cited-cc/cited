"use client";

import { useState, useTransition } from "react";

import { OccurrenceRow } from "@/components/evidence/occurrence-row";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { loadMoreOccurrencesAction } from "@/lib/evidence/actions";
import type { OccurrenceLedgerItem } from "@/lib/evidence/types";
import { cn } from "@/lib/utils";

type OccurrenceLedgerProps = {
  eventId: string;
  occurrences: OccurrenceLedgerItem[];
  hasMore: boolean;
  nextCursor: string | null;
  className?: string;
};

export function OccurrenceLedger({
  eventId,
  occurrences: initial,
  hasMore: initialHasMore,
  nextCursor: initialCursor,
  className,
}: OccurrenceLedgerProps) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [items, setItems] = useState(initial);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [cursor, setCursor] = useState(initialCursor);

  return (
    <section className={cn("space-y-3", className)} aria-label="Occurrence ledger">
      <p className="type-micro text-cited-ink-faint">Observation history</p>
      <div
        role="listbox"
        aria-label="Observations"
        className="space-y-2"
      >
        {items.map((occurrence) => (
          <OccurrenceRow
            key={occurrence.id}
            occurrence={occurrence}
            eventId={eventId}
          />
        ))}
      </div>

      {hasMore && cursor ? (
        <div className="flex justify-center pt-1">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            loading={pending}
            onClick={() => {
              startTransition(async () => {
                const result = await loadMoreOccurrencesAction({
                  eventId,
                  cursor,
                });
                if (!result.ok) {
                  toast({
                    title: "Could not load more",
                    description: result.error,
                    tone: "danger",
                  });
                  return;
                }
                setItems((prev) => [...prev, ...result.items]);
                setHasMore(result.hasMore);
                setCursor(result.nextCursor);
              });
            }}
          >
            Load more
          </Button>
        </div>
      ) : null}
    </section>
  );
}
