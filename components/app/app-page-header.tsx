"use client";

import { Bell, Search } from "lucide-react";
import Link from "next/link";

import { useAppChrome } from "@/components/app/app-shell";
import { cn } from "@/lib/utils";

type AppPageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  showCommand?: boolean;
};

export function AppPageHeader({
  title,
  description,
  eyebrow,
  meta,
  actions,
  className,
  showCommand = true,
}: AppPageHeaderProps) {
  const { openCommand } = useAppChrome();

  return (
    <header
      className={cn(
        "border-b border-cited-line-subtle px-4 py-5 sm:px-6 lg:px-8",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {eyebrow ? <p className="mb-1.5 type-micro">{eyebrow}</p> : null}
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="type-heading">{title}</h1>
            {meta}
          </div>
          {description ? (
            <p className="mt-1.5 max-w-2xl type-body">{description}</p>
          ) : null}
        </div>
        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          {showCommand ? (
            <button
              type="button"
              onClick={openCommand}
              className="inline-flex h-8 items-center gap-2 rounded-md border border-cited-line bg-cited-surface px-2.5 text-cited-ink-muted transition hover:border-cited-line-strong hover:bg-cited-surface-hover hover:text-cited-ink"
            >
              <Search className="h-3.5 w-3.5" aria-hidden />
              <span className="text-xs">Search</span>
              <kbd className="ml-1 rounded-sm border border-cited-line-subtle px-1.5 py-0.5 font-mono text-[10px] tracking-[0.06em] text-cited-ink-faint">
                ⌘K
              </kbd>
            </button>
          ) : null}
          <Link
            href="/app/settings/notifications"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-cited-ink-muted transition hover:bg-cited-surface-hover hover:text-cited-ink"
            aria-label="Notification settings"
            title="Notification settings"
          >
            <Bell className="h-4 w-4" />
          </Link>
          {actions}
        </div>
        {actions ? <div className="flex shrink-0 lg:hidden">{actions}</div> : null}
      </div>
    </header>
  );
}
