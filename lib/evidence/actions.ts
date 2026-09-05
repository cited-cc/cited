"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireWorkspaceRole } from "@/lib/auth";
import { resolveCurrentAccessState } from "@/lib/auth/access-state";
import {
  canCreateAnnotations,
  canModerateWorkspaceAnnotations,
} from "@/lib/auth/permissions";
import { trackProductEvent } from "@/lib/analytics/product";
import {
  createEvidenceAnnotation,
  createEventAnnotation,
  createResponseAnnotation,
  deleteAnnotation,
  reopenAnnotation,
  resolveAnnotation,
  restoreAnnotation,
  updateAnnotation,
} from "@/lib/evidence/annotations";
import { getCitationEventOccurrences } from "@/lib/evidence/queries";
import { isUuid, type CitationAnnotationItem } from "@/lib/evidence/types";
import type {
  CitationAnnotationVisibility,
  WorkspaceRole,
} from "@/types/product";

export type EvidenceActionResult =
  | { ok: true; annotation: CitationAnnotationItem }
  | { ok: false; error: string };

async function requireEvidenceWorkspace(): Promise<{
  workspaceId: string;
  clerkUserId: string;
  role: WorkspaceRole;
}> {
  const access = await resolveCurrentAccessState();
  if (
    access.kind !== "workspace_active"
  ) {
    return Promise.reject(new Error("Evidence is not available."));
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

function revalidateEvidence(eventId: string): void {
  revalidatePath("/app/inbox");
  revalidatePath(`/app/inbox/${eventId}`);
  revalidatePath("/app/notebook");
}

const visibilitySchema = z.enum(["workspace", "private"]);

const eventAnnotationSchema = z.object({
  eventId: z.string().uuid(),
  body: z.string().min(1).max(4000),
  visibility: visibilitySchema.default("workspace"),
});

const responseAnnotationSchema = z.object({
  eventId: z.string().uuid(),
  aiResponseId: z.string().uuid(),
  body: z.string().min(1).max(4000),
  visibility: visibilitySchema.default("workspace"),
  anchorStart: z.number().int().nonnegative().nullable().optional(),
  anchorEnd: z.number().int().positive().nullable().optional(),
  selectedText: z.string().max(1000).nullable().optional(),
  contextBefore: z.string().max(200).nullable().optional(),
  contextAfter: z.string().max(200).nullable().optional(),
  targetTextHash: z.string().max(128).nullable().optional(),
});

const evidenceAnnotationSchema = z.object({
  eventId: z.string().uuid(),
  evidenceId: z.string().uuid(),
  aiResponseId: z.string().uuid().nullable().optional(),
  body: z.string().min(1).max(4000),
  visibility: visibilitySchema.default("workspace"),
  anchorText: z.string().max(1000).nullable().optional(),
});

export async function createEventAnnotationAction(
  input: z.infer<typeof eventAnnotationSchema>,
): Promise<EvidenceActionResult> {
  try {
    const parsed = eventAnnotationSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: "Could not save annotation." };
    }
    const ctx = await requireEvidenceWorkspace();
    if (!canCreateAnnotations(ctx.role)) {
      return {
        ok: false,
        error: "You do not have permission to create annotations.",
      };
    }
    const result = await createEventAnnotation({
      workspaceId: ctx.workspaceId,
      clerkUserId: ctx.clerkUserId,
      role: ctx.role,
      eventId: parsed.data.eventId,
      body: parsed.data.body,
      visibility: parsed.data.visibility as CitationAnnotationVisibility,
    });
    if (result.ok) {
      trackProductEvent("citation_annotation_created", {
        annotation_target_kind: "event",
        visibility_category: parsed.data.visibility,
      });
      revalidateEvidence(parsed.data.eventId);
    }
    return result;
  } catch {
    return { ok: false, error: "Could not save annotation." };
  }
}

export async function createResponseAnnotationAction(
  input: z.infer<typeof responseAnnotationSchema>,
): Promise<EvidenceActionResult> {
  try {
    const parsed = responseAnnotationSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error:
          "That evidence selection could not be saved. Try selecting the text again.",
      };
    }
    const ctx = await requireEvidenceWorkspace();
    if (!canCreateAnnotations(ctx.role)) {
      return {
        ok: false,
        error: "You do not have permission to create annotations.",
      };
    }
    const result = await createResponseAnnotation({
      workspaceId: ctx.workspaceId,
      clerkUserId: ctx.clerkUserId,
      role: ctx.role,
      eventId: parsed.data.eventId,
      aiResponseId: parsed.data.aiResponseId,
      body: parsed.data.body,
      visibility: parsed.data.visibility as CitationAnnotationVisibility,
      anchorStart: parsed.data.anchorStart,
      anchorEnd: parsed.data.anchorEnd,
      selectedText: parsed.data.selectedText,
      contextBefore: parsed.data.contextBefore,
      contextAfter: parsed.data.contextAfter,
      targetTextHash: parsed.data.targetTextHash,
    });
    if (result.ok) {
      trackProductEvent("citation_annotation_created", {
        annotation_target_kind: "response",
        visibility_category: parsed.data.visibility,
      });
      revalidateEvidence(parsed.data.eventId);
    }
    return result;
  } catch {
    return { ok: false, error: "Could not save annotation." };
  }
}

