"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireWorkspaceRole } from "@/lib/auth";
import { resolveCurrentAccessState } from "@/lib/auth/access-state";
import { trackProductEvent } from "@/lib/analytics/product";
import { createAdminSupabaseClient, requireWorkspaceScope } from "@/lib/db/admin";
import { assertEventInWorkspace } from "@/lib/inbox/queries";
import {
  canArchiveNotebookEntry,
  canChangeNotebookVisibility,
  canCreateNotebookEntry,
  canEditNotebookEntry,
  canPinNotebookEntry,
  canRestoreNotebookRevision,
  canViewNotebookEntry,
} from "@/lib/notebook/permissions";
import {
  createInitialRevision,
  createRevisionIfChanged,
  validateNotebookContent,
} from "@/lib/notebook/revisions";
import { serializeNotebookListItem } from "@/lib/notebook/serializers";
import {
  isUuid,
  type NotebookEntryListItem,
} from "@/lib/notebook/types";
import type { NotebookVisibility, WorkspaceRole } from "@/types/product";

export type NotebookActionResult =
  | { ok: true; entry: NotebookEntryListItem }
  | { ok: false; error: string };

async function requireNotebookWorkspace(): Promise<{
  workspaceId: string;
  clerkUserId: string;
  role: WorkspaceRole;
}> {
  const access = await resolveCurrentAccessState();
  if (
    access.kind !== "workspace_active"
  ) {
    return Promise.reject(new Error("Notebook is not available."));
  }

  const membership = await requireWorkspaceRole(access.workspaceId, [
    "owner",
    "admin",
    "member",
    "viewer",
  ]);

  return {
    workspaceId: membership.workspaceId,
    clerkUserId: membership.clerkUserId,
    role: membership.role,
  };
}

function revalidateNotebook(entryId?: string, eventId?: string | null): void {
  revalidatePath("/app/notebook");
  if (entryId) revalidatePath(`/app/notebook/${entryId}`);
  if (eventId) revalidatePath(`/app/inbox/${eventId}`);
}

const createSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().max(20_000).default(""),
  visibility: z.enum(["workspace", "private"]).default("workspace"),
  citationEventId: z.string().uuid().nullable().optional(),
  pinned: z.boolean().optional(),
});

export async function createNotebookEntryAction(
  input: z.infer<typeof createSchema>,
): Promise<NotebookActionResult> {
  try {
    const parsed = createSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: "Could not create note." };
    }
    const ctx = await requireNotebookWorkspace();
    if (!canCreateNotebookEntry(ctx.role)) {
      return {
        ok: false,
        error: "You do not have permission to create notes.",
      };
    }

    const content = validateNotebookContent({
      title: parsed.data.title,
      body: parsed.data.body,
    });
    if (!content.ok) return content;

    if (parsed.data.citationEventId) {
      const ok = await assertEventInWorkspace({
        workspaceId: ctx.workspaceId,
        eventId: parsed.data.citationEventId,
      });
      if (!ok) {
        return { ok: false, error: "Linked citation note not found." };
      }
    }

    const workspaceId = requireWorkspaceScope(ctx.workspaceId);
    const admin = createAdminSupabaseClient();
    const { data, error } = await admin
      .from("notebook_entries")
      .insert({
        workspace_id: workspaceId,
        author_clerk_user_id: ctx.clerkUserId,
        title: content.title,
        body: content.body,
        body_format: "plain_text",
        visibility: parsed.data.visibility,
        citation_event_id: parsed.data.citationEventId ?? null,
        pinned: parsed.data.pinned ?? false,
      })
      .select("*")
      .single();

    if (error || !data) {
      return { ok: false, error: "Could not create note." };
    }

    await createInitialRevision({
      workspaceId,
      entry: data,
      editedByClerkUserId: ctx.clerkUserId,
    });

    trackProductEvent("notebook_note_created", {
      visibility_category: parsed.data.visibility,
      tab_name: parsed.data.citationEventId ? "linked" : "standalone",
    });
    revalidateNotebook(data.id, data.citation_event_id);

    return {
      ok: true,
      entry: serializeNotebookListItem({
        row: data,
        currentUserId: ctx.clerkUserId,
      }),
    };
  } catch {
    return { ok: false, error: "Could not create note." };
  }
}

