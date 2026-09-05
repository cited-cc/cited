import type { Metadata } from "next";
import { Radar } from "lucide-react";
import { redirect } from "next/navigation";

import { AppPageHeader } from "@/components/app/app-page-header";
import { MonitorControls } from "@/components/app/monitors/monitor-controls";
import { MonitorLastScanInsights } from "@/components/monitors/monitor-last-scan-insights";
import { AiSurfaceBadge } from "@/components/shared/ai-surface-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { resolveCurrentAccessState, accessMemberSubject } from "@/lib/auth/access-state";
import { resolveActiveDomainContext } from "@/lib/domains/active-domain";
import { enforceActiveMonitorLimits } from "@/lib/entitlements/enforce";
import { canRunMonitoringForWorkspace } from "@/lib/entitlements/resolve";
import { createAdminSupabaseClient } from "@/lib/db/admin";
import type { Json } from "@/lib/db/types";
import { parseScanRunInsight } from "@/lib/evidence/provider-visibility";
import type { ScanRunInsightSnapshot } from "@/lib/evidence/types";
import { activateMonitorsForWorkspace } from "@/lib/monitoring/activate-monitors";
import { isAiSurfaceEnabled } from "@/lib/monitoring/surfaces";
import {
  isRecoverableBlockReason,
  pauseReasonLabel,
} from "@/lib/monitoring/status-copy";
import type { AiSurfaceKey, PlanKey, WorkspaceStatus } from "@/types/product";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Monitors",
};

function formatStatus(input: {
  activationStatus: string;
  enabled: boolean;
  surfaceEnabled: boolean;
  latestRunStatus?: string | null;
  pauseReason?: string | null;
}): { label: string; variant: "neutral" | "success" | "warning" | "danger" } {
  if (!input.surfaceEnabled) {
    return { label: "Unavailable", variant: "warning" };
  }
  if (input.activationStatus === "blocked") {
    return { label: "Blocked", variant: "danger" };
  }
  if (input.activationStatus === "paused" || !input.enabled) {
    return { label: "Paused", variant: "warning" };
  }
  if (input.activationStatus === "configured") {
    return { label: "Configured", variant: "neutral" };
  }
  if (input.latestRunStatus === "queued") {
    return { label: "Queued", variant: "neutral" };
  }
  if (input.latestRunStatus === "running") {
    return { label: "Running", variant: "success" };
  }
  if (input.activationStatus === "active") {
    return { label: "Active", variant: "success" };
  }
  if (input.latestRunStatus === "failed") {
    return { label: "Failed", variant: "danger" };
  }
  return { label: "Configured", variant: "neutral" };
}

function formatWhen(value: string | null | undefined): string {
  if (!value) return "Not yet";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Not yet";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });
}

