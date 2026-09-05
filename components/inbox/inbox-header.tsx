"use client";

import { Filter, RefreshCw, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";

type InboxHeaderProps = {
  newCount: number | null;
  activeFilterCount: number;
  onOpenSearch: () => void;
  onOpenFilters: () => void;
  className?: string;
};

export function InboxHeader({
  newCount,
  activeFilterCount,
  onOpenSearch,
  onOpenFilters,
  className,
}: InboxHeaderProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <header
      className={cn(
        "border-b border-cited-line-subtle px-4 py-5 sm:px-6 lg:px-8",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-1.5 type-micro text-cited-citation">
            [ CITATION INBOX ]
          </p>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="type-heading">Inbox</h1>
            {newCount !== null && newCount > 0 ? (
              <span className="font-mono text-xs tracking-[0.06em] text-cited-accent">
                {newCount} new
              </span>
            ) : null}
          </div>
          <p className="mt-1.5 max-w-2xl type-body">
            No vanity dashboard. Just the evidence from monitored AI answers.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <IconButton
            label="Search inbox"
            icon={<Search className="h-4 w-4" />}
            onClick={onOpenSearch}
          />
          <Button
            type="button"
            variant="subtle"
            size="sm"
            leftIcon={<Filter className="h-3.5 w-3.5" aria-hidden />}
            onClick={onOpenFilters}
            aria-label={
              activeFilterCount > 0
                ? `Filters, ${activeFilterCount} active`
                : "Filters"
            }
          >
            Filters
            {activeFilterCount > 0 ? (
              <span className="ml-1 font-mono text-[10px] text-cited-accent">
                {activeFilterCount}
              </span>
            ) : null}
          </Button>
          <IconButton
            label="Refresh inbox"
            icon={
              <RefreshCw
                className={cn("h-4 w-4", pending && "animate-spin")}
                aria-hidden
              />
            }
            disabled={pending}
            onClick={() =>
              startTransition(() => {
                router.refresh();
              })
            }
          />
        </div>
      </div>
    </header>
  );
}
