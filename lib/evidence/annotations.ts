/**
 * Annotation create/update helpers (server-side).
 */

import { createAdminSupabaseClient, requireWorkspaceScope } from "@/lib/db/admin";
import type { Tables } from "@/lib/db/types";
import {
  hashTargetText,
  validateAnnotationBody,
  validateResponseAnchor,
} from "@/lib/evidence/annotation-validation";
import { serializeAnnotationItem } from "@/lib/evidence/serializers";
import { isUuid, type CitationAnnotationItem } from "@/lib/evidence/types";
import type {
  CitationAnnotationActivityAction,
  CitationAnnotationTargetKind,
  CitationAnnotationVisibility,
  WorkspaceRole,
} from "@/types/product";

type TablesAnnotation = Tables<"citation_annotations">;

export type AnnotationActionResult =
  | { ok: true; annotation: CitationAnnotationItem }
  | { ok: false; error: string };

async function recordAnnotationActivity(input: {
  workspaceId: string;
  annotationId: string;
  clerkUserId: string;
  action: CitationAnnotationActivityAction;
}): Promise<void> {
  const admin = createAdminSupabaseClient();
  await admin.from("citation_annotation_activity").insert({
    workspace_id: input.workspaceId,
    citation_annotation_id: input.annotationId,
    clerk_user_id: input.clerkUserId,
    action: input.action,
  });
}

async function assertEventInWorkspace(input: {
  workspaceId: string;
  eventId: string;
}): Promise<boolean> {
  if (!isUuid(input.eventId)) return false;
  const admin = createAdminSupabaseClient();
  const { data } = await admin
    .from("citation_events")
    .select("id")
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.eventId)
    .maybeSingle();
  return Boolean(data);
}

async function assertResponseBelongsToEvent(input: {
  workspaceId: string;
  eventId: string;
  aiResponseId: string;
}): Promise<{ ok: true; responseText: string } | { ok: false }> {
  if (!isUuid(input.aiResponseId)) return { ok: false };
  const admin = createAdminSupabaseClient();

  const { data: occurrence } = await admin
    .from("citation_event_occurrences")
    .select("id")
    .eq("workspace_id", input.workspaceId)
    .eq("citation_event_id", input.eventId)
    .eq("ai_response_id", input.aiResponseId)
    .limit(1)
    .maybeSingle();

  if (!occurrence) {
    // Also allow the event's primary ai_response_id.
    const { data: event } = await admin
      .from("citation_events")
      .select("ai_response_id")
      .eq("workspace_id", input.workspaceId)
      .eq("id", input.eventId)
      .maybeSingle();
    if (!event || event.ai_response_id !== input.aiResponseId) {
      return { ok: false };
    }
  }

  const { data: response } = await admin
    .from("ai_responses")
    .select("id, response_text")
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.aiResponseId)
    .maybeSingle();

  if (!response?.response_text) return { ok: false };
  return { ok: true, responseText: response.response_text };
}

async function assertEvidenceBelongsToEvent(input: {
  workspaceId: string;
  eventId: string;
  evidenceId: string;
}): Promise<boolean> {
  if (!isUuid(input.evidenceId)) return false;
  const admin = createAdminSupabaseClient();
  const { data: evidence } = await admin
    .from("citation_evidence")
    .select("id, citation_event_id")
    .eq("id", input.evidenceId)
    .maybeSingle();
  if (!evidence || evidence.citation_event_id !== input.eventId) return false;

  const { data: event } = await admin
    .from("citation_events")
    .select("id")
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.eventId)
    .maybeSingle();
  return Boolean(event);
}

export async function createEventAnnotation(input: {
  workspaceId: string;
  clerkUserId: string;
  role: WorkspaceRole;
  eventId: string;
  body: string;
  visibility: CitationAnnotationVisibility;
}): Promise<AnnotationActionResult> {
  const workspaceId = requireWorkspaceScope(input.workspaceId);
  const bodyResult = validateAnnotationBody(input.body);
  if (!bodyResult.ok) return bodyResult;

  const allowed = await assertEventInWorkspace({
    workspaceId,
    eventId: input.eventId,
  });
  if (!allowed) return { ok: false, error: "Citation note not found." };

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("citation_annotations")
    .insert({
      workspace_id: workspaceId,
      citation_event_id: input.eventId,
      target_kind: "event" satisfies CitationAnnotationTargetKind,
      body: bodyResult.body,
      visibility: input.visibility,
      author_clerk_user_id: input.clerkUserId,
    })
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, error: "Could not save annotation." };
  }

  await recordAnnotationActivity({
    workspaceId,
    annotationId: data.id,
    clerkUserId: input.clerkUserId,
    action: "created",
  });

  return {
    ok: true,
    annotation: serializeAnnotationItem({
      row: data,
      currentUserId: input.clerkUserId,
      role: input.role,
    }),
  };
}

