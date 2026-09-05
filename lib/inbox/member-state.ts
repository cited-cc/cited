/**
 * Per-member Inbox triage state mutations.
 * Evidence is never deleted. States are personal to clerk_user_id.
 */

import { createAdminSupabaseClient, requireWorkspaceScope } from "@/lib/db/admin";
import type { Tables } from "@/lib/db/types";
import type {
  CitationEventMemberAction,
  InboxMemberState,
} from "@/lib/inbox/types";
import { serializeMemberState } from "@/lib/inbox/serializers";

type MemberStateRow = Tables<"citation_event_member_states">;

export type MemberStatePatch = {
  seenAt?: string | null;
  savedAt?: string | null;
  archivedAt?: string | null;
  resolvedAt?: string | null;
};

async function recordActivity(input: {
  workspaceId: string;
  citationEventId: string;
  clerkUserId: string;
  action: CitationEventMemberAction;
}): Promise<void> {
  const admin = createAdminSupabaseClient();
  await admin.from("citation_event_member_activity").insert({
    workspace_id: input.workspaceId,
    citation_event_id: input.citationEventId,
    clerk_user_id: input.clerkUserId,
    action: input.action,
  });
}

export async function getMemberState(input: {
  workspaceId: string;
  citationEventId: string;
  clerkUserId: string;
}): Promise<MemberStateRow | null> {
  const workspaceId = requireWorkspaceScope(input.workspaceId);
  const admin = createAdminSupabaseClient();
  const { data } = await admin
    .from("citation_event_member_states")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("citation_event_id", input.citationEventId)
    .eq("clerk_user_id", input.clerkUserId)
    .maybeSingle();
  return data ?? null;
}

export async function upsertMemberState(input: {
  workspaceId: string;
  citationEventId: string;
  clerkUserId: string;
  patch: MemberStatePatch;
  activity?: CitationEventMemberAction | null;
}): Promise<InboxMemberState> {
  const workspaceId = requireWorkspaceScope(input.workspaceId);
  const admin = createAdminSupabaseClient();
  const existing = await getMemberState({
    workspaceId,
    citationEventId: input.citationEventId,
    clerkUserId: input.clerkUserId,
  });

  const next = {
    workspace_id: workspaceId,
    citation_event_id: input.citationEventId,
    clerk_user_id: input.clerkUserId,
    seen_at:
      input.patch.seenAt !== undefined
        ? input.patch.seenAt
        : (existing?.seen_at ?? null),
    saved_at:
      input.patch.savedAt !== undefined
        ? input.patch.savedAt
        : (existing?.saved_at ?? null),
    archived_at:
      input.patch.archivedAt !== undefined
        ? input.patch.archivedAt
        : (existing?.archived_at ?? null),
    resolved_at:
      input.patch.resolvedAt !== undefined
        ? input.patch.resolvedAt
        : (existing?.resolved_at ?? null),
  };

  const { data, error } = await admin
    .from("citation_event_member_states")
    .upsert(next, {
      onConflict: "citation_event_id,clerk_user_id",
    })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(
      error?.message ?? "Failed to update citation event member state.",
    );
  }

  if (input.activity) {
    await recordActivity({
      workspaceId,
      citationEventId: input.citationEventId,
      clerkUserId: input.clerkUserId,
      action: input.activity,
    });
  }

  return serializeMemberState(data);
}

export async function markEventSeenForMember(input: {
  workspaceId: string;
  citationEventId: string;
  clerkUserId: string;
}): Promise<InboxMemberState> {
  const existing = await getMemberState(input);
  if (existing?.seen_at) {
    return serializeMemberState(existing);
  }
  return upsertMemberState({
    ...input,
    patch: { seenAt: new Date().toISOString() },
    activity: "seen",
  });
}

export async function setEventSavedForMember(input: {
  workspaceId: string;
  citationEventId: string;
  clerkUserId: string;
  saved: boolean;
}): Promise<InboxMemberState> {
  const existing = await getMemberState(input);
  if (input.saved && existing?.saved_at) {
    return serializeMemberState(existing);
  }
  if (!input.saved && !existing?.saved_at) {
    return serializeMemberState(existing);
  }
  return upsertMemberState({
    workspaceId: input.workspaceId,
    citationEventId: input.citationEventId,
    clerkUserId: input.clerkUserId,
    patch: {
      savedAt: input.saved ? new Date().toISOString() : null,
      // Saving an event also acknowledges it.
      seenAt: input.saved
        ? (existing?.seen_at ?? new Date().toISOString())
        : existing?.seen_at ?? null,
    },
    activity: input.saved ? "saved" : "unsaved",
  });
}

export async function setEventArchivedForMember(input: {
  workspaceId: string;
  citationEventId: string;
  clerkUserId: string;
  archived: boolean;
}): Promise<InboxMemberState> {
  const existing = await getMemberState(input);
  if (input.archived && existing?.archived_at) {
    return serializeMemberState(existing);
  }
  if (!input.archived && !existing?.archived_at) {
    return serializeMemberState(existing);
  }
  return upsertMemberState({
    workspaceId: input.workspaceId,
    citationEventId: input.citationEventId,
    clerkUserId: input.clerkUserId,
    patch: {
      archivedAt: input.archived ? new Date().toISOString() : null,
      seenAt: existing?.seen_at ?? new Date().toISOString(),
    },
    activity: input.archived ? "archived" : "restored",
  });
}

export async function setEventResolvedForMember(input: {
  workspaceId: string;
  citationEventId: string;
  clerkUserId: string;
  resolved: boolean;
}): Promise<InboxMemberState> {
  const existing = await getMemberState(input);
  if (input.resolved && existing?.resolved_at) {
    return serializeMemberState(existing);
  }
  if (!input.resolved && !existing?.resolved_at) {
    return serializeMemberState(existing);
  }
  return upsertMemberState({
    workspaceId: input.workspaceId,
    citationEventId: input.citationEventId,
    clerkUserId: input.clerkUserId,
    patch: {
      resolvedAt: input.resolved ? new Date().toISOString() : null,
      seenAt: existing?.seen_at ?? new Date().toISOString(),
    },
    activity: input.resolved ? "resolved" : "reopened",
  });
}
