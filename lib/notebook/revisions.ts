/**
 * Notebook revision helpers. Revisions are append-only.
 * Restore creates a new revision; history is never rewritten.
 */

import { createAdminSupabaseClient, requireWorkspaceScope } from "@/lib/db/admin";
import type { Tables } from "@/lib/db/types";
import {
  normalizeNotebookBody,
  normalizeNotebookTitle,
  serializeNotebookRevision,
} from "@/lib/notebook/serializers";
import {
  NOTEBOOK_BODY_MAX_LENGTH,
  NOTEBOOK_TITLE_MAX_LENGTH,
  isUuid,
  type NotebookEntryRevisionItem,
} from "@/lib/notebook/types";

type NotebookRow = Tables<"notebook_entries">;

export function validateNotebookContent(input: {
  title: string;
  body: string;
}):
  | { ok: true; title: string; body: string }
  | { ok: false; error: string } {
  const title = normalizeNotebookTitle(input.title);
  const body = normalizeNotebookBody(input.body);
  if (!title) return { ok: false, error: "Title is required." };
  if (title.length > NOTEBOOK_TITLE_MAX_LENGTH) {
    return {
      ok: false,
      error: `Title must be ${NOTEBOOK_TITLE_MAX_LENGTH} characters or fewer.`,
    };
  }
  if (body.length > NOTEBOOK_BODY_MAX_LENGTH) {
    return {
      ok: false,
      error: `Note must be ${NOTEBOOK_BODY_MAX_LENGTH} characters or fewer.`,
    };
  }
  return { ok: true, title, body };
}

export async function createInitialRevision(input: {
  workspaceId: string;
  entry: NotebookRow;
  editedByClerkUserId: string;
}): Promise<void> {
  const workspaceId = requireWorkspaceScope(input.workspaceId);
  const admin = createAdminSupabaseClient();
  await admin.from("notebook_entry_revisions").insert({
    notebook_entry_id: input.entry.id,
    workspace_id: workspaceId,
    revision_number: 1,
    title_snapshot: input.entry.title,
    body_snapshot: input.entry.body,
    edited_by_clerk_user_id: input.editedByClerkUserId,
  });
}

/**
 * Create a new revision when title or body meaningfully changes.
 * Uses max(revision_number)+1 with unique constraint for concurrency safety.
 */
export async function createRevisionIfChanged(input: {
  workspaceId: string;
  entryId: string;
  previousTitle: string;
  previousBody: string;
  nextTitle: string;
  nextBody: string;
  editedByClerkUserId: string;
}): Promise<{ created: boolean; revisionNumber: number | null }> {
  const workspaceId = requireWorkspaceScope(input.workspaceId);
  if (
    input.previousTitle === input.nextTitle &&
    input.previousBody === input.nextBody
  ) {
    return { created: false, revisionNumber: null };
  }

  const admin = createAdminSupabaseClient();
  const { data: latest } = await admin
    .from("notebook_entry_revisions")
    .select("revision_number")
    .eq("workspace_id", workspaceId)
    .eq("notebook_entry_id", input.entryId)
    .order("revision_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextNumber = (latest?.revision_number ?? 0) + 1;

  const { error } = await admin.from("notebook_entry_revisions").insert({
    notebook_entry_id: input.entryId,
    workspace_id: workspaceId,
    revision_number: nextNumber,
    title_snapshot: input.nextTitle,
    body_snapshot: input.nextBody,
    edited_by_clerk_user_id: input.editedByClerkUserId,
  });

  if (error) {
    // Unique violation: retry once with refreshed max.
    if (error.code === "23505") {
      const { data: again } = await admin
        .from("notebook_entry_revisions")
        .select("revision_number")
        .eq("workspace_id", workspaceId)
        .eq("notebook_entry_id", input.entryId)
        .order("revision_number", { ascending: false })
        .limit(1)
        .maybeSingle();
      const retryNumber = (again?.revision_number ?? 0) + 1;
      const { error: retryError } = await admin
        .from("notebook_entry_revisions")
        .insert({
          notebook_entry_id: input.entryId,
          workspace_id: workspaceId,
          revision_number: retryNumber,
          title_snapshot: input.nextTitle,
          body_snapshot: input.nextBody,
          edited_by_clerk_user_id: input.editedByClerkUserId,
        });
      if (retryError) {
        throw new Error("Could not create note revision.");
      }
      return { created: true, revisionNumber: retryNumber };
    }
    throw new Error("Could not create note revision.");
  }

  return { created: true, revisionNumber: nextNumber };
}

export async function listNotebookRevisions(input: {
  workspaceId: string;
  entryId: string;
  currentUserId: string;
  limit?: number;
}): Promise<NotebookEntryRevisionItem[]> {
  const workspaceId = requireWorkspaceScope(input.workspaceId);
  if (!isUuid(input.entryId)) return [];
  const admin = createAdminSupabaseClient();
  const { data } = await admin
    .from("notebook_entry_revisions")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("notebook_entry_id", input.entryId)
    .order("revision_number", { ascending: false })
    .limit(input.limit ?? 50);

  return (data ?? []).map((row) =>
    serializeNotebookRevision({
      row,
      currentUserId: input.currentUserId,
    }),
  );
}