export async function createEvidenceAnnotationAction(
  input: z.infer<typeof evidenceAnnotationSchema>,
): Promise<EvidenceActionResult> {
  try {
    const parsed = evidenceAnnotationSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: "Could not save annotation." };
    }
    const ctx = await requireEvidenceWorkspace();
    if (!canCreateAnnotations(ctx.role)) {
      return {
        ok: false,
        error: "You do not have permission to create annotations.",
      };
    }
    const result = await createEvidenceAnnotation({
      workspaceId: ctx.workspaceId,
      clerkUserId: ctx.clerkUserId,
      role: ctx.role,
      eventId: parsed.data.eventId,
      evidenceId: parsed.data.evidenceId,
      aiResponseId: parsed.data.aiResponseId,
      body: parsed.data.body,
      visibility: parsed.data.visibility as CitationAnnotationVisibility,
      anchorText: parsed.data.anchorText,
    });
    if (result.ok) {
      trackProductEvent("citation_annotation_created", {
        annotation_target_kind: "evidence",
        visibility_category: parsed.data.visibility,
      });
      revalidateEvidence(parsed.data.eventId);
    }
    return result;
  } catch {
    return { ok: false, error: "Could not save annotation." };
  }
}

export async function updateAnnotationAction(input: {
  annotationId: string;
  eventId: string;
  body: string;
  visibility?: CitationAnnotationVisibility;
}): Promise<EvidenceActionResult> {
  try {
    if (!isUuid(input.annotationId) || !isUuid(input.eventId)) {
      return { ok: false, error: "Annotation not found." };
    }
    const ctx = await requireEvidenceWorkspace();
    const result = await updateAnnotation({
      workspaceId: ctx.workspaceId,
      clerkUserId: ctx.clerkUserId,
      role: ctx.role,
      annotationId: input.annotationId,
      body: input.body,
      visibility: input.visibility,
    });
    if (result.ok) revalidateEvidence(input.eventId);
    return result;
  } catch {
    return { ok: false, error: "Could not update annotation." };
  }
}

export async function resolveAnnotationAction(input: {
  annotationId: string;
  eventId: string;
}): Promise<EvidenceActionResult> {
  try {
    if (!isUuid(input.annotationId) || !isUuid(input.eventId)) {
      return { ok: false, error: "Annotation not found." };
    }
    const ctx = await requireEvidenceWorkspace();
    const result = await resolveAnnotation({
      workspaceId: ctx.workspaceId,
      clerkUserId: ctx.clerkUserId,
      role: ctx.role,
      annotationId: input.annotationId,
    });
    if (result.ok) {
      trackProductEvent("citation_annotation_resolved", {
        annotation_target_kind: result.annotation.targetKind,
      });
      revalidateEvidence(input.eventId);
    }
    return result;
  } catch {
    return { ok: false, error: "Could not resolve annotation." };
  }
}

export async function reopenAnnotationAction(input: {
  annotationId: string;
  eventId: string;
}): Promise<EvidenceActionResult> {
  try {
    if (!isUuid(input.annotationId) || !isUuid(input.eventId)) {
      return { ok: false, error: "Annotation not found." };
    }
    const ctx = await requireEvidenceWorkspace();
    const result = await reopenAnnotation({
      workspaceId: ctx.workspaceId,
      clerkUserId: ctx.clerkUserId,
      role: ctx.role,
      annotationId: input.annotationId,
    });
    if (result.ok) {
      trackProductEvent("citation_annotation_reopened", {
        annotation_target_kind: result.annotation.targetKind,
      });
      revalidateEvidence(input.eventId);
    }
    return result;
  } catch {
    return { ok: false, error: "Could not reopen annotation." };
  }
}

export async function deleteAnnotationAction(input: {
  annotationId: string;
  eventId: string;
}): Promise<EvidenceActionResult> {
  try {
    if (!isUuid(input.annotationId) || !isUuid(input.eventId)) {
      return { ok: false, error: "Annotation not found." };
    }
    const ctx = await requireEvidenceWorkspace();
    const result = await deleteAnnotation({
      workspaceId: ctx.workspaceId,
      clerkUserId: ctx.clerkUserId,
      role: ctx.role,
      annotationId: input.annotationId,
    });
    if (result.ok) {
      trackProductEvent("citation_annotation_deleted", {
        annotation_target_kind: result.annotation.targetKind,
      });
      revalidateEvidence(input.eventId);
    }
    return result;
  } catch {
    return { ok: false, error: "Could not delete annotation." };
  }
}

export async function restoreAnnotationAction(input: {
  annotationId: string;
  eventId: string;
}): Promise<EvidenceActionResult> {
  try {
    if (!isUuid(input.annotationId) || !isUuid(input.eventId)) {
      return { ok: false, error: "Annotation not found." };
    }
    const ctx = await requireEvidenceWorkspace();
    if (
      !canModerateWorkspaceAnnotations(ctx.role) &&
      ctx.role !== "member"
    ) {
      return {
        ok: false,
        error: "You do not have permission to restore this annotation.",
      };
    }
    const result = await restoreAnnotation({
      workspaceId: ctx.workspaceId,
      clerkUserId: ctx.clerkUserId,
      role: ctx.role,
      annotationId: input.annotationId,
    });
    if (result.ok) revalidateEvidence(input.eventId);
    return result;
  } catch {
    return { ok: false, error: "Could not restore annotation." };
  }
}

export async function loadMoreOccurrencesAction(input: {
  eventId: string;
  cursor: string;
}): Promise<
  | {
      ok: true;
      items: Awaited<ReturnType<typeof getCitationEventOccurrences>>["items"];
      nextCursor: string | null;
      hasMore: boolean;
    }
  | { ok: false; error: string }
> {
  try {
    if (!isUuid(input.eventId)) {
      return { ok: false, error: "Citation note not found." };
    }
    const ctx = await requireEvidenceWorkspace();
    const page = await getCitationEventOccurrences({
      workspaceId: ctx.workspaceId,
      eventId: input.eventId,
      cursor: input.cursor,
    });
    return {
      ok: true,
      items: page.items,
      nextCursor: page.nextCursor,
      hasMore: page.hasMore,
    };
  } catch {
    return { ok: false, error: "Could not load more observations." };
  }
}
