import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppPageHeader } from "@/components/app/app-page-header";
import { SettingsSubnav } from "@/components/settings/settings-subnav";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Callout } from "@/components/ui/callout";
import { resolveCurrentAccessState } from "@/lib/auth/access-state";
import {
  canManageBilling,
  canManageWorkspaceSettings,
} from "@/lib/auth/permissions";
import { getSupportContactConfig } from "@/lib/content/support";
import { getWorkspaceDomainSetup } from "@/lib/domains/domain-service";
import { getWorkspaceNotificationPreferences } from "@/lib/notifications/preferences";

export const metadata: Metadata = {
  title: "Security settings",
};

export default async function SecuritySettingsPage() {
  const access = await resolveCurrentAccessState();

  if (

    access.kind === "workspace_suspended"
  ) {
    redirect("/app/billing?notice=access_limited");
  }

  if (access.kind !== "workspace_active") {
    redirect("/onboarding");
  }

  const domainSetup = await getWorkspaceDomainSetup(access.workspaceId);
  const canManage = canManageWorkspaceSettings(access.role);
  const alertPrefs = canManage
    ? await getWorkspaceNotificationPreferences(access.workspaceId)
    : null;
  const support = getSupportContactConfig();

  return (
    <>
      <AppPageHeader
        eyebrow="Settings"
        title="Security"
        description="Account and workspace security details that are true for this product today."
      />
      <SettingsSubnav canManageBilling={canManageBilling(access.role)} />

      <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Callout tone="info" title="No unsupported claims">
          This page does not claim SOC 2, ISO, HIPAA, or other compliance
          certifications. See the public security overview for architectural
          foundations.
        </Callout>

        <Card>
          <CardHeader>
            <h2 className="type-title">Account security</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="type-meta">Sign-in</span>
              <Badge variant="neutral">Email and password</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="type-meta">Workspace role</span>
              <Badge variant="neutral">{access.role}</Badge>
            </div>
            <p className="type-body-sm text-cited-ink-muted">
              Password reset is available from the sign-in page. Session security
              is managed by Cited account settings.
            </p>
            <a
              href="/forgot-password"
              className="text-sm text-cited-accent underline-offset-4 hover:underline"
            >
              Reset password
            </a>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="type-title">Workspace controls</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            <p className="type-body-sm text-cited-ink-muted">
              Domain verification:{" "}
              {domainSetup?.verificationStatus === "verified"
                ? "Verified"
                : domainSetup
                  ? domainSetup.verificationStatus
                  : "Not configured"}
            </p>
            {canManage && alertPrefs ? (
              <p className="type-body-sm text-cited-ink-muted">
                Email alerts:{" "}
                {alertPrefs.instantEmailEnabled ? "On" : "Off"}
                {" · "}
                Weekly digest:{" "}
                {alertPrefs.weeklyDigestEmailEnabled ? "On" : "Off"}
              </p>
            ) : (
              <p className="type-body-sm text-cited-ink-muted">
                Email alert settings are visible to owners and admins.
              </p>
            )}
            <a
              href="/app/settings#export"
              className="block text-sm text-cited-accent underline-offset-4 hover:underline"
            >
              Export data
            </a>
            <a
              href="/security"
              className="block text-sm text-cited-accent underline-offset-4 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Security overview
            </a>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="type-title">Data export and deletion requests</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            <p className="type-body-sm text-cited-ink-muted">
              {support.deletionGuidance}
            </p>
            <p className="type-body-sm text-cited-ink-muted">
              {support.privacyGuidance}
            </p>
            {support.privacyEmail ? (
              <a
                href={`mailto:${support.privacyEmail}?subject=Workspace%20deletion%20request`}
                className="block text-sm text-cited-accent underline-offset-4 hover:underline"
              >
                Request deletion via {support.privacyEmail}
              </a>
            ) : null}
            <a
              href="/privacy"
              className="block text-sm text-cited-accent underline-offset-4 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Privacy Policy
            </a>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
