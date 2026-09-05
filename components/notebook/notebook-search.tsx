"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Search } from "lucide-react";

import { TextInput } from "@/components/ui/input";
import {
  buildNotebookHref,
  normalizeNotebookSearch,
} from "@/lib/notebook/query-state";
import type { NotebookFilters } from "@/lib/notebook/types";
import { cn } from "@/lib/utils";

type NotebookSearchProps = {
  filters: NotebookFilters;
  className?: string;
};

export function NotebookSearch({ filters, className }: NotebookSearchProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const serverSearch = filters.search ?? "";
  const [draft, setDraft] = useState({
    baseline: serverSearch,
    value: serverSearch,
  });

  const value = draft.baseline === serverSearch ? draft.value : serverSearch;

  function submit(next: string) {
    const search = normalizeNotebookSearch(next);
    startTransition(() => {
      router.push(buildNotebookHref(filters, { search, cursor: null }), {
        scroll: false,
      });
    });
  }

  return (
    <form
      className={cn("relative", className)}
      onSubmit={(e) => {
        e.preventDefault();
        submit(value);
      }}
      role="search"
    >
      <Search
        className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cited-ink-faint"
        aria-hidden
      />
      <TextInput
        value={value}
        onChange={(e) =>
          setDraft({
            baseline: serverSearch,
            value: e.target.value,
          })
        }
        onBlur={() => {
          if ((filters.search ?? "") !== (normalizeNotebookSearch(value) ?? "")) {
            submit(value);
          }
        }}
        placeholder="Search notes and linked citation context…"
        aria-label="Search notebook"
        className="pl-8"
        disabled={pending}
      />
    </form>
  );
}
