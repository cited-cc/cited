"use client";

import { ExternalLink, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";

import { AccountMenuSwitcher } from "@/components/app/account-menu-switcher";
import { useAppChrome } from "@/components/app/app-shell";
import {
  DomainSwitcher,
  type DomainSwitcherOption,
} from "@/components/app/domain-switcher";

import {
  AlertSlip,
  CitationDeskGlyph,
  NotebookGlyph,
  OccurrenceLedger,
  PromptGlyph,
  SourceSlip,
} from "@/components/shared/cited-glyphs";
import { CitedLogo } from "@/components/shared/cited-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavGlyph = ComponentType<{ className?: string; size?: number }>;

const NAV_ITEMS: {
  href: string;
  label: string;
  icon: NavGlyph;
  exact: boolean;
}[] = [
  { href: "/app", label: "Signal Desk", icon: CitationDeskGlyph, exact: true },
  { href: "/app/inbox", label: "Inbox", icon: OccurrenceLedger, exact: false },
  { href: "/app/monitors", label: "Monitors", icon: PromptGlyph, exact: false },
  { href: "/app/notebook", label: "Notebook", icon: NotebookGlyph, exact: false },
  { href: "/app/settings", label: "Settings", icon: SourceSlip, exact: false },
];

type AppSidebarProps = {
  className?: string;
  onNavigate?: () => void;
  workspaceName: string;
  planName: string;
  planLabel: string;
  billingStatusLabel: string | null;
  domains?: DomainSwitcherOption[];
  activeDomainId?: string | null;
  showDomainSwitcher?: boolean;
  canAddDomain?: boolean;
};

export function AppSidebar({
  className,
  onNavigate,
  workspaceName,
  planName,
  planLabel,
  billingStatusLabel,
  domains = [],
  activeDomainId = null,
  showDomainSwitcher = false,
  canAddDomain = false,
}: AppSidebarProps) {
  const pathname = usePathname();
  const { openCreateMonitor } = useAppChrome();

  function isActive(href: string, exact?: boolean) {
    if (exact || href === "/app") return pathname === "/app";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside
      className={cn(
        "flex h-full w-[272px] shrink-0 flex-col border-r border-cited-line bg-cited-canvas-elevated",
        className,
      )}
    >
      <div className="flex items-center px-4 py-4">
        <CitedLogo href="/app" markSize={22} onClick={onNavigate} />
      </div>

      <div className="px-3 pb-3">
        <Button
          variant="primary"
          size="sm"
          className="w-full justify-start"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => {
            onNavigate?.();
            openCreateMonitor();
          }}
        >
          New monitor
        </Button>
      </div>

      {showDomainSwitcher ? (
        <div className="px-3 pb-3">
          <DomainSwitcher
            domains={domains}
            activeDomainId={activeDomainId}
            canAddDomain={canAddDomain}
          />
        </div>
      ) : null}

      <nav className="flex flex-1 flex-col gap-0.5 px-2" aria-label="App">
        <p className="mb-2 px-3 type-micro text-cited-ink-faint">
          Citation command desk
        </p>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href, item.exact);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors duration-150",
                active
                  ? "bg-cited-surface-raised text-cited-ink-strong"
                  : "text-cited-ink-muted hover:bg-cited-surface-hover hover:text-cited-ink",
              )}
            >
              {active ? (
                <span
                  className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-cited-citation"
                  aria-hidden
                />
              ) : null}
              <Icon
                size={18}
                className={cn(
                  "shrink-0",
                  active ? "text-cited-citation" : "text-cited-ink-subtle",
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-2 border-t border-cited-line-subtle px-3 py-3">
        <div className="rounded-md border border-cited-line-subtle bg-cited-surface px-3 py-2">
          <p className="type-micro text-cited-ink-faint">Workspace</p>
          <p className="mt-0.5 truncate text-sm font-medium text-cited-ink">
            {workspaceName}
          </p>
          <p className="mt-0.5 truncate type-meta text-cited-ink-subtle">
            {planName}
            {planLabel ? ` · ${planLabel}` : null}
            {billingStatusLabel ? ` · ${billingStatusLabel}` : null}
          </p>
        </div>

        <div className="rounded-md border border-cited-line-subtle bg-cited-surface">
          <div className="p-1.5">
            <AccountMenuSwitcher avatarSize="sm" />
          </div>

          <div className="grid grid-cols-2 divide-x divide-cited-line-subtle border-t border-cited-line-subtle">
            <Link
              href="/app/billing"
              onClick={onNavigate}
              aria-current={isActive("/app/billing") ? "page" : undefined}
              className={cn(
                "flex items-center justify-center gap-1.5 px-2 py-2.5 text-xs transition-colors duration-150",
                isActive("/app/billing")
                  ? "bg-cited-surface-raised text-cited-ink"
                  : "text-cited-ink-muted hover:bg-cited-surface-hover hover:text-cited-ink",
              )}
            >
              <AlertSlip
                size={14}
                className={
                  isActive("/app/billing")
                    ? "text-cited-citation"
                    : "text-cited-ink-subtle"
                }
              />
              Billing
            </Link>
            <Link
              href="/docs"
              target="_blank"
              rel="noreferrer"
              onClick={onNavigate}
              className="flex items-center justify-center gap-1.5 px-2 py-2.5 text-xs text-cited-ink-muted transition-colors duration-150 hover:bg-cited-surface-hover hover:text-cited-ink"
            >
              <SourceSlip size={14} className="text-cited-ink-subtle" />
              Docs
              <ExternalLink
                className="h-3 w-3 text-cited-ink-faint"
                aria-hidden
              />
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
