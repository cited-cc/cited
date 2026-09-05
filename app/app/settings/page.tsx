import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppPageHeader } from "@/components/app/app-page-header";
import { SettingsSubnav } from "@/components/settings/settings-subnav";
import { ExportSettingsPanel } from "@/components/settings/export-settings-panel";
import { SetupChecklist } from "@/components/guidance/setup-checklist";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { resolveCurrentAccessState } from "@/lib/auth/access-state";
import {
  canExportEvidence,
  canExportWorkspaceArchive,
  canManageBilling,
  canManageWorkspaceSettings,
} from "@/lib/auth/permissions";
import { getPlanRegistryEntry } from "@/lib/entitlements/plan-catalog";
import { getPublicDeploymentConfig } from "@/lib/deployment/public-config";
import {
  formatSelfHostedLimitLabel,
  getSelfHostedSafetyLimits,
  resolveWorkspaceEntitlements,
  SELF_HOSTED_LIMIT_ENV_KEYS,
} from "@/lib/entitlements";
import { getWorkspaceDomainSetup } from "@/lib/domains/domain-service";
import { createAdminSupabaseClient } from "@/lib/db/admin";
import {
  dismissSetupChecklist,
  getSetupChecklistData,
  restoreSetupChecklist,
} from "@/lib/guidance/setup-checklist";
import type { PlanKey } from "@/types/product";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const access = await resolveCurrentAccessState();

  if (access.kind === "workspace_suspended") {
    redirect("/app?notice=suspended");
  }

  if (access.kind !== "workspace_active") {
    redirect("/onboarding");
  }

  const admin = createAdminSupabaseClient();
  const { data: workspace } = await admin
    .from("workspaces")
    .select("name, slug, plan_key, status, created_at")
    .eq("id", access.workspaceId)
    .single();

  const domainSetup = await getWorkspaceDomainSetup(access.workspaceId);
  const plan = getPlanRegistryEntry(
    (workspace?.plan_key as PlanKey) ?? access.planKey,
  );
  const checklist = await getSetupChecklistData();
  const manageBilling = canManageBilling(access.role);
  const manageSettings = canManageWorkspaceSettings(access.role);
  const deployment = getPublicDeploymentConfig();
  const selfHostedLimits = deployment.isSelfHosted
    ? getSelfHostedSafetyLimits()
    : null;
  const entitlementSnapshot = deployment.isSelfHosted
    ? resolveWorkspaceEntitlements({
        workspaceId: access.workspaceId,
        planKey: (workspace?.plan_key as PlanKey) ?? access.planKey,
        status: (workspace?.status as "active") ?? "active",
      })
    : null;

  return (
    <>
      <AppPageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Workspace, domains, notifications, account, security, and export."
      />
      <SettingsSubnav canManageBilling={manageBilling} />

      <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {checklist ? (
          <SetupChecklist
            state={checklist.state}
            canManageSetup={checklist.canManageSetup}
            dismissed={checklist.dismissed}
            onDismissAction={dismissSetupChecklist}
            onRestoreAction={restoreSetupChecklist}
          />
        ) : null}

        {deployment.isSelfHosted ? (
          <Card>
            <CardHeader>
              <h2 className="type-title">Self-hosted deployment</h2>
            </CardHeader>
            <CardBody className="space-y-3">
              <p className="type-body text-cited-ink-muted">
                This workspace runs on a self-hosted Cited instance.
              </p>
              {manageSettings ? (
                <div className="space-y-2">
                  <p className="type-meta text-cited-ink-subtle">
                    Configured operational limits
                  </p>
                  <ul className="type-body space-y-1 text-cited-ink">
                    <li>
                      Users: {formatSelfHostedLimitLabel(selfHostedLimits?.maxUsers ?? null)}
                    </li>
                    <li>
                      Domains:{" "}
                      {formatSelfHostedLimitLabel(selfHostedLimits?.maxDomains ?? null)}
                    </li>
                    <li>
                      Monitors:{" "}
                      {formatSelfHostedLimitLabel(selfHostedLimits?.maxMonitors ?? null)}
                    </li>
                    <li>
                      Prompts:{" "}
                      {formatSelfHostedLimitLabel(selfHostedLimits?.maxPrompts ?? null)}
                    </li>
                    <li>
                      History window (days):{" "}
                      {formatSelfHostedLimitLabel(selfHostedLimits?.historyDays ?? null)}
                    </li>
                  </ul>
                  <p className="type-meta text-cited-ink-subtle">
                    Administrator variables: {SELF_HOSTED_LIMIT_ENV_KEYS.join(", ")}
                  </p>
                </div>
              ) : null}
              {!entitlementSnapshot?.features.slackAlerts ? (
                <p className="type-meta text-cited-ink-subtle">
                  Slack alerts remain unavailable in the open-source core (Phase 10).
                </p>
              ) : null}
            </CardBody>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <h2 className="type-title">Workspace</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            <p className="type-body text-cited-ink">
              {(workspace?.name as string) ?? "Workspace"}
            </p>
            <p className="type-meta text-cited-ink-subtle">
              Slug: {(workspace?.slug as string) ?? "-"}
            </p>
            <div className="flex items-center gap-2">
              <span className="type-meta">Plan</span>
              <Badge variant="neutral">
                {deployment.isSelfHosted ? "Self-hosted" : plan.name}
              </Badge>
            </div>
            <a
              href="/app/settings/workspace"
              className="text-sm text-cited-accent underline-offset-4 hover:underline"
            >
              {manageSettings ? "Manage workspace" : "View workspace"}
            </a>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="type-title">Domain</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            <p className="type-body text-cited-ink">
              {domainSetup?.normalizedHostname ?? "No domain configured"}
            </p>
            <p className="type-meta text-cited-ink-subtle">
              Verification:{" "}
              {domainSetup?.verificationStatus === "verified"
                ? "Verified"
                : domainSetup
                  ? "Pending"
                  : "Not set"}
            </p>
            <a
              href="/app/settings/domains"
              className="text-sm text-cited-accent underline-offset-4 hover:underline"
            >
              Domain settings
            </a>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="type-title">Notifications</h2>
          </CardHeader>
          <CardBody className="space-y-3">
            <p className="type-body text-cited-ink-muted">
              Instant citation alerts and weekly digests by email.
            </p>
            <a
              href="/app/settings/notifications"
              className="text-sm text-cited-accent underline-offset-4 hover:underline"
            >
              Manage notification preferences
            </a>
          </CardBody>
        </Card>

        <div id="export">
          <ExportSettingsPanel
            canExport={canExportEvidence(access.role)}
            canExportArchive={canExportWorkspaceArchive(access.role)}
          />
        </div>
      </div>
    </>
  );
}
