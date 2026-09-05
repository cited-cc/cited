"use client";

import { Bell, Search } from "lucide-react";
import Link from "next/link";

import { CitedLogo } from "@/components/shared/cited-logo";
import { IconButton } from "@/components/ui/icon-button";

type MobileAppHeaderProps = {
  onOpenNav: () => void;
  onOpenCommand: () => void;
};

export function MobileAppHeader({
  onOpenNav,
  onOpenCommand,
}: MobileAppHeaderProps) {
  return (
    <div className="sticky top-0 z-30 border-b border-cited-line-subtle bg-cited-canvas/95 pt-[env(safe-area-inset-top,0px)] lg:hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-1">
          <IconButton
            label="Open navigation"
            className="h-11 w-11"
            icon={
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden
              >
                <path
                  d="M2.5 4.5h11M2.5 8h11M2.5 11.5h11"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </svg>
            }
            onClick={onOpenNav}
          />
          <CitedLogo href="/app" markSize={20} />
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <IconButton
            label="Open command menu"
            className="h-11 w-11"
            icon={<Search className="h-4 w-4" />}
            onClick={onOpenCommand}
          />
          <Link
            href="/app/settings/notifications"
            className="inline-flex h-11 w-11 items-center justify-center rounded-md text-cited-ink-muted transition hover:bg-cited-surface-hover hover:text-cited-ink"
            aria-label="Notification settings"
            title="Notification settings"
          >
            <Bell className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
