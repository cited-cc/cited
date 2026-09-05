"use server";

import { revalidatePath } from "next/cache";

import { requireWorkspaceRole } from "@/lib/auth";
import { resolveCurrentAccessState } from "@/lib/auth/access-state";
import {
  canArchiveInboxEvents,
  canResolveInboxEvents,
  canSaveInboxEvents,
  canTriageInboxEvents,
} from "@/lib/auth/permissions";
import { trackProductEvent } from "@/lib/analytics/product";
import { parseInboxSearchParams } from "@/lib/inbox/filters";
import {
  markEventSeenForMember,
  setEventArchivedForMember,
  setEventResolvedForMember,
  setEventSavedForMember,
} from "@/lib/inbox/member-state";
import {
  assertEventInWorkspace,
  assertEventsInWorkspace,
  listInboxEvents,
} from "@/lib/inbox/queries";
import {
  INBOX_BULK_SELECTION_CAP,
  type InboxEventListItem,
  type InboxMemberState,
} from "@/lib/inbox/types";
import type { WorkspaceRole } from "@/types/product";

export type InboxActionResult =
  | { ok: true; memberState: InboxMemberState }
  | { ok: false; error: string };

export type InboxBulkActionResult =
  | { ok: true; updated: number; skipped: number }
  | { ok: false; error: string };

async function requireInboxWorkspace(): Promise<{
  workspaceId: string;
  clerkUserId: string;
  role: WorkspaceRole;
}> {
  const access = await resolveCurrentAccessState();
  if (
    access.kind !== "workspace_active"
  ) {
    return Promise.reject(new Error("Inbox is not available."));
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

function revalidateInbox(): void {
  revalidatePath("/app/inbox");
  revalidatePath("/app");
}

async function authorizeEvent(
  workspaceId: string,
  eventId: string,
): Promise<boolean> {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      eventId,
    )
  ) {
    return false;
  }
  return assertEventInWorkspace({ workspaceId, eventId });
}

export async function markEventSeenAction(
  eventId: string,
): Promise<InboxActionResult> {
  try {
    const ctx = await requireInboxWorkspace();
    if (!canTriageInboxEvents(ctx.role)) {
      return { ok: false, error: "You do not have permission to update this note." };
    }
    const allowed = await authorizeEvent(ctx.workspaceId, eventId);
    if (!allowed) {
      return { ok: false, error: "Citation note not found." };
    }

    const memberState = await markEventSeenForMember({
      workspaceId: ctx.workspaceId,
      citationEventId: eventId,
      clerkUserId: ctx.clerkUserId,
    });
    trackProductEvent("citation_event_opened", {
      event_type_category: "triage",
    });
    revalidateInbox();
    revalidatePath(`/app/inbox/${eventId}`);
    return { ok: true, memberState };
  } catch {
    return { ok: false, error: "Could not mark this note as seen." };
  }
}

export async function markEventSavedAction(
  eventId: string,
): Promise<InboxActionResult> {
  try {
    const ctx = await requireInboxWorkspace();
    if (!canSaveInboxEvents(ctx.role)) {
      return { ok: false, error: "You do not have permission to save notes." };
    }
    const allowed = await authorizeEvent(ctx.workspaceId, eventId);
    if (!allowed) {
      return { ok: false, error: "Citation note not found." };
    }

    const memberState = await setEventSavedForMember({
      workspaceId: ctx.workspaceId,
      citationEventId: eventId,
      clerkUserId: ctx.clerkUserId,
      saved: true,
    });
    trackProductEvent("citation_event_saved", {
      event_type_category: "triage",
    });
    revalidateInbox();
    revalidatePath(`/app/inbox/${eventId}`);
    return { ok: true, memberState };
  } catch {
    return { ok: false, error: "Could not save this note." };
  }
}

