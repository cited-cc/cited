"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";

type AuthProviderShellProps = {
  children: ReactNode;
};

export function AuthProviderShell({ children }: AuthProviderShellProps) {
  return <SessionProvider>{children}</SessionProvider>;
}
