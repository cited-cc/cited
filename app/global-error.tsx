"use client";

import { useEffect } from "react";

import { CitedLogo } from "@/components/shared/cited-logo";
import { Button } from "@/components/ui/button";

export default function GlobalError({
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
        message: "global_error_boundary",
        digest: error.digest ?? null,
        timestamp: new Date().toISOString(),
      }),
    );
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-black px-6 py-16 text-white">
        <CitedLogo href="/" markSize={28} />
        <h1 className="mt-10 text-center text-2xl font-semibold tracking-tight">
          Something went wrong
        </h1>
        <p className="mt-4 max-w-md text-center text-sm text-white/70">
          Cited could not finish loading this page. Try again, or return home.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button type="button" variant="primary" size="md" onClick={reset}>
            Try again
          </Button>
          <Button href="/" variant="secondary" size="md">
            Back to Cited
          </Button>
        </div>
      </body>
    </html>
  );
}
