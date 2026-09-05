import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppPageHeader } from "@/components/app/app-page-header";
import { SettingsSubnav } from "@/components/settings/settings-subnav";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DitherAvatar } from "@/components/ui/dither-avatar";
import { resolveCurrentAccessState } from "@/lib/auth/access-state";
import { canManageBilling } from "@/lib/auth/permissions";
import { getSessionPrincipal } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Account settings",
};

export default async function AccountSettingsPage() {
  const access = await resolveCurrentAccessState();

  if (

    access.kind === "workspace_suspended"
  ) {
    redirect("/app/billing?notice=access_limited");
  }

  if (access.kind !== "workspace_active") {
    redirect("/onboarding");
  }

  const principal = await getSessionPrincipal();
  if (!principal) {
    redirect("/sign-in");
  }

  const email = principal.email ?? "Signed in";
  const name = principal.displayName ?? "Account";

  return (
    <>
      <AppPageHeader
        eyebrow="Settings"
        title="Account"
        description="Your signed-in identity, workspace role, and personal preferences."
      />
      <SettingsSubnav canManageBilling={canManageBilling(access.role)} />

      <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Card>
          <CardHeader>
            <h2 className="type-title">Signed-in account</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="flex items-center gap-3">
              <DitherAvatar seed={principal.userId} size="lg" title={name} />
              <div className="min-w-0">
                <p className="type-body text-cited-ink">{name}</p>
                <p className="mt-1 type-meta text-cited-ink-subtle">{email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="type-meta">Workspace role</span>
              <Badge variant="neutral">{access.role}</Badge>
            </div>
            <p className="type-body-sm text-cited-ink-muted">
              Use the account menu to sign out or open security settings. Cited
              uses your email for alerts and workspace access.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="type-title">Personal notifications</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            <p className="type-body-sm text-cited-ink-muted">
              Manage what you personally receive without changing workspace
              defaults.
            </p>
            <a
              href="/app/settings/notifications"
              className="text-sm text-cited-accent underline-offset-4 hover:underline"
            >
              Open notification preferences
            </a>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
