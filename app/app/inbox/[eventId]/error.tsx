"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { logger } from "@/lib/security/logger";

export default function InboxEventError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("inbox_event_page_error", {
      digest: error.digest ?? null,
      message: "Focused citation note failed to render",
    });
  }, [error]);

  return (
    <div className="px-4 py-10 sm:px-6 lg:px-8">
      <EmptyState
        title="This citation note could not be loaded."
        description="Something went wrong while opening the evidence. Try again, or return to your Inbox."
        action={
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="primary" size="sm" onClick={reset}>
              Retry
            </Button>
            <Button href="/app/inbox" variant="ghost" size="sm">
              Back to Inbox
            </Button>
          </div>
        }
      />
    </div>
  );
}