export async function createResponseAnnotation(input: {
  workspaceId: string;
  clerkUserId: string;
  role: WorkspaceRole;
  eventId: string;
  aiResponseId: string;
  body: string;
  visibility: CitationAnnotationVisibility;
  anchorStart?: number | null;
  anchorEnd?: number | null;
  selectedText?: string | null;
  contextBefore?: string | null;
  contextAfter?: string | null;
  targetTextHash?: string | null;
}): Promise<AnnotationActionResult> {
  const workspaceId = requireWorkspaceScope(input.workspaceId);
  const bodyResult = validateAnnotationBody(input.body);
  if (!bodyResult.ok) return bodyResult;

  const allowed = await assertEventInWorkspace({
    workspaceId,
    eventId: input.eventId,
  });
  if (!allowed) return { ok: false, error: "Citation note not found." };

  const responseCheck = await assertResponseBelongsToEvent({
    workspaceId,
    eventId: input.eventId,
    aiResponseId: input.aiResponseId,
  });
  if (!responseCheck.ok) {
    return { ok: false, error: "Citation note not found." };
  }

  let anchorStart: number | null = null;
  let anchorEnd: number | null = null;
  let anchorText: string | null = null;
  let contextBefore: string | null = null;
  let contextAfter: string | null = null;
  let targetTextHash = hashTargetText(responseCheck.responseText);

  if (
    input.anchorStart != null ||
    input.anchorEnd != null ||
    input.selectedText
  ) {
    const anchor = validateResponseAnchor({
      responseText: responseCheck.responseText,
      anchorStart: input.anchorStart ?? -1,
      anchorEnd: input.anchorEnd ?? -1,
      selectedText: input.selectedText ?? "",
      contextBefore: input.contextBefore,
      contextAfter: input.contextAfter,
      expectedTargetHash: input.targetTextHash,
    });
    if (!anchor.ok) return anchor;
    anchorStart = anchor.anchorStart;
    anchorEnd = anchor.anchorEnd;
    anchorText = anchor.anchorText;
    contextBefore = anchor.contextBefore;
    contextAfter = anchor.contextAfter;
    targetTextHash = anchor.targetTextHash;
  }

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("citation_annotations")
    .insert({
      workspace_id: workspaceId,
      citation_event_id: input.eventId,
      ai_response_id: input.aiResponseId,
      target_kind: "response",
      body: bodyResult.body,
      visibility: input.visibility,
      author_clerk_user_id: input.clerkUserId,
      anchor_start: anchorStart,
      anchor_end: anchorEnd,
      anchor_text: anchorText,
      context_before: contextBefore,
      context_after: contextAfter,
      target_text_hash: targetTextHash,
    })
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, error: "Could not save annotation." };
  }

  await recordAnnotationActivity({
    workspaceId,
    annotationId: data.id,
    clerkUserId: input.clerkUserId,
    action: "created",
  });

  return {
    ok: true,
    annotation: serializeAnnotationItem({
      row: data,
      currentUserId: input.clerkUserId,
      role: input.role,
    }),
  };
}

