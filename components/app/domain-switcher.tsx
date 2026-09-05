"use client";

import { ChevronDown, Globe, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  type DropdownItem,
} from "@/components/ui/dropdown-menu";
import { switchActiveDomainAction } from "@/lib/domains/actions";
import { cn } from "@/lib/utils";
import type { DomainVerificationStatus } from "@/types/product";

export type DomainSwitcherOption = {
  id: string;
  hostname: string;
  verificationStatus: DomainVerificationStatus;
};

type DomainSwitcherProps = {
  domains: DomainSwitcherOption[];
  activeDomainId: string | null;
  canAddDomain?: boolean;
  className?: string;
};

function statusLabel(status: DomainVerificationStatus): string {
  switch (status) {
    case "verified":
      return "Verified";
    case "pending":
      return "Pending";
    case "disabled":
      return "Disabled";
    case "failed":
      return "Failed";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function statusVariant(
  status: DomainVerificationStatus,
): "success" | "warning" | "neutral" | "danger" {
  if (status === "verified") return "success";
  if (status === "pending") return "warning";
  if (status === "failed") return "danger";
  return "neutral";
}

export function DomainSwitcher({
  domains,
  activeDomainId,
  canAddDomain = false,
  className,
}: DomainSwitcherProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (domains.length === 0) {
    return null;
  }

  const active =
    domains.find((domain) => domain.id === activeDomainId) ?? domains[0];

  function handleSelect(domainId: string) {
    if (domainId === active?.id) return;
    startTransition(async () => {
      const result = await switchActiveDomainAction(domainId);
      if (result.ok) {
        router.refresh();
      }
    });
  }

  const menuItems: DropdownItem[] = [
    ...domains.map((domain) => ({
      id: domain.id,
      label: domain.hostname,
      disabled: pending,
      onSelect: () => handleSelect(domain.id),
    })),
    ...(canAddDomain
      ? [
          {
            id: "add-domain",
            label: "Add domain",
            disabled: pending,
            icon: <Plus className="h-3.5 w-3.5" aria-hidden />,
            separatorBefore: true,
            onSelect: () => router.push("/app/settings/domains?add=1"),
          } satisfies DropdownItem,
        ]
      : []),
  ];

  const showDropdown = domains.length > 1 || canAddDomain;

  if (!showDropdown) {
    return (
      <div
        className={cn(
          "flex h-9 w-full min-h-9 items-center gap-2 rounded-[var(--cited-radius-sm)] border border-cited-line-subtle bg-cited-surface px-3",
          className,
        )}
      >
        <Globe className="h-3.5 w-3.5 shrink-0 text-cited-ink-subtle" />
        <span className="min-w-0 truncate text-sm text-cited-ink">
          {active.hostname}
        </span>
        <Badge variant={statusVariant(active.verificationStatus)}>
          {statusLabel(active.verificationStatus)}
        </Badge>
      </div>
    );
  }

  return (
    <DropdownMenu
      label="Switch domain"
      align="start"
      className={cn("w-full", className)}
      trigger={
        <button
          type="button"
          disabled={pending}
          className="flex h-9 w-full min-h-9 items-center justify-between gap-2 rounded-[var(--cited-radius-sm)] border border-cited-line-subtle bg-cited-surface px-3 text-left transition hover:bg-cited-surface-hover disabled:opacity-60"
        >
          <div className="flex min-w-0 items-center gap-2">
            <Globe className="h-3.5 w-3.5 shrink-0 text-cited-ink-subtle" />
            <span className="truncate text-sm text-cited-ink">
              {active.hostname}
            </span>
            <Badge variant={statusVariant(active.verificationStatus)}>
              {statusLabel(active.verificationStatus)}
            </Badge>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-cited-ink-subtle" />
        </button>
      }
      items={menuItems}
    />
  );
}