export default async function MonitorsPage() {
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
    .select(
      "plan_key, status, billing_status, cancel_at_period_end, current_period_end, billing_grace_until",
    )
    .eq("id", access.workspaceId)
    .maybeSingle();

  const monitoringAuthorized = workspace
    ? canRunMonitoringForWorkspace({
        workspaceId: access.workspaceId,
        planKey: workspace.plan_key as PlanKey,
        status: workspace.status as WorkspaceStatus,
        billingStatus: workspace.billing_status as
          | "active"
          | "trialing"
          | "past_due"
          | "unpaid"
          | "canceled"
          | "incomplete"
          | "incomplete_expired"
          | "paused"
          | "suspended"
          | "unknown"
          | null,
        cancelAtPeriodEnd: Boolean(workspace.cancel_at_period_end),
        currentPeriodEnd: workspace.current_period_end as string | null,
        billingGraceUntil: workspace.billing_grace_until as string | null,
      })
    : false;

  if (monitoringAuthorized && workspace?.plan_key) {
    try {
      await enforceActiveMonitorLimits({
        workspaceId: access.workspaceId,
        planKey: workspace.plan_key as PlanKey,
        restoreBillingBlocked: true,
      });
    } catch {
      // Page should still render if restoration fails transiently.
    }
  }

  const canManage =
    access.role === "owner" ||
    access.role === "admin" ||
    access.role === "member";

  const domainContext = await resolveActiveDomainContext({
    workspaceId: access.workspaceId,
    clerkUserId: accessMemberSubject(access),
    planKey: (workspace?.plan_key ?? access.planKey) as PlanKey,
  });

  let promptsQuery = admin
    .from("monitored_prompts")
    .select(
      "id, name, prompt_text, monitoring_frequency, country_code, city, language_code, setup_status, active",
    )
    .eq("workspace_id", access.workspaceId)
    .order("created_at", { ascending: true });

  if (domainContext.activeDomainId) {
    promptsQuery = promptsQuery.eq("domain_id", domainContext.activeDomainId);
  }

  const { data: prompts } = await promptsQuery;

  const promptIds = (prompts ?? []).map((p) => p.id as string);
  let { data: configs } =
    promptIds.length > 0
      ? await admin
          .from("monitor_configurations")
          .select(
            "id, monitored_prompt_id, ai_surface, scan_frequency, activation_status, enabled, country_code, city, next_run_at, last_run_at, last_successful_run_at, pause_reason",
          )
          .eq("workspace_id", access.workspaceId)
          .in("monitored_prompt_id", promptIds)
      : { data: [] };

  const needsActivation = (configs ?? []).some(
    (config) =>
      config.activation_status === "configured" ||
      (config.activation_status === "blocked" &&
        isRecoverableBlockReason(config.pause_reason as string | null)),
  );

  if (needsActivation) {
    try {
      await activateMonitorsForWorkspace(access.workspaceId);
      const refreshed = await admin
        .from("monitor_configurations")
        .select(
          "id, monitored_prompt_id, ai_surface, scan_frequency, activation_status, enabled, country_code, city, next_run_at, last_run_at, last_successful_run_at, pause_reason",
        )
        .eq("workspace_id", access.workspaceId)
        .in("monitored_prompt_id", promptIds);
      configs = refreshed.data;
    } catch {
      // Page should still render if activation fails transiently.
    }
  }

  const configIds = (configs ?? []).map((c) => c.id as string);
  const latestByConfig = new Map<string, string>();
  const latestInsightByConfig = new Map<string, ScanRunInsightSnapshot | null>();
  if (configIds.length > 0) {
    const { data: runs } = await admin
      .from("scan_runs")
      .select(
        "monitor_configuration_id, status, scheduled_for, result_summary, provider_cost_usd",
      )
      .eq("workspace_id", access.workspaceId)
      .in("monitor_configuration_id", configIds)
      .order("scheduled_for", { ascending: false })
      .limit(100);
    for (const run of runs ?? []) {
      const key = run.monitor_configuration_id as string;
      if (!latestByConfig.has(key)) {
        latestByConfig.set(key, run.status as string);
        if (run.status === "completed") {
          latestInsightByConfig.set(
            key,
            parseScanRunInsight(
              run.result_summary as Json | undefined,
              null,
              typeof (run.result_summary as Record<string, unknown> | null)
                ?.citationCount === "number"
                ? ((run.result_summary as Record<string, unknown>)
                    .citationCount as number)
                : 0,
            ),
          );
        }
      }
    }
  }

  const configsByPrompt = new Map<
    string,
    Array<{
      id: string;
      monitored_prompt_id: string;
      ai_surface: AiSurfaceKey;
      scan_frequency: string;
      activation_status: string;
      enabled: boolean;
      country_code: string | null;
      city: string | null;
      next_run_at: string | null;
      last_run_at: string | null;
      last_successful_run_at: string | null;
      pause_reason: string | null;
    }>
  >();
  for (const config of configs ?? []) {
    const key = config.monitored_prompt_id as string;
    const list = configsByPrompt.get(key) ?? [];
    list.push(config as (typeof list)[number]);
    configsByPrompt.set(key, list);
  }

  const blockedCount = (configs ?? []).filter(
    (config) => config.activation_status === "blocked",
  ).length;
  const activeCount = (configs ?? []).filter(
    (config) => config.activation_status === "active",
  ).length;

  return (
    <>
      <AppPageHeader
        eyebrow="Watch list"
        title="Monitors"
        description={
          domainContext.activeDomain
            ? `Monitoring prompts for ${domainContext.activeDomain.hostname} across supported AI surfaces.`
            : "Cited monitors the prompts you configure across supported AI surfaces."
        }
        actions={
          <Button variant="secondary" size="sm" href="/onboarding?step=4">
            Edit setup
          </Button>
        }
      />

      <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {blockedCount > 0 ? (
          <Callout tone="danger" title="Monitoring blocked">
            <p>
              {blockedCount === (configs ?? []).length
                ? "All monitors are blocked."
                : `${blockedCount} monitor${blockedCount === 1 ? "" : "s"} blocked.`}
            </p>
            <p className="mt-2">
              {activeCount > 0
                ? "Some monitors are still active. Review the cards below for details, reduce prompts or surfaces, or upgrade your plan."
                : "Review each card for the reason, adjust your setup, or upgrade your plan to restore monitoring."}
            </p>
            <div className="mt-3">
              <Button variant="secondary" size="sm" href="/app/billing">
                Review plan
              </Button>
            </div>
          </Callout>
        ) : null}
        {(prompts ?? []).length === 0 ? (
          <EmptyState
            title="No monitors configured"
            description="Finish onboarding to save prompts and AI surfaces."
            icon={<Radar className="h-7 w-7" aria-hidden />}
            action={
              <Button variant="primary" size="sm" href="/onboarding">
                Open setup
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            {(prompts ?? []).map((prompt, index) => {
              const related = configsByPrompt.get(prompt.id as string) ?? [];
              return (
                <div key={prompt.id as string} className="space-y-3">
                  <p className="type-micro px-1">
                    Prompt {String(index + 1).padStart(2, "0")}
                  </p>
                  {related.length === 0 ? (
                    <Card>
                      <CardBody>
                        <h2 className="type-title text-cited-ink-strong">
                          {prompt.prompt_text as string}
                        </h2>
                        <p className="mt-2 type-body-sm text-cited-ink-muted">
                          No AI surfaces configured for this prompt.
                        </p>
                      </CardBody>
                    </Card>
                  ) : (
                    related.map((config) => {
                      const surface = config.ai_surface as AiSurfaceKey;
                      const surfaceEnabled = isAiSurfaceEnabled(surface);
                      const status = formatStatus({
                        activationStatus: String(config.activation_status),
                        enabled: Boolean(config.enabled),
                        surfaceEnabled,
                        latestRunStatus: latestByConfig.get(config.id as string),
                        pauseReason: config.pause_reason as string | null,
                      });
                      const cadence = String(
                        config.scan_frequency ?? prompt.monitoring_frequency,
                      ).replaceAll("_", "-");
                      const location = [
                        config.country_code ?? prompt.country_code,
                        config.city ?? prompt.city,
                      ]
                        .filter(Boolean)
                        .join(" · ");
                      const reason = pauseReasonLabel(
                        config.pause_reason as string | null,
                      );

                      return (
                        <Card key={config.id as string}>
                          <CardHeader className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h2 className="type-title text-cited-ink-strong">
                                {prompt.prompt_text as string}
                              </h2>
                              <div className="mt-2">
                                <AiSurfaceBadge
                                  surface={surface}
                                  showMark={false}
                                />
                              </div>
                            </div>
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </CardHeader>
                          <CardBody className="space-y-3">
                            <p className="type-meta text-cited-ink-subtle">
                              Cadence: {cadence}
                              {location ? ` · Location: ${location}` : ""}
                            </p>
                            <p className="type-body-sm text-cited-ink-muted">
                              Last checked:{" "}
                              {formatWhen(
                                (config.last_successful_run_at as string | null) ??
                                  (config.last_run_at as string | null),
                              )}
                              {" · "}
                              Next check: {formatWhen(config.next_run_at as string | null)}
                            </p>
                            {reason ? (
                              <p className="type-body-sm text-cited-ink-muted">
                                {reason}
                              </p>
                            ) : null}
                            <MonitorLastScanInsights
                              insight={
                                latestInsightByConfig.get(config.id as string) ??
                                null
                              }
                            />
                            {!surfaceEnabled ? (
                              <p className="type-body-sm text-cited-ink-muted">
                                This AI surface is not enabled for monitoring yet.
                              </p>
                            ) : null}
                            <MonitorControls
                              workspaceId={access.workspaceId}
                              monitorConfigurationId={config.id as string}
                              activationStatus={String(config.activation_status)}
                              canManage={canManage}
                            />
                          </CardBody>
                        </Card>
                      );
                    })
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
