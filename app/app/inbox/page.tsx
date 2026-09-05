import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { InboxClientShell } from "@/components/inbox/inbox-client-shell";
import {
  canArchiveInboxEvents,
  canExportEvidence,
  canResolveInboxEvents,
  canSaveInboxEvents,
} from "@/lib/auth/permissions";
import { resolveCurrentAccessState, accessMemberSubject } from "@/lib/auth/access-state";
import { countActiveAdvancedFilters, parseInboxSearchParams } from "@/lib/inbox/filters";
import {
  getInboxEventPreview,
  getInboxFilterOptions,
  getInboxTabCounts,
  getInboxWorkspaceContext,
  listInboxEvents,
} from "@/lib/inbox/queries";
import type { WorkspaceRole } from "@/types/product";

export const metadata: Metadata = {
  title: "Inbox",
};

type InboxPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function InboxPage({ searchParams }: InboxPageProps) {
  const access = await resolveCurrentAccessState();

  if (

    access.kind === "workspace_suspended"
  ) {
    redirect("/app/billing?notice=access_limited");
  }

  if (access.kind !== "workspace_active") {
    redirect("/onboarding");
  }

  const params = await searchParams;
  const filters = parseInboxSearchParams(params);
  const role = access.role as WorkspaceRole;

  const context = await getInboxWorkspaceContext({
    workspaceId: access.workspaceId,
    clerkUserId: accessMemberSubject(access),
    role,
  });

  const [list, counts, options] = await Promise.all([
    listInboxEvents({
      workspaceId: access.workspaceId,
      clerkUserId: accessMemberSubject(access),
      filters,
    }),
    getInboxTabCounts({
      workspaceId: access.workspaceId,
      clerkUserId: accessMemberSubject(access),
    }),
    getInboxFilterOptions(access.workspaceId),
  ]);

  let preview = null;
  if (filters.selectedEventId) {
    preview = await getInboxEventPreview({
      workspaceId: access.workspaceId,
      clerkUserId: accessMemberSubject(access),
      eventId: filters.selectedEventId,
    });
  }

  const hasActiveFilters =
    countActiveAdvancedFilters(filters) > 0 || Boolean(filters.search);

  let emptyKind:
    | "no_monitors"
    | "no_evidence"
    | "no_results"
    | "no_saved"
    | "no_archived"
    | null = null;

  if (list.items.length === 0) {
    if (!context.hasActiveMonitors && context.totalEventCount === 0) {
      emptyKind = "no_monitors";
    } else if (context.totalEventCount === 0) {
      emptyKind = "no_evidence";
    } else if (filters.view === "saved") {
      emptyKind = "no_saved";
    } else if (filters.view === "archived") {
      emptyKind = "no_archived";
    } else if (hasActiveFilters || filters.view !== "all") {
      emptyKind = "no_results";
    } else {
      emptyKind = "no_evidence";
    }
  }

  return (
    <InboxClientShell
      filters={filters}
      items={list.items}
      nextCursor={list.nextCursor}
      hasMore={list.hasMore}
      counts={counts}
      options={options}
      preview={preview}
      canArchive={canArchiveInboxEvents(role)}
      canResolve={canResolveInboxEvents(role)}
      canSave={canSaveInboxEvents(role)}
      canExport={canExportEvidence(role)}
      emptyKind={emptyKind}
    />
  );
}
