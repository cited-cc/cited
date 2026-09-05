import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { CitationNotePage } from "@/components/evidence/citation-note-page";
import { resolveCurrentAccessState, accessMemberSubject } from "@/lib/auth/access-state";
import { canExportEvidence } from "@/lib/auth/permissions";
import { getCitationEventDetail } from "@/lib/evidence/queries";
import { isUuid } from "@/lib/evidence/types";
import { buildInboxHref, parseInboxSearchParams } from "@/lib/inbox/filters";
import { markEventSeenForMember } from "@/lib/inbox/member-state";

type EventPageProps = {
  params: Promise<{ eventId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(
  value: string | string[] | undefined,
): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export async function generateMetadata({
  params,
  searchParams,
}: EventPageProps): Promise<Metadata> {
  const access = await resolveCurrentAccessState();
  if (access.kind !== "workspace_active") {
    return { title: "Citation note" };
  }

  const { eventId } = await params;
  if (!isUuid(eventId)) {
    return { title: "Citation note" };
  }

  const query = await searchParams;
  const occurrenceId = first(query.occurrence);

  const detail = await getCitationEventDetail({
    workspaceId: access.workspaceId,
    clerkUserId: accessMemberSubject(access),
    role: access.role,
    eventId,
    occurrenceId,
  });

  if (!detail) {
    return { title: "Citation note" };
  }

  return {
    title: `${detail.event.summaryTitle} · Inbox`,
  };
}

export default async function InboxEventPage({
  params,
  searchParams,
}: EventPageProps) {
  const access = await resolveCurrentAccessState();

  if (

    access.kind === "workspace_suspended"
  ) {
    redirect("/app/billing?notice=access_limited");
  }

  if (access.kind !== "workspace_active") {
    redirect("/onboarding");
  }

  const { eventId } = await params;
  if (!isUuid(eventId)) {
    notFound();
  }

  const query = await searchParams;
  const filters = parseInboxSearchParams(query);
  const occurrenceId = first(query.occurrence);
  const backHref = buildInboxHref({
    ...filters,
    selectedEventId: null,
    cursor: null,
  });

  const detail = await getCitationEventDetail({
    workspaceId: access.workspaceId,
    clerkUserId: accessMemberSubject(access),
    role: access.role,
    eventId,
    occurrenceId,
  });

  if (!detail) {
    notFound();
  }

  if (!detail.event.memberState.seenAt) {
    const memberState = await markEventSeenForMember({
      workspaceId: access.workspaceId,
      citationEventId: eventId,
      clerkUserId: accessMemberSubject(access),
    });
    detail.event.memberState = memberState;
  }

  return (
    <CitationNotePage
      detail={detail}
      backHref={backHref}
      selectedOccurrenceId={detail.selectedOccurrence.id}
      canExport={canExportEvidence(access.role)}
    />
  );
}