export async function createEvidenceAnnotation(input: {
  workspaceId: string;
  clerkUserId: string;
  role: WorkspaceRole;
  eventId: string;
  evidenceId: string;
  aiResponseId?: string | null;
  body: string;
  visibility: CitationAnnotationVisibility;
  anchorText?: string | null;
}): Promise<AnnotationActionResult> {
  const workspaceId = requireWorkspaceScope(input.workspaceId);
  const bodyResult = validateAnnotationBody(input.body);
  if (!bodyResult.ok) return bodyResult;

  const allowed = await assertEventInWorkspace({
    workspaceId,
    eventId: input.eventId,
  });
  if (!allowed) return { ok: false, error: "Citation note not found." };

  const evidenceOk = await assertEvidenceBelongsToEvent({
    workspaceId,
    eventId: input.eventId,
    evidenceId: input.evidenceId,
  });
  if (!evidenceOk) return { ok: false, error: "Citation note not found." };

  let aiResponseId: string | null = null;
  if (input.aiResponseId) {
    const responseCheck = await assertResponseBelongsToEvent({
      workspaceId,
      eventId: input.eventId,
      aiResponseId: input.aiResponseId,
    });
    if (!responseCheck.ok) {
      return { ok: false, error: "Citation note not found." };
    }
    aiResponseId = input.aiResponseId;
  }

  const anchorText =
    input.anchorText && input.anchorText.trim()
      ? input.anchorText.trim().slice(0, 1000)
      : null;

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("citation_annotations")
    .insert({
      workspace_id: workspaceId,
      citation_event_id: input.eventId,
      citation_evidence_id: input.evidenceId,
      ai_response_id: aiResponseId,
      target_kind: "evidence",
      body: bodyResult.body,
      visibility: input.visibility,
      author_clerk_user_id: input.clerkUserId,
      anchor_text: anchorText,
      target_text_hash: anchorText ? hashTargetText(anchorText) : null,
    })
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, error: "Could not save annotation." };
  }

  await recordAnnotationActivity({
    workspaceId,
    annotationId: data.id,
    clerkUserId: input.clerkUserId,
    action: "created",
  });

  return {
    ok: true,
    annotation: serializeAnnotationItem({
      row: data,
      currentUserId: input.clerkUserId,
      role: input.role,
    }),
  };
}

async function loadOwnedAnnotation(input: {
  workspaceId: string;
  annotationId: string;
  clerkUserId: string;
  role: WorkspaceRole;
  requireAuthor?: boolean;
}): Promise<
  | { ok: true; row: TablesAnnotation }
  | { ok: false; error: string }
> {
  if (!isUuid(input.annotationId)) {
    return { ok: false, error: "Annotation not found." };
  }
  const admin = createAdminSupabaseClient();
  const { data } = await admin
    .from("citation_annotations")
    .select("*")
    .eq("workspace_id", input.workspaceId)
    .eq("id", input.annotationId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!data) return { ok: false, error: "Annotation not found." };

  const isAuthor = data.author_clerk_user_id === input.clerkUserId;
  const isAdmin = input.role === "owner" || input.role === "admin";

  if (data.visibility === "private" && !isAuthor) {
    return { ok: false, error: "Annotation not found." };
  }

  if (input.requireAuthor && !isAuthor && !isAdmin) {
    return { ok: false, error: "You do not have permission to update this annotation." };
  }

  return { ok: true, row: data };
}

export async function updateAnnotation(input: {
  workspaceId: string;
  clerkUserId: string;
  role: WorkspaceRole;
  annotationId: string;
  body: string;
  visibility?: CitationAnnotationVisibility;
}): Promise<AnnotationActionResult> {
  const workspaceId = requireWorkspaceScope(input.workspaceId);
  const bodyResult = validateAnnotationBody(input.body);
  if (!bodyResult.ok) return bodyResult;

  const loaded = await loadOwnedAnnotation({
    workspaceId,
    annotationId: input.annotationId,
    clerkUserId: input.clerkUserId,
    role: input.role,
    requireAuthor: true,
  });
  if (!loaded.ok) return loaded;

  if (loaded.row.author_clerk_user_id !== input.clerkUserId) {
    return {
      ok: false,
      error: "You do not have permission to update this annotation.",
    };
  }

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("citation_annotations")
    .update({
      body: bodyResult.body,
      ...(input.visibility ? { visibility: input.visibility } : {}),
    })
    .eq("workspace_id", workspaceId)
    .eq("id", input.annotationId)
    .eq("author_clerk_user_id", input.clerkUserId)
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, error: "Could not update annotation." };
  }

  await recordAnnotationActivity({
    workspaceId,
    annotationId: data.id,
    clerkUserId: input.clerkUserId,
    action: "edited",
  });

  return {
    ok: true,
    annotation: serializeAnnotationItem({
      row: data,
      currentUserId: input.clerkUserId,
      role: input.role,
    }),
  };
}

export async function resolveAnnotation(input: {
  workspaceId: string;
  clerkUserId: string;
  role: WorkspaceRole;
  annotationId: string;
}): Promise<AnnotationActionResult> {
  return setAnnotationResolved(input, true);
}

export async function reopenAnnotation(input: {
  workspaceId: string;
  clerkUserId: string;
  role: WorkspaceRole;
  annotationId: string;
}): Promise<AnnotationActionResult> {
  return setAnnotationResolved(input, false);
}

