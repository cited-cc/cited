import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppPageHeader } from "@/components/app/app-page-header";
import { SettingsSubnav } from "@/components/settings/settings-subnav";
import { Badge } from "@/components/ui/badge";
import { Callout } from "@/components/ui/callout";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { resolveCurrentAccessState } from "@/lib/auth/access-state";
import { canManageBilling } from "@/lib/auth/permissions";
import { getProviderStatusView } from "@/lib/providers/status";

export const metadata: Metadata = {
  title: "Monitoring provider",
};

export default async function ProviderSettingsPage() {
  const access = await resolveCurrentAccessState();

  if (access.kind !== "workspace_active") {
    redirect("/onboarding");
  }

  if (access.role !== "owner" && access.role !== "admin") {
    redirect("/app/settings");
  }

  const status = getProviderStatusView();
  const manageBilling = canManageBilling(access.role);

  return (
    <>
      <AppPageHeader
        eyebrow="Workspace"
        title="Monitoring provider"
        description="Selected monitoring provider, supported surfaces, and safe readiness state."
      />
      <SettingsSubnav canManageBilling={manageBilling} />

      <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {status.isMockMode ? (
          <Callout tone="warning" title="Mock demo mode">
            This installation uses the mock monitoring provider. Results are fictional
            demo data and must not be treated as live AI answers.
          </Callout>
        ) : null}

        <Card>
          <CardHeader>
            <h2 className="type-title">Selected provider</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={status.configurationReady ? "success" : "neutral"}>
                {status.selectedProviderId}
              </Badge>
              <span className="type-meta text-cited-ink-subtle">
                {status.deploymentMode} mode
              </span>
            </div>
            <p className="type-body text-cited-ink-muted">{status.configurationMessage}</p>
            <p className="type-meta text-cited-ink-subtle">
              Setup documentation lives in docs/open-source/providers/ in this repository.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="type-title">Registered providers</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            {status.providers.map((provider) => (
              <div
                key={provider.id}
                className="border-b border-cited-line-subtle pb-4 last:border-0 last:pb-0"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="type-body text-cited-ink">{provider.displayName}</p>
                  <Badge variant="neutral">v{provider.adapterVersion}</Badge>
                </div>
                <p className="type-meta text-cited-ink-subtle">
                  Surfaces: {provider.supportedSurfaces.join(", ")}
                </p>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="type-title">Surface routing</h2>
          </CardHeader>
          <CardBody className="space-y-2">
            {status.surfaceRoutes.map((route) => (
              <div
                key={route.surface}
                className="flex flex-wrap items-center justify-between gap-2"
              >
                <span className="type-body text-cited-ink">{route.surface}</span>
                <span className="type-meta text-cited-ink-subtle">
                  {route.providerDisplayName}
                </span>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
