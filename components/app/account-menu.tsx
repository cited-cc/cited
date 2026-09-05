"use client";

import { Bell, ChevronUp, LogOut, Shield, UserRound } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import { DitherAvatar } from "@/components/ui/dither-avatar";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type AccountMenuProps = {
  className?: string;
  avatarSize?: "sm" | "md" | "lg";
};

export function AccountMenu({
  className,
  avatarSize = "sm",
}: AccountMenuProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading" || !session?.user) {
    return (
      <div
        className={cn(
          "flex min-w-0 items-center gap-2.5 rounded-md px-1.5 py-1.5",
          className,
        )}
        aria-hidden
      >
        <div className="h-8 w-8 shrink-0 animate-pulse rounded-md border border-cited-line-subtle bg-cited-surface" />
        <div className="min-w-0 flex-1 space-y-1.5 py-0.5">
          <div className="h-3.5 w-24 animate-pulse rounded bg-cited-surface-hover" />
          <div className="h-3 w-32 max-w-full animate-pulse rounded bg-cited-surface-hover" />
        </div>
        <div className="h-3.5 w-3.5 shrink-0 animate-pulse rounded bg-cited-surface-hover" />
      </div>
    );
  }

  const seed = session.user.id;
  const email = session.user.email ?? "";
  const name = session.user.name || email || "Account";

  const menuItems = [
    {
      id: "account",
      label: "Account settings",
      icon: <UserRound className="h-3.5 w-3.5" aria-hidden />,
      onSelect: () => router.push("/app/settings/account"),
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: <Bell className="h-3.5 w-3.5" aria-hidden />,
      onSelect: () => router.push("/app/settings/notifications"),
    },
    {
      id: "security",
      label: "Security",
      icon: <Shield className="h-3.5 w-3.5" aria-hidden />,
      onSelect: () => router.push("/app/settings/security"),
    },
    {
      id: "sign-out",
      label: "Sign out",
      icon: <LogOut className="h-3.5 w-3.5" aria-hidden />,
      danger: true,
      separatorBefore: true,
      onSelect: () => {
        void signOut({ callbackUrl: "/" });
      },
    },
  ];

  return (
    <DropdownMenu
      label="Account menu"
      align="start"
      side="top"
      portal
      menuMinWidth={232}
      className={cn("w-full", className)}
      trigger={
        <button
          type="button"
          className="flex w-full min-w-0 items-center gap-2.5 rounded-md px-1.5 py-1.5 text-left transition-colors duration-150 hover:bg-cited-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cited-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-cited-surface"
          aria-label={`${name} account menu`}
        >
          <DitherAvatar seed={seed} size={avatarSize} title={name} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-cited-ink">
              {name}
            </span>
            {email ? (
              <span className="block truncate type-meta text-cited-ink-subtle">
                {email}
              </span>
            ) : null}
          </span>
          <ChevronUp
            className="h-3.5 w-3.5 shrink-0 text-cited-ink-faint transition-transform duration-150 group-data-[state=open]:rotate-180"
            aria-hidden
          />
        </button>
      }
      items={menuItems}
    />
  );
}
