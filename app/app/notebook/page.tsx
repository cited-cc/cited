import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { NotebookPageClient } from "@/components/notebook/notebook-page-client";
import {
  canCreateNotebookEntries,
  canExportEvidence,
} from "@/lib/auth/permissions";
import { resolveCurrentAccessState, accessMemberSubject } from "@/lib/auth/access-state";
import { isUuid } from "@/lib/notebook/types";
import { parseNotebookSearchParams } from "@/lib/notebook/query-state";
import {
  getNotebookCounts,
  getNotebookEntries,
} from "@/lib/notebook/queries";

export const metadata: Metadata = {
  title: "Notebook",
};

type NotebookPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(
  value: string | string[] | undefined,
): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export default async function NotebookPage({ searchParams }: NotebookPageProps) {
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
  const filters = parseNotebookSearchParams(params);
  const createFlag = first(params.create);
  const eventRaw = first(params.event);
  const createEventId = eventRaw && isUuid(eventRaw) ? eventRaw : null;
  const startCreating = createFlag === "1" || Boolean(createEventId);

  const [list, counts] = await Promise.all([
    getNotebookEntries({
      workspaceId: access.workspaceId,
      clerkUserId: accessMemberSubject(access),
      filters,
    }),
    getNotebookCounts({
      workspaceId: access.workspaceId,
      clerkUserId: accessMemberSubject(access),
    }),
  ]);

  return (
    <NotebookPageClient
      filters={filters}
      counts={counts}
      items={list.items}
      hasMore={list.hasMore}
      nextCursor={list.nextCursor}
      canCreate={canCreateNotebookEntries(access.role)}
      canExport={canExportEvidence(access.role)}
      createEventId={createEventId}
      startCreating={startCreating}
    />
  );
}
