"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";

import { IconButton } from "@/components/ui/icon-button";
import { buildInboxHref, normalizeInboxSearch } from "@/lib/inbox/filters";
import { INBOX_SEARCH_MAX_LENGTH, type InboxFilters } from "@/lib/inbox/types";
import { trackProductEvent } from "@/lib/analytics/product";
import { cn } from "@/lib/utils";

type InboxSearchProps = {
  filters: InboxFilters;
  autoFocus?: boolean;
  onClose?: () => void;
  className?: string;
};

export function InboxSearch({
  filters,
  autoFocus = false,
  onClose,
  className,
}: InboxSearchProps) {
  const router = useRouter();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const serverSearch = filters.search ?? "";
  const [draft, setDraft] = useState<{
    baseline: string;
    value: string;
  }>({ baseline: serverSearch, value: serverSearch });

  const value =
    draft.baseline === serverSearch ? draft.value : serverSearch;

  const [, startTransition] = useTransition();

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const next = normalizeInboxSearch(value);
      const current = filters.search;
      if (next === current) return;
      trackProductEvent("inbox_search_used", {
        filter_category: next ? "query" : "cleared",
      });
      startTransition(() => {
        router.push(
          buildInboxHref(filters, {
            search: next,
            cursor: null,
            selectedEventId: null,
          }),
          { scroll: false },
        );
      });
    }, 320);
    return () => window.clearTimeout(handle);
  }, [value, filters, router]);

  return (
    <div className={cn("relative", className)}>
      <label htmlFor={inputId} className="sr-only">
        Search prompts, sources, or citation evidence
      </label>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cited-ink-faint"
        aria-hidden
      />
      <input
        ref={inputRef}
        id={inputId}
        type="search"
        value={value}
        maxLength={INBOX_SEARCH_MAX_LENGTH}
        placeholder="Search prompts, sources, or citation evidence…"
        className="h-9 w-full rounded-md border border-cited-line bg-cited-surface pl-9 pr-9 text-sm text-cited-ink placeholder:text-cited-ink-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cited-accent/40"
        onChange={(e) =>
          setDraft({ baseline: serverSearch, value: e.target.value })
        }
      />
      {value || onClose ? (
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
          <IconButton
            label={value ? "Clear search" : "Close search"}
            size="sm"
            icon={<X className="h-3.5 w-3.5" />}
            onClick={() => {
              if (value) {
                setDraft({ baseline: serverSearch, value: "" });
              } else {
                onClose?.();
              }
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
