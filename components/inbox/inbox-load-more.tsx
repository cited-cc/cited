"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { loadMoreInboxEventsAction } from "@/lib/inbox/actions";
import { serializeInboxSearchParams } from "@/lib/inbox/filters";
import type { InboxEventListItem, InboxFilters } from "@/lib/inbox/types";

type InboxLoadMoreProps = {
  filters: InboxFilters;
  nextCursor: string;
  onLoaded: (result: {
    items: InboxEventListItem[];
    nextCursor: string | null;
    hasMore: boolean;
  }) => void;
};

export function InboxLoadMore({
  filters,
  nextCursor,
  onLoaded,
}: InboxLoadMoreProps) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex justify-center py-4">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        loading={pending}
        onClick={() => {
          startTransition(async () => {
            const queryString = serializeInboxSearchParams(filters, {
              includeCursor: false,
              includeEvent: false,
            }).toString();
            const result = await loadMoreInboxEventsAction({
              cursor: nextCursor,
              queryString,
            });
            if (!result.ok) {
              toast({
                title: "Could not load more",
                description: result.error,
                tone: "danger",
              });
              return;
            }
            onLoaded({
              items: result.items,
              nextCursor: result.nextCursor,
              hasMore: result.hasMore,
            });
          });
        }}
      >
        Load more
      </Button>
    </div>
  );
}
