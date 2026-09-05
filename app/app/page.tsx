import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppPageHeader } from "@/components/app/app-page-header";
import { SetupChecklist } from "@/components/guidance/setup-checklist";
import { CitationBracket } from "@/components/shared/cited-glyphs";
import { AiSurfaceBadge } from "@/components/shared/ai-surface-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { NoteCard } from "@/components/ui/note-card";
import { SectionHeader } from "@/components/ui/surface";
import { resolveCurrentAccessState, accessMemberSubject } from "@/lib/auth/access-state";
import { createAdminSupabaseClient } from "@/lib/db/admin";
import { getWorkspaceDomainSetup } from "@/lib/domains/domain-service";
import { resolveActiveDomainContext } from "@/lib/domains/active-domain";
import {
  dismissSetupChecklist,
  getSetupChecklistData,
  restoreSetupChecklist,
} from "@/lib/guidance/setup-checklist";
import { getWorkspaceNotificationPreferences } from "@/lib/notifications/preferences";
import type { AiSurfaceKey, CitationEventType } from "@/types/product";

export const metadata: Metadata = {
  title: "Signal Desk",
};

function formatWhen(value: string | null | undefined): string {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Not scheduled";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });
}

function eventLabel(type: CitationEventType): string {
  switch (type) {
    case "citation":
      return "Citation";
    case "mention":
      return "Mention";
    case "recommendation":
      return "Recommendation";
    case "competitor_citation":
      return "Competitor citation";
    case "missed_opportunity":
      return "Missed opportunity";
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

export default async function AppHomePage() {
  const access = await resolveCurrentAccessState();

  if (

    access.kind === "workspace_suspended"
  ) {
    redirect("/app/billing?notice=access_limited");
  }

  if (access.kind !== "workspace_active") {
    redirect("/onboarding");
  }

  const workspaceId = access.workspaceId;
  const admin = createAdminSupabaseClient();

  const domainContext = await resolveActiveDomainContext({
    workspaceId,
    clerkUserId: accessMemberSubject(access),
    planKey: access.planKey,
  });
  const domainSetup = await getWorkspaceDomainSetup(
    workspaceId,
    domainContext.activeDomainId,
  );

  let monitorsQuery = admin
    .from("monitor_configurations")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .eq("activation_status", "active")
    .eq("enabled", true);

  let nextChecksQuery = admin
    .from("monitor_configurations")
    .select("next_run_at, ai_surface, activation_status")
    .eq("workspace_id", workspaceId)
    .eq("activation_status", "active")
    .not("next_run_at", "is", null)
    .order("next_run_at", { ascending: true })
    .limit(3);

  let blockedQuery = admin
    .from("monitor_configurations")
    .select("id, pause_reason")
    .eq("workspace_id", workspaceId)
    .eq("activation_status", "blocked")
    .limit(5);

  let recentEventsQuery = admin
    .from("citation_events")
    .select(
      "id, event_type, cited_hostname, cited_url, source_title, last_seen_at, ai_surface, confidence_score",
    )
    .eq("workspace_id", workspaceId)
    .order("last_seen_at", { ascending: false })
    .limit(5);

  if (domainContext.activeDomainId) {
    const { data: domainPrompts } = await admin
      .from("monitored_prompts")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("domain_id", domainContext.activeDomainId);

    const promptIds = (domainPrompts ?? []).map((row) => row.id as string);
    const scopedPromptFilter =
      promptIds.length > 0
        ? promptIds
        : ["00000000-0000-0000-0000-000000000000"];

    monitorsQuery = monitorsQuery.in("monitored_prompt_id", scopedPromptFilter);
    nextChecksQuery = nextChecksQuery.in(
      "monitored_prompt_id",
      scopedPromptFilter,
    );
    blockedQuery = blockedQuery.in("monitored_prompt_id", scopedPromptFilter);

    recentEventsQuery = recentEventsQuery.eq(
      "domain_id",
      domainContext.activeDomainId,
    );
  }

  const { count: activeMonitorCount } = await monitorsQuery;
  const { data: nextChecks } = await nextChecksQuery;
  const { data: blocked } = await blockedQuery;
  const { data: recentEvents } = await recentEventsQuery;

  const { data: latestRun } = await admin
    .from("scan_runs")
    .select("status, completed_at, scheduled_for, failure_code")
    .eq("workspace_id", workspaceId)
    .order("scheduled_for", { ascending: false })
    .limit(1)
    .maybeSingle();

  const alertPrefs = await getWorkspaceNotificationPreferences(workspaceId);
  const checklist = await getSetupChecklistData();

  const hasEvidence = (recentEvents ?? []).length > 0;
  const hasBlocked = (blocked ?? []).length > 0;

  return (
    <>
      <AppPageHeader
        eyebrow="Workspace"
        title="Signal Desk"
        description="Cited records citation evidence when your verified domain appears in a monitored result."
        actions={
          <Button variant="primary" size="sm" href="/app/monitors">
            Review monitors
          </Button>
        }
      />

      <div className="flex flex-col gap-10 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {checklist ? (
          <SetupChecklist
            state={checklist.state}
            canManageSetup={checklist.canManageSetup}
            dismissed={checklist.dismissed}
            onDismissAction={dismissSetupChecklist}
            onRestoreAction={restoreSetupChecklist}
          />
        ) : null}

        {false ? (
          <Callout tone="warning" title="Payment past due">
            Your workspace is past due. Update billing to keep monitoring
            available.{" "}
            <a href="/app/billing" className="underline underline-offset-4">
              Open billing
            </a>
          </Callout>
        ) : null}

        {hasBlocked ? (
          <Callout tone="warning" title="Action needed">
            One or more monitors are blocked. Review monitors for pause reasons
            such as usage limits, unsupported surfaces, or repeated failures.
          </Callout>
        ) : null}

        {!hasEvidence ? (
          <EmptyState
            title="Your citation desk is ready."
            description="Cited will collect evidence here as monitored checks complete. Results can vary by provider, model, location, timing, and prompt wording."
            icon={<CitationBracket size={28} />}
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <Button variant="primary" size="sm" href="/app/monitors">
                  Review monitors
                </Button>
                <Button variant="secondary" size="sm" href="/app/inbox">
                  Open Inbox
                </Button>
                <Button variant="ghost" size="sm" href="/docs/getting-started">
                  Setup help
                </Button>
              </div>
            }
          />
        ) : (
          <section>
            <SectionHeader
              eyebrow="Evidence"
              title="Recent citation notes"
              description="New evidence from completed monitoring runs."
            />
            <div className="mt-5 space-y-3">
              {(recentEvents ?? []).map((event) => (
                <NoteCard
                  key={event.id as string}
                  variant={
                    event.event_type === "citation"
                      ? "citation"
                      : event.event_type === "mention"
                        ? "mention"
                        : event.event_type === "missed_opportunity"
                          ? "opportunity"
                          : event.event_type === "competitor_citation"
                            ? "competitor"
                            : "default"
                  }
                  badge={eventLabel(event.event_type as CitationEventType)}
                  title={
                    (event.source_title as string | null) ||
                    (event.cited_hostname as string | null) ||
                    eventLabel(event.event_type as CitationEventType)
                  }
                  meta={formatWhen(event.last_seen_at as string)}
                  footer={
                    <a
                      href={`/app/inbox/${event.id as string}`}
                      className="text-sm text-cited-accent underline-offset-4 hover:underline"
                    >
                      Open note
                    </a>
                  }
                >
                  <p className="type-body-sm text-cited-ink-muted">
                    {(event.cited_url as string | null) ||
                      "Evidence recorded from a monitored result."}
                  </p>
                  {event.ai_surface ? (
                    <div className="mt-2">
                      <AiSurfaceBadge
                        surface={event.ai_surface as AiSurfaceKey}
                        showMark={false}
                      />
                    </div>
                  ) : null}
                </NoteCard>
              ))}
            </div>
          </section>
        )}

        <section>
          <SectionHeader
            eyebrow="Monitoring"
            title="Current watch state"
            description="Results can vary by provider, model, location, timing, and response availability."
          />
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Card className="bg-cited-surface">
              <CardBody>
                <p className="type-micro mb-2">Domain</p>
                <h3 className="type-title">
                  {domainSetup?.normalizedHostname ?? "Not set"}
                </h3>
                <p className="mt-2 type-body-sm">
                  {domainSetup?.verificationStatus === "verified"
                    ? "Verified"
                    : "Verification pending"}
                </p>
              </CardBody>
            </Card>
            <Card className="bg-cited-surface">
              <CardBody>
                <p className="type-micro mb-2">Active monitors</p>
                <h3 className="type-title">{activeMonitorCount ?? 0}</h3>
                <p className="mt-2 type-body-sm">
                  {latestRun
                    ? `Latest run: ${String(latestRun.status)}`
                    : "No runs yet"}
                </p>
              </CardBody>
            </Card>
            <Card className="bg-cited-surface">
              <CardBody>
                <p className="type-micro mb-2">Next checks</p>
                {(nextChecks ?? []).length === 0 ? (
                  <p className="type-body-sm text-cited-ink-muted">
                    No upcoming checks scheduled.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {(nextChecks ?? []).map((check, index) => (
                      <li
                        key={`${check.ai_surface}-${index}`}
                        className="flex items-center justify-between gap-2"
                      >
                        <Badge variant="neutral">
                          {String(check.ai_surface)}
                        </Badge>
                        <span className="type-meta text-cited-ink-subtle">
                          {formatWhen(check.next_run_at as string)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>
            <Card className="bg-cited-surface sm:col-span-3">
              <CardBody className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="type-micro mb-2">Alerts</p>
                  <p className="type-body-sm text-cited-ink-muted">
                    Email alerts: {alertPrefs.instantEmailEnabled ? "On" : "Off"}
                    {" · "}
                    Weekly digest:{" "}
                    {alertPrefs.weeklyDigestEmailEnabled ? "On" : "Off"}
                    {" · "}
                    Monitor issues:{" "}
                    {alertPrefs.monitorIssueEmailEnabled ? "On" : "Off"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  href="/app/settings/notifications"
                >
                  Notification settings
                </Button>
              </CardBody>
            </Card>
          </div>
        </section>
      </div>
    </>
  );
}
