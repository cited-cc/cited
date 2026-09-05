import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { NotebookEntryDetail } from "@/components/notebook/notebook-entry-detail";
import { resolveCurrentAccessState, accessMemberSubject } from "@/lib/auth/access-state";
import { getNotebookEntryDetail } from "@/lib/notebook/queries";
import { isUuid } from "@/lib/notebook/types";

type EntryPageProps = {
  params: Promise<{ entryId: string }>;
};

export async function generateMetadata({
  params,
}: EntryPageProps): Promise<Metadata> {
  const access = await resolveCurrentAccessState();
  if (access.kind !== "workspace_active") {
    return { title: "Note" };
  }

  const { entryId } = await params;
  if (!isUuid(entryId)) return { title: "Note" };

  const detail = await getNotebookEntryDetail({
    workspaceId: access.workspaceId,
    clerkUserId: accessMemberSubject(access),
    role: access.role,
    entryId,
  });

  if (!detail) return { title: "Note" };
  return { title: `${detail.entry.title} · Notebook` };
}

export default async function NotebookEntryPage({ params }: EntryPageProps) {
  const access = await resolveCurrentAccessState();

  if (

    access.kind === "workspace_suspended"
  ) {
    redirect("/app/billing?notice=access_limited");
  }

  if (access.kind !== "workspace_active") {
    redirect("/onboarding");
  }

  const { entryId } = await params;
  if (!isUuid(entryId)) {
    notFound();
  }

  const detail = await getNotebookEntryDetail({
    workspaceId: access.workspaceId,
    clerkUserId: accessMemberSubject(access),
    role: access.role,
    entryId,
  });

  if (!detail) {
    notFound();
  }

  return <NotebookEntryDetail detail={detail} />;
}
