import type { Metadata } from "next";

import { AuthProviderShell } from "@/components/auth/auth-provider-shell";
import { LocalSessionProvider } from "@/components/auth/local-session-provider";
import { isLocalAuthProvider } from "@/lib/auth/config";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const shell = <AuthProviderShell>{children}</AuthProviderShell>;
  if (isLocalAuthProvider()) {
    return <LocalSessionProvider>{shell}</LocalSessionProvider>;
  }
  return shell;
}
