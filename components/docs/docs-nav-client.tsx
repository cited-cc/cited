"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Menu, Search, X } from "lucide-react";

import { DocsSidebar } from "@/components/docs/docs-primitives";
import { TextInput } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { searchDocs } from "@/lib/content/docs";
import { cn } from "@/lib/utils";

export function DocsSearchBox({ className }: { className?: string }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchDocs(query), [query]);

  return (
    <div className={cn("relative", className)}>
      <label htmlFor="docs-search" className="sr-only">
        Search docs
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cited-ink-subtle"
          aria-hidden
        />
        <TextInput
          id="docs-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search docs"
          className="pl-9"
          aria-describedby="docs-search-hint"
          autoComplete="off"
        />
      </div>
      <p id="docs-search-hint" className="mt-1.5 type-meta text-cited-ink-faint">
        Searches article titles, descriptions, and headings.
      </p>
      {query.trim() ? (
        <div
          role="listbox"
          aria-label="Search results"
          className="absolute z-20 mt-2 max-h-72 w-full overflow-auto rounded-md border border-cited-line bg-cited-surface-raised p-2 cited-overlay-shadow"
        >
          {results.length === 0 ? (
            <p className="px-2 py-3 type-body-sm text-cited-ink-subtle">
              No matching docs.
            </p>
          ) : (
            <ul className="space-y-1">
              {results.map((result) => (
                <li key={`${result.slug}-${result.href}`}>
                  <Link
                    href={result.href}
                    className="block rounded-md px-2 py-2 hover:bg-cited-surface-hover"
                    role="option"
                  >
                    <p className="text-sm text-cited-ink-strong">{result.title}</p>
                    <p className="mt-0.5 type-meta text-cited-ink-faint">
                      {result.match}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function DocsMobileNav({ currentSlug }: { currentSlug?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        leftIcon={open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="docs-mobile-nav"
      >
        Docs menu
      </Button>
      {open ? (
        <div
          id="docs-mobile-nav"
          className="mt-3 rounded-md border border-cited-line bg-cited-surface p-4"
        >
          <DocsSidebar
            currentSlug={currentSlug}
            className="max-h-[60vh] overflow-y-auto"
          />
        </div>
      ) : null}
    </div>
  );
}
