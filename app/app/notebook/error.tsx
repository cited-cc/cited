"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { logger } from "@/lib/security/logger";

export default function NotebookError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("notebook_page_error", {
      digest: error.digest ?? null,
      message: "Notebook failed to render",
    });
  }, [error]);

  return (
    <div className="px-4 py-10 sm:px-6 lg:px-8">
      <EmptyState
        title="Notebook could not be loaded."
        description="Something went wrong while opening your notes. Try again."
        action={
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="primary" size="sm" onClick={reset}>
              Retry
            </Button>
            <Button href="/app" variant="ghost" size="sm">
              Open Signal Desk
            </Button>
          </div>
        }
      />
    </div>
  );
}
