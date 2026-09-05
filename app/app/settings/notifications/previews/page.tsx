import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AppPageHeader } from "@/components/app/app-page-header";
import { Callout } from "@/components/ui/callout";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { resolveCurrentAccessState } from "@/lib/auth/access-state";
import { requireWorkspaceRole } from "@/lib/auth";
import { canManageBilling } from "@/lib/auth/permissions";
import { createAdminSupabaseClient } from "@/lib/db/admin";
import { buildAppAbsoluteUrl } from "@/lib/notifications/app-url";
import { loadNotificationContent } from "@/lib/notifications/render";
import { mapCitationEventToNotificationType } from "@/lib/notifications/types";
import type { CitationEventType } from "@/types/product";

export const metadata: Metadata = {
  title: "Notification previews",
};

export default async function NotificationPreviewsPage() {
  const access = await resolveCurrentAccessState();

  if (
    access.kind !== "workspace_active"
  ) {
    redirect("/onboarding");
  }

  const membership = await requireWorkspaceRole(access.workspaceId, [
    "owner",
    "admin",
    "member",
    "viewer",
  ]);

  if (!canManageBilling(membership.role)) {
    redirect("/app/settings/notifications");
  }

  const admin = createAdminSupabaseClient();
  const { data: recentEvent } = await admin
    .from("citation_events")
    .select("id, event_type, ai_surface, source_title, source_snippet")
    .eq("workspace_id", membership.workspaceId)
    .order("last_seen_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const manageUrl = buildAppAbsoluteUrl("/app/settings/notifications");
  const unsubscribeUrl = buildAppAbsoluteUrl("/unsubscribe/preview-token");

  let emailSubject: string | null = null;
  let emailHtml: string | null = null;
  let emailText: string | null = null;
  let usingFixture = false;

  if (recentEvent?.id) {
    const notificationType = mapCitationEventToNotificationType(
      recentEvent.event_type as CitationEventType,
    );
    const content = await loadNotificationContent({
      workspaceId: membership.workspaceId,
      notificationType,
      sourceEntityType: "citation_event",
      sourceEntityId: recentEvent.id as string,
      payloadSummary: {},
      manageUrl,
      unsubscribeUrl,
    });
    if (!content.canceled) {
      emailSubject = content.email.subject;
      emailHtml = content.email.html;
      emailText = content.email.text;
    }
  } else if (process.env.NODE_ENV !== "production") {
    usingFixture = true;
    emailSubject = "New citation found for example.com";
    emailText = [
      "Development fixture - not real workspace evidence",
      "",
      "New citation note",
      "Captured from a monitored result in your Cited workspace.",
      "AI surface: ChatGPT",
      "Prompt: best AI SEO tools for startups",
      `Open citation note: ${buildAppAbsoluteUrl("/app/inbox")}`,
    ].join("\n");
    emailHtml = `<div style="padding:24px;background:#fbf7f0;color:#15131a;font-family:system-ui;">
<p style="color:#3db8bd;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;">Preview only - not sent</p>
<p style="color:#5c5a52;font-size:12px;">Development fixture - not real workspace evidence</p>
<h1 style="font-weight:400;">New citation note</h1>
<p>example.com appeared as a source in a monitored result.</p>
</div>`;
  }

  return (
    <>
      <AppPageHeader
        eyebrow="Notifications"
        title="Previews"
        description="Preview only - not sent. Uses real recent workspace evidence when available."
        meta={
          <Link
            href="/app/settings/notifications"
            className="text-sm text-cited-ink-muted underline-offset-4 hover:underline"
          >
            Back to settings
          </Link>
        }
      />

      <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Callout tone="info" title="Preview only - not sent">
          Rendering these templates does not deliver email messages.
        </Callout>

        {!recentEvent && !usingFixture ? (
          <Callout tone="info" title="No recent event">
            No recent event available for preview.
          </Callout>
        ) : null}

        {usingFixture ? (
          <Callout tone="warning" title="Development fixture">
            Development fixture - not real workspace evidence.
          </Callout>
        ) : null}

        {emailSubject ? (
          <Card>
            <CardHeader>
              <h2 className="type-title">Email subject</h2>
            </CardHeader>
            <CardBody>
              <p className="type-body">{emailSubject}</p>
            </CardBody>
          </Card>
        ) : null}

        {emailHtml ? (
          <Card>
            <CardHeader>
              <h2 className="type-title">Email HTML</h2>
            </CardHeader>
            <CardBody>
              <iframe
                title="Email HTML preview"
                sandbox=""
                srcDoc={emailHtml}
                className="h-[480px] w-full rounded-md border border-cited-line bg-black"
              />
            </CardBody>
          </Card>
        ) : null}

        {emailText ? (
          <Card>
            <CardHeader>
              <h2 className="type-title">Plain text</h2>
            </CardHeader>
            <CardBody>
              <pre className="overflow-x-auto whitespace-pre-wrap type-meta text-cited-ink-muted">
                {emailText}
              </pre>
            </CardBody>
          </Card>
        ) : null}
      </div>
    </>
  );
}
