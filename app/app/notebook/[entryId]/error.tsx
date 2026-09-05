"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { logger } from "@/lib/security/logger";

export default function NotebookEntryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("notebook_entry_page_error", {
      digest: error.digest ?? null,
      message: "Notebook entry failed to render",
    });
  }, [error]);

  return (
    <div className="px-4 py-10 sm:px-6 lg:px-8">
      <EmptyState
        title="This note could not be loaded."
        description="Something went wrong while opening the note. Try again, or return to Notebook."
        action={
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="primary" size="sm" onClick={reset}>
              Retry
            </Button>
            <Button href="/app/notebook" variant="ghost" size="sm">
              Back to Notebook
            </Button>
          </div>
        }
      />
    </div>
  );
}