export async function markEventUnsavedAction(
  eventId: string,
): Promise<InboxActionResult> {
  try {
    const ctx = await requireInboxWorkspace();
    if (!canSaveInboxEvents(ctx.role)) {
      return { ok: false, error: "You do not have permission to update saved notes." };
    }
    const allowed = await authorizeEvent(ctx.workspaceId, eventId);
    if (!allowed) {
      return { ok: false, error: "Citation note not found." };
    }

    const memberState = await setEventSavedForMember({
      workspaceId: ctx.workspaceId,
      citationEventId: eventId,
      clerkUserId: ctx.clerkUserId,
      saved: false,
    });
    revalidateInbox();
    revalidatePath(`/app/inbox/${eventId}`);
    return { ok: true, memberState };
  } catch {
    return { ok: false, error: "Could not unsave this note." };
  }
}

export async function archiveEventAction(
  eventId: string,
): Promise<InboxActionResult> {
  try {
    const ctx = await requireInboxWorkspace();
    if (!canArchiveInboxEvents(ctx.role)) {
      return { ok: false, error: "You do not have permission to archive notes." };
    }
    const allowed = await authorizeEvent(ctx.workspaceId, eventId);
    if (!allowed) {
      return { ok: false, error: "Citation note not found." };
    }

    const memberState = await setEventArchivedForMember({
      workspaceId: ctx.workspaceId,
      citationEventId: eventId,
      clerkUserId: ctx.clerkUserId,
      archived: true,
    });
    trackProductEvent("citation_event_archived", {
      event_type_category: "triage",
    });
    revalidateInbox();
    revalidatePath(`/app/inbox/${eventId}`);
    return { ok: true, memberState };
  } catch {
    return { ok: false, error: "Could not archive this note." };
  }
}

export async function restoreEventAction(
  eventId: string,
): Promise<InboxActionResult> {
  try {
    const ctx = await requireInboxWorkspace();
    if (!canArchiveInboxEvents(ctx.role)) {
      return { ok: false, error: "You do not have permission to restore notes." };
    }
    const allowed = await authorizeEvent(ctx.workspaceId, eventId);
    if (!allowed) {
      return { ok: false, error: "Citation note not found." };
    }

    const memberState = await setEventArchivedForMember({
      workspaceId: ctx.workspaceId,
      citationEventId: eventId,
      clerkUserId: ctx.clerkUserId,
      archived: false,
    });
    trackProductEvent("citation_event_restored", {
      event_type_category: "triage",
    });
    revalidateInbox();
    revalidatePath(`/app/inbox/${eventId}`);
    return { ok: true, memberState };
  } catch {
    return { ok: false, error: "Could not restore this note." };
  }
}

export async function resolveEventAction(
  eventId: string,
): Promise<InboxActionResult> {
  try {
    const ctx = await requireInboxWorkspace();
    if (!canResolveInboxEvents(ctx.role)) {
      return { ok: false, error: "You do not have permission to resolve notes." };
    }
    const allowed = await authorizeEvent(ctx.workspaceId, eventId);
    if (!allowed) {
      return { ok: false, error: "Citation note not found." };
    }

    const memberState = await setEventResolvedForMember({
      workspaceId: ctx.workspaceId,
      citationEventId: eventId,
      clerkUserId: ctx.clerkUserId,
      resolved: true,
    });
    trackProductEvent("citation_event_resolved", {
      event_type_category: "triage",
    });
    revalidateInbox();
    revalidatePath(`/app/inbox/${eventId}`);
    return { ok: true, memberState };
  } catch {
    return { ok: false, error: "Could not resolve this note." };
  }
}

export async function reopenEventAction(
  eventId: string,
): Promise<InboxActionResult> {
  try {
    const ctx = await requireInboxWorkspace();
    if (!canResolveInboxEvents(ctx.role)) {
      return { ok: false, error: "You do not have permission to reopen notes." };
    }
    const allowed = await authorizeEvent(ctx.workspaceId, eventId);
    if (!allowed) {
      return { ok: false, error: "Citation note not found." };
    }

    const memberState = await setEventResolvedForMember({
      workspaceId: ctx.workspaceId,
      citationEventId: eventId,
      clerkUserId: ctx.clerkUserId,
      resolved: false,
    });
    revalidateInbox();
    revalidatePath(`/app/inbox/${eventId}`);
    return { ok: true, memberState };
  } catch {
    return { ok: false, error: "Could not reopen this note." };
  }
}

