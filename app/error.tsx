"use client";

import { useEffect } from "react";
import Link from "next/link";

import { CitedLogo } from "@/components/shared/cited-logo";
import { Button } from "@/components/ui/button";

export default function RootError({
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
        message: "root_error_boundary",
        digest: error.digest ?? null,
        timestamp: new Date().toISOString(),
      }),
    );
  }, [error]);

  return (
    <div className="cited-atmosphere cited-grain flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <CitedLogo href="/" markSize={28} />
      <h1 className="mt-10 type-heading text-[clamp(1.75rem,4vw,2.5rem)]">
        Something went wrong
      </h1>
      <p className="mt-4 max-w-md text-center type-body text-cited-ink-muted">
        Cited hit an unexpected error. Your data is safe. Try again, or open
        docs for troubleshooting.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button type="button" variant="primary" size="md" onClick={reset}>
          Try again
        </Button>
        <Button href="/" variant="secondary" size="md">
          Back to Cited
        </Button>
      </div>
      <p className="mt-10 type-meta">
        <Link href="/docs/troubleshooting" className="hover:text-cited-ink">
          Troubleshooting
        </Link>
        {" · "}
        <Link href="/contact" className="hover:text-cited-ink">
          Contact
        </Link>
      </p>
    </div>
  );
}