async function setAnnotationResolved(
  input: {
    workspaceId: string;
    clerkUserId: string;
    role: WorkspaceRole;
    annotationId: string;
  },
  resolved: boolean,
): Promise<AnnotationActionResult> {
  const workspaceId = requireWorkspaceScope(input.workspaceId);
  const loaded = await loadOwnedAnnotation({
    workspaceId,
    annotationId: input.annotationId,
    clerkUserId: input.clerkUserId,
    role: input.role,
  });
  if (!loaded.ok) return loaded;

  const isAuthor = loaded.row.author_clerk_user_id === input.clerkUserId;
  const isAdmin = input.role === "owner" || input.role === "admin";
  if (!isAuthor && !(isAdmin && loaded.row.visibility === "workspace")) {
    return {
      ok: false,
      error: "You do not have permission to update this annotation.",
    };
  }

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("citation_annotations")
    .update({
      resolved_at: resolved ? new Date().toISOString() : null,
    })
    .eq("workspace_id", workspaceId)
    .eq("id", input.annotationId)
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, error: "Could not update annotation." };
  }

  await recordAnnotationActivity({
    workspaceId,
    annotationId: data.id,
    clerkUserId: input.clerkUserId,
    action: resolved ? "resolved" : "reopened",
  });

  return {
    ok: true,
    annotation: serializeAnnotationItem({
      row: data,
      currentUserId: input.clerkUserId,
      role: input.role,
    }),
  };
}

export async function deleteAnnotation(input: {
  workspaceId: string;
  clerkUserId: string;
  role: WorkspaceRole;
  annotationId: string;
}): Promise<AnnotationActionResult> {
  const workspaceId = requireWorkspaceScope(input.workspaceId);
  const loaded = await loadOwnedAnnotation({
    workspaceId,
    annotationId: input.annotationId,
    clerkUserId: input.clerkUserId,
    role: input.role,
  });
  if (!loaded.ok) return loaded;

  const isAuthor = loaded.row.author_clerk_user_id === input.clerkUserId;
  const isAdmin = input.role === "owner" || input.role === "admin";
  if (!isAuthor && !isAdmin) {
    return {
      ok: false,
      error: "You do not have permission to delete this annotation.",
    };
  }

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("citation_annotations")
    .update({ deleted_at: new Date().toISOString() })
    .eq("workspace_id", workspaceId)
    .eq("id", input.annotationId)
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, error: "Could not delete annotation." };
  }

  await recordAnnotationActivity({
    workspaceId,
    annotationId: data.id,
    clerkUserId: input.clerkUserId,
    action: "deleted",
  });

  return {
    ok: true,
    annotation: serializeAnnotationItem({
      row: data,
      currentUserId: input.clerkUserId,
      role: input.role,
    }),
  };
}

export async function restoreAnnotation(input: {
  workspaceId: string;
  clerkUserId: string;
  role: WorkspaceRole;
  annotationId: string;
}): Promise<AnnotationActionResult> {
  const workspaceId = requireWorkspaceScope(input.workspaceId);
  if (!isUuid(input.annotationId)) {
    return { ok: false, error: "Annotation not found." };
  }

  const admin = createAdminSupabaseClient();
  const { data: existing } = await admin
    .from("citation_annotations")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("id", input.annotationId)
    .not("deleted_at", "is", null)
    .maybeSingle();

  if (!existing) return { ok: false, error: "Annotation not found." };

  const isAuthor = existing.author_clerk_user_id === input.clerkUserId;
  const isAdmin = input.role === "owner" || input.role === "admin";
  if (!isAuthor && !isAdmin) {
    return {
      ok: false,
      error: "You do not have permission to restore this annotation.",
    };
  }

  const { data, error } = await admin
    .from("citation_annotations")
    .update({ deleted_at: null })
    .eq("workspace_id", workspaceId)
    .eq("id", input.annotationId)
    .select("*")
    .single();

  if (error || !data) {
    return { ok: false, error: "Could not restore annotation." };
  }

  await recordAnnotationActivity({
    workspaceId,
    annotationId: data.id,
    clerkUserId: input.clerkUserId,
    action: "restored",
  });

  return {
    ok: true,
    annotation: serializeAnnotationItem({
      row: data,
      currentUserId: input.clerkUserId,
      role: input.role,
    }),
  };
}