function selectionCountBucket(count: number): string {
  if (count <= 1) return "1";
  if (count <= 5) return "2-5";
  if (count <= 20) return "6-20";
  return "21+";
}

export async function bulkMarkSeenAction(
  eventIds: string[],
): Promise<InboxBulkActionResult> {
  try {
    const ctx = await requireInboxWorkspace();
    if (!canTriageInboxEvents(ctx.role)) {
      return { ok: false, error: "You do not have permission to update notes." };
    }

    const unique = Array.from(new Set(eventIds)).slice(
      0,
      INBOX_BULK_SELECTION_CAP,
    );
    if (unique.length === 0) {
      return { ok: true, updated: 0, skipped: 0 };
    }

    const allowedIds = await assertEventsInWorkspace({
      workspaceId: ctx.workspaceId,
      eventIds: unique,
    });
    const skipped = unique.length - allowedIds.length;

    let updated = 0;
    for (const eventId of allowedIds) {
      await markEventSeenForMember({
        workspaceId: ctx.workspaceId,
        citationEventId: eventId,
        clerkUserId: ctx.clerkUserId,
      });
      updated += 1;
    }

    trackProductEvent("inbox_bulk_action_completed", {
      filter_category: "mark_seen",
      selection_count_bucket: selectionCountBucket(updated),
    });
    revalidateInbox();
    return { ok: true, updated, skipped };
  } catch {
    return { ok: false, error: "Could not mark selected notes as seen." };
  }
}

export async function loadMoreInboxEventsAction(input: {
  cursor: string;
  /** Serialized filter query string without leading ? */
  queryString: string;
}): Promise<
  | {
      ok: true;
      items: InboxEventListItem[];
      nextCursor: string | null;
      hasMore: boolean;
    }
  | { ok: false; error: string }
> {
  try {
    const ctx = await requireInboxWorkspace();
    const params = Object.fromEntries(new URLSearchParams(input.queryString));
    const filters = parseInboxSearchParams(params);
    filters.cursor = input.cursor;
    filters.selectedEventId = null;

    const result = await listInboxEvents({
      workspaceId: ctx.workspaceId,
      clerkUserId: ctx.clerkUserId,
      filters,
    });

    return {
      ok: true,
      items: result.items,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    };
  } catch {
    return { ok: false, error: "Could not load more notes." };
  }
}

export async function bulkArchiveAction(
  eventIds: string[],
): Promise<InboxBulkActionResult> {
  try {
    const ctx = await requireInboxWorkspace();
    if (!canArchiveInboxEvents(ctx.role)) {
      return { ok: false, error: "You do not have permission to archive notes." };
    }

    const unique = Array.from(new Set(eventIds)).slice(
      0,
      INBOX_BULK_SELECTION_CAP,
    );
    if (unique.length === 0) {
      return { ok: true, updated: 0, skipped: 0 };
    }

    const allowedIds = await assertEventsInWorkspace({
      workspaceId: ctx.workspaceId,
      eventIds: unique,
    });
    const skipped = unique.length - allowedIds.length;

    let updated = 0;
    for (const eventId of allowedIds) {
      await setEventArchivedForMember({
        workspaceId: ctx.workspaceId,
        citationEventId: eventId,
        clerkUserId: ctx.clerkUserId,
        archived: true,
      });
      updated += 1;
    }

    trackProductEvent("inbox_bulk_action_completed", {
      filter_category: "archive",
      selection_count_bucket: selectionCountBucket(updated),
    });
    revalidateInbox();
    return { ok: true, updated, skipped };
  } catch {
    return { ok: false, error: "Could not archive selected notes." };
  }
}
