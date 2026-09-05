"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { getPublicDeploymentMode } from "@/lib/deployment/public-config";
import { cn } from "@/lib/utils";

const SETTINGS_LINKS = [
  { href: "/app/settings", label: "Overview", match: "exact" as const },
  { href: "/app/settings/workspace", label: "Workspace", match: "prefix" as const },
  { href: "/app/settings/domains", label: "Domains", match: "prefix" as const },
  {
    href: "/app/settings/notifications",
    label: "Notifications",
    match: "prefix" as const,
  },
  { href: "/app/settings/account", label: "Account", match: "prefix" as const },
  { href: "/app/settings/security", label: "Security", match: "prefix" as const },
  { href: "/app/settings/deployment", label: "Deployment", match: "prefix" as const },
  { href: "/app/settings/provider", label: "Provider", match: "prefix" as const },
  { href: "/app/billing", label: "Billing", match: "prefix" as const },
];

export function SettingsSubnav({
  canManageBilling,
}: {
  canManageBilling: boolean;
}) {
  const pathname = usePathname();
  const cloudBilling = getPublicDeploymentMode() === "cloud";
  const links = SETTINGS_LINKS.filter((link) => {
    if (link.href === "/app/billing" && (!canManageBilling || !cloudBilling)) {
      return false;
    }
    return true;
  });

  return (
    <nav
      aria-label="Settings"
      className="flex gap-1 overflow-x-auto border-b border-cited-line-subtle px-4 sm:px-6 lg:px-8"
    >
      {links.map((link) => {
        const active =
          link.match === "exact"
            ? pathname === link.href
            : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "shrink-0 border-b-2 px-3 py-3 text-sm transition",
              active
                ? "border-cited-accent text-cited-ink-strong"
                : "border-transparent text-cited-ink-muted hover:text-cited-ink",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