export async function updateNotebookEntryAction(input: {
  entryId: string;
  title: string;
  body: string;
}): Promise<NotebookActionResult> {
  try {
    if (!isUuid(input.entryId)) {
      return { ok: false, error: "Note not found." };
    }
    const ctx = await requireNotebookWorkspace();
    const workspaceId = requireWorkspaceScope(ctx.workspaceId);
    const admin = createAdminSupabaseClient();

    const { data: existing } = await admin
      .from("notebook_entries")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("id", input.entryId)
      .is("deleted_at", null)
      .maybeSingle();

    if (!existing) return { ok: false, error: "Note not found." };
    if (
      !canViewNotebookEntry({
        role: ctx.role,
        visibility: existing.visibility,
        authorClerkUserId: existing.author_clerk_user_id,
        currentUserId: ctx.clerkUserId,
      })
    ) {
      return { ok: false, error: "Note not found." };
    }
    if (
      !canEditNotebookEntry({
        role: ctx.role,
        authorClerkUserId: existing.author_clerk_user_id,
        currentUserId: ctx.clerkUserId,
      })
    ) {
      return {
        ok: false,
        error: "You do not have permission to edit this note.",
      };
    }

    const content = validateNotebookContent({
      title: input.title,
      body: input.body,
    });
    if (!content.ok) return content;

    const { data, error } = await admin
      .from("notebook_entries")
      .update({
        title: content.title,
        body: content.body,
      })
      .eq("workspace_id", workspaceId)
      .eq("id", input.entryId)
      .select("*")
      .single();

    if (error || !data) {
      return { ok: false, error: "Could not save note." };
    }

    await createRevisionIfChanged({
      workspaceId,
      entryId: data.id,
      previousTitle: existing.title,
      previousBody: existing.body,
      nextTitle: content.title,
      nextBody: content.body,
      editedByClerkUserId: ctx.clerkUserId,
    });

    trackProductEvent("notebook_note_updated", {
      visibility_category: data.visibility,
    });
    revalidateNotebook(data.id, data.citation_event_id);

    return {
      ok: true,
      entry: serializeNotebookListItem({
        row: data,
        currentUserId: ctx.clerkUserId,
      }),
    };
  } catch {
    return { ok: false, error: "Could not save note." };
  }
}

async function mutateNotebookFlags(input: {
  entryId: string;
  patch: {
    pinned?: boolean;
    archived_at?: string | null;
    deleted_at?: string | null;
    visibility?: NotebookVisibility;
  };
  check: (
    ctx: { role: WorkspaceRole; clerkUserId: string },
    row: {
      author_clerk_user_id: string;
      visibility: NotebookVisibility;
    },
  ) => boolean;
  analytics?: string;
}): Promise<NotebookActionResult> {
  try {
    if (!isUuid(input.entryId)) {
      return { ok: false, error: "Note not found." };
    }
    const ctx = await requireNotebookWorkspace();
    const workspaceId = requireWorkspaceScope(ctx.workspaceId);
    const admin = createAdminSupabaseClient();

    const { data: existing } = await admin
      .from("notebook_entries")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("id", input.entryId)
      .maybeSingle();

    if (!existing || existing.deleted_at) {
      // Soft-deleted notes only restorable via restoreDeleted.
      if (!input.patch.deleted_at && existing?.deleted_at) {
        return { ok: false, error: "Note not found." };
      }
      if (!existing) return { ok: false, error: "Note not found." };
    }

    if (
      existing.visibility === "private" &&
      existing.author_clerk_user_id !== ctx.clerkUserId
    ) {
      return { ok: false, error: "Note not found." };
    }

    if (
      !input.check(
        { role: ctx.role, clerkUserId: ctx.clerkUserId },
        {
          author_clerk_user_id: existing.author_clerk_user_id,
          visibility: existing.visibility,
        },
      )
    ) {
      return {
        ok: false,
        error: "You do not have permission to update this note.",
      };
    }

    const { data, error } = await admin
      .from("notebook_entries")
      .update(input.patch)
      .eq("workspace_id", workspaceId)
      .eq("id", input.entryId)
      .select("*")
      .single();

    if (error || !data) {
      return { ok: false, error: "Could not update note." };
    }

    if (input.analytics) {
      trackProductEvent(
        input.analytics as
          | "notebook_note_archived"
          | "notebook_note_restored"
          | "notebook_note_pinned"
          | "notebook_note_unpinned",
        { visibility_category: data.visibility },
      );
    }

    revalidateNotebook(data.id, data.citation_event_id);
    return {
      ok: true,
      entry: serializeNotebookListItem({
        row: data,
        currentUserId: ctx.clerkUserId,
      }),
    };
  } catch {
    return { ok: false, error: "Could not update note." };
  }
}

export async function archiveNotebookEntryAction(
  entryId: string,
): Promise<NotebookActionResult> {
  return mutateNotebookFlags({
    entryId,
    patch: { archived_at: new Date().toISOString() },
    check: (ctx, row) =>
      canArchiveNotebookEntry({
        role: ctx.role,
        authorClerkUserId: row.author_clerk_user_id,
        currentUserId: ctx.clerkUserId,
        visibility: row.visibility,
      }),
    analytics: "notebook_note_archived",
  });
}

export async function restoreNotebookEntryAction(
  entryId: string,
): Promise<NotebookActionResult> {
  return mutateNotebookFlags({
    entryId,
    patch: { archived_at: null },
    check: (ctx, row) =>
      canArchiveNotebookEntry({
        role: ctx.role,
        authorClerkUserId: row.author_clerk_user_id,
        currentUserId: ctx.clerkUserId,
        visibility: row.visibility,
      }),
    analytics: "notebook_note_restored",
  });
}

