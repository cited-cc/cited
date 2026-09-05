"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(
      JSON.stringify({
        level: "error",
        message: "app_error_boundary",
        digest: error.digest ?? null,
        timestamp: new Date().toISOString(),
      }),
    );
  }, [error]);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <Callout tone="danger" title="Workspace unavailable">
        <p>
          This workspace view could not be loaded. Try again in a moment, or
          return to the inbox.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={reset}>
            Try again
          </Button>
          <Button href="/app/inbox" variant="ghost" size="sm">
            Open inbox
          </Button>
        </div>
      </Callout>
    </div>
  );
}
