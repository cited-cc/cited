import { redirect } from "next/navigation";

import { AuthProviderShell } from "@/components/auth/auth-provider-shell";
import { LocalSessionProvider } from "@/components/auth/local-session-provider";
import {
  destinationForAccessState,
  resolveCurrentAccessState,
} from "@/lib/auth/access-state";
import { buildSignInHref } from "@/lib/auth/redirects";
import { isLocalAuthProvider } from "@/lib/auth/config";

export default async function OnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const access = await resolveCurrentAccessState();

  if (access.kind === "unauthenticated") {
    redirect(buildSignInHref("/onboarding"));
  }

  if (
    access.kind === "authenticated_no_workspace" ||
    false
  ) {
    redirect(destinationForAccessState(access));
  }

  const shell = <AuthProviderShell>{children}</AuthProviderShell>;
  if (isLocalAuthProvider()) {
    return <LocalSessionProvider>{shell}</LocalSessionProvider>;
  }
  return shell;
}