export async function deleteNotebookEntryAction(
  entryId: string,
): Promise<NotebookActionResult> {
  return mutateNotebookFlags({
    entryId,
    patch: { deleted_at: new Date().toISOString() },
    check: (ctx, row) =>
      canEditNotebookEntry({
        role: ctx.role,
        authorClerkUserId: row.author_clerk_user_id,
        currentUserId: ctx.clerkUserId,
      }),
  });
}

export async function restoreDeletedNotebookEntryAction(
  entryId: string,
): Promise<NotebookActionResult> {
  return mutateNotebookFlags({
    entryId,
    patch: { deleted_at: null },
    check: (ctx, row) =>
      canEditNotebookEntry({
        role: ctx.role,
        authorClerkUserId: row.author_clerk_user_id,
        currentUserId: ctx.clerkUserId,
      }),
  });
}

export async function pinNotebookEntryAction(
  entryId: string,
): Promise<NotebookActionResult> {
  return mutateNotebookFlags({
    entryId,
    patch: { pinned: true },
    check: (ctx, row) =>
      canPinNotebookEntry({
        role: ctx.role,
        authorClerkUserId: row.author_clerk_user_id,
        currentUserId: ctx.clerkUserId,
        visibility: row.visibility,
      }),
    analytics: "notebook_note_pinned",
  });
}

export async function unpinNotebookEntryAction(
  entryId: string,
): Promise<NotebookActionResult> {
  return mutateNotebookFlags({
    entryId,
    patch: { pinned: false },
    check: (ctx, row) =>
      canPinNotebookEntry({
        role: ctx.role,
        authorClerkUserId: row.author_clerk_user_id,
        currentUserId: ctx.clerkUserId,
        visibility: row.visibility,
      }),
    analytics: "notebook_note_unpinned",
  });
}

export async function changeNotebookEntryVisibilityAction(input: {
  entryId: string;
  visibility: NotebookVisibility;
}): Promise<NotebookActionResult> {
  return mutateNotebookFlags({
    entryId: input.entryId,
    patch: { visibility: input.visibility },
    check: (ctx, row) =>
      canChangeNotebookVisibility({
        role: ctx.role,
        authorClerkUserId: row.author_clerk_user_id,
        currentUserId: ctx.clerkUserId,
      }),
  });
}

export async function restoreNotebookRevisionAction(input: {
  entryId: string;
  revisionId: string;
}): Promise<NotebookActionResult> {
  try {
    if (!isUuid(input.entryId) || !isUuid(input.revisionId)) {
      return { ok: false, error: "Note not found." };
    }
    const ctx = await requireNotebookWorkspace();
    const workspaceId = requireWorkspaceScope(ctx.workspaceId);
    const admin = createAdminSupabaseClient();

    const { data: existing } = await admin
      .from("notebook_entries")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("id", input.entryId)
      .is("deleted_at", null)
      .maybeSingle();

    if (!existing) return { ok: false, error: "Note not found." };
    if (
      !canViewNotebookEntry({
        role: ctx.role,
        visibility: existing.visibility,
        authorClerkUserId: existing.author_clerk_user_id,
        currentUserId: ctx.clerkUserId,
      })
    ) {
      return { ok: false, error: "Note not found." };
    }
    if (
      !canRestoreNotebookRevision({
        role: ctx.role,
        authorClerkUserId: existing.author_clerk_user_id,
        currentUserId: ctx.clerkUserId,
      })
    ) {
      return {
        ok: false,
        error: "You do not have permission to restore this version.",
      };
    }

    const { data: revision } = await admin
      .from("notebook_entry_revisions")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("notebook_entry_id", input.entryId)
      .eq("id", input.revisionId)
      .maybeSingle();

    if (!revision) return { ok: false, error: "Version not found." };

    const { data, error } = await admin
      .from("notebook_entries")
      .update({
        title: revision.title_snapshot,
        body: revision.body_snapshot,
      })
      .eq("workspace_id", workspaceId)
      .eq("id", input.entryId)
      .select("*")
      .single();

    if (error || !data) {
      return { ok: false, error: "Could not restore version." };
    }

    await createRevisionIfChanged({
      workspaceId,
      entryId: data.id,
      previousTitle: existing.title,
      previousBody: existing.body,
      nextTitle: revision.title_snapshot,
      nextBody: revision.body_snapshot,
      editedByClerkUserId: ctx.clerkUserId,
    });

    trackProductEvent("notebook_revision_restored", {
      revision_count_bucket: "restored",
    });
    revalidateNotebook(data.id, data.citation_event_id);

    return {
      ok: true,
      entry: serializeNotebookListItem({
        row: data,
        currentUserId: ctx.clerkUserId,
      }),
    };
  } catch {
    return { ok: false, error: "Could not restore version." };
  }
}
