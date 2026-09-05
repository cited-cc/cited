"use client";

import { AccountMenu } from "@/components/app/account-menu";
import { LocalAccountMenu } from "@/components/app/local-account-menu";
import { getPublicAuthProvider } from "@/lib/auth/public-config";

type AccountMenuSwitcherProps = {
  className?: string;
  avatarSize?: "sm" | "md" | "lg";
};

export function AccountMenuSwitcher(props: AccountMenuSwitcherProps) {
  const provider = getPublicAuthProvider();

  if (provider === "local") {
    return <LocalAccountMenu {...props} />;
  }

  return <AccountMenu {...props} />;
}
