import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppPageHeader } from "@/components/app/app-page-header";
import { SettingsSubnav } from "@/components/settings/settings-subnav";
import { Badge } from "@/components/ui/badge";
import { Callout } from "@/components/ui/callout";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { resolveCurrentAccessState } from "@/lib/auth/access-state";
import { canManageBilling } from "@/lib/auth/permissions";
import { getAuthenticatedDeploymentStatusView } from "@/lib/deployment/status";

export const metadata: Metadata = {
  title: "Deployment",
};

export default async function DeploymentSettingsPage() {
  const access = await resolveCurrentAccessState();

  if (access.kind !== "workspace_active") {
    redirect("/onboarding");
  }

  const status = getAuthenticatedDeploymentStatusView();
  const manageBilling = canManageBilling(access.role);

  return (
    <>
      <AppPageHeader
        eyebrow="Workspace"
        title="Deployment"
        description="Deployment mode and enabled product capabilities for this installation."
      />
      <SettingsSubnav canManageBilling={manageBilling} />

      <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Callout tone="info" title="Self-hosted preview">
          Self-hosted authentication, entitlements, and scheduling are not complete
          yet. This page shows configuration status only.
        </Callout>

        <Card>
          <CardHeader>
            <h2 className="type-title">Deployment mode</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="neutral">{status.mode}</Badge>
              <span className="type-meta text-cited-ink-subtle">
                Version {status.version}
              </span>
            </div>
            <p className="type-body text-cited-ink-muted">
              {status.mode === "cloud"
                ? "This installation runs in Cited Cloud mode with hosted commercial features enabled when configured."
                : "This installation runs in self-hosted mode. Hosted billing, analytics, and marketing automation stay disabled."}
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="type-title">Enabled capabilities</h2>
          </CardHeader>
          <CardBody>
            <ul className="space-y-2">
              {status.enabledCapabilities.map((capability) => (
                <li key={capability} className="type-body text-cited-ink">
                  {capability}
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="type-title">Disabled capabilities</h2>
          </CardHeader>
          <CardBody>
            <ul className="space-y-2">
              {status.disabledCapabilities.map((capability) => (
                <li key={capability} className="type-body text-cited-ink-muted">
                  {capability}
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="type-title">Public capability summary</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            {status.publicCapabilities.map((capability) => (
              <div
                key={capability.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-cited-line-subtle pb-3 last:border-0 last:pb-0"
              >
                <div>
                  <p className="type-body text-cited-ink">{capability.description}</p>
                  <p className="type-meta text-cited-ink-subtle">{capability.id}</p>
                </div>
                <Badge variant={capability.enabled ? "success" : "neutral"}>
                  {capability.enabled ? "Enabled" : capability.readiness}
                </Badge>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
