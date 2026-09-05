import Link from "next/link";

import { CitedLogo } from "@/components/shared/cited-logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="cited-atmosphere cited-grain flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <CitedLogo href="/" markSize={28} />
      <p className="mt-10 type-micro text-cited-citation">404</p>
      <h1 className="mt-3 type-heading text-[clamp(1.75rem,4vw,2.5rem)]">
        This page is not in the archive.
      </h1>
      <p className="mt-4 max-w-md text-center type-body text-cited-ink-muted">
        The link may be expired, mistyped, or no longer public.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button href="/" variant="primary" size="md">
          Back to Cited
        </Button>
        <Button href="/scan" variant="secondary" size="md">
          Check a domain
        </Button>
      </div>
      <p className="mt-10 type-meta">
        <Link href="/docs" className="hover:text-cited-ink">
          Documentation
        </Link>
      </p>
    </div>
  );
}
