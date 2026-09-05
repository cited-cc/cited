/**
 * Server-side validation for annotation anchors and bodies.
 * Never trust client offsets alone.
 */

import { createHash } from "node:crypto";

import {
  ANNOTATION_ANCHOR_MAX_LENGTH,
  ANNOTATION_BODY_MAX_LENGTH,
  ANNOTATION_CONTEXT_MAX_LENGTH,
} from "@/lib/evidence/types";

export type AnchorValidationInput = {
  responseText: string;
  anchorStart: number;
  anchorEnd: number;
  selectedText: string;
  contextBefore?: string | null;
  contextAfter?: string | null;
  expectedTargetHash?: string | null;
};

export type AnchorValidationResult =
  | {
      ok: true;
      anchorStart: number;
      anchorEnd: number;
      anchorText: string;
      contextBefore: string | null;
      contextAfter: string | null;
      targetTextHash: string;
    }
  | { ok: false; error: string };

export function normalizePlainText(value: string): string {
  return value.replace(/\r\n/g, "\n");
}

export function hashTargetText(text: string): string {
  return createHash("sha256").update(normalizePlainText(text)).digest("hex");
}

export function validateAnnotationBody(
  body: string,
): { ok: true; body: string } | { ok: false; error: string } {
  const normalized = normalizePlainText(body).trim();
  if (!normalized) {
    return { ok: false, error: "Annotation cannot be empty." };
  }
  if (normalized.length > ANNOTATION_BODY_MAX_LENGTH) {
    return {
      ok: false,
      error: `Annotation must be ${ANNOTATION_BODY_MAX_LENGTH} characters or fewer.`,
    };
  }
  return { ok: true, body: normalized };
}

export function validateResponseAnchor(
  input: AnchorValidationInput,
): AnchorValidationResult {
  const responseText = normalizePlainText(input.responseText);
  const selectedText = normalizePlainText(input.selectedText);

  if (
    !Number.isInteger(input.anchorStart) ||
    !Number.isInteger(input.anchorEnd) ||
    input.anchorStart < 0 ||
    input.anchorEnd <= input.anchorStart
  ) {
    return {
      ok: false,
      error:
        "That evidence selection could not be saved. Try selecting the text again.",
    };
  }

  if (input.anchorEnd > responseText.length) {
    return {
      ok: false,
      error:
        "That evidence selection could not be saved. Try selecting the text again.",
    };
  }

  const slice = responseText.slice(input.anchorStart, input.anchorEnd);
  if (slice !== selectedText) {
    return {
      ok: false,
      error:
        "That evidence selection could not be saved. Try selecting the text again.",
    };
  }

  if (selectedText.length > ANNOTATION_ANCHOR_MAX_LENGTH) {
    return {
      ok: false,
      error: `Selected text must be ${ANNOTATION_ANCHOR_MAX_LENGTH} characters or fewer.`,
    };
  }

  const targetTextHash = hashTargetText(responseText);
  if (
    input.expectedTargetHash &&
    input.expectedTargetHash !== targetTextHash
  ) {
    return {
      ok: false,
      error:
        "That evidence selection could not be saved. Try selecting the text again.",
    };
  }

  const contextBefore = boundContext(
    input.contextBefore,
    responseText.slice(
      Math.max(0, input.anchorStart - ANNOTATION_CONTEXT_MAX_LENGTH),
      input.anchorStart,
    ),
  );
  const contextAfter = boundContext(
    input.contextAfter,
    responseText.slice(
      input.anchorEnd,
      Math.min(
        responseText.length,
        input.anchorEnd + ANNOTATION_CONTEXT_MAX_LENGTH,
      ),
    ),
  );

  return {
    ok: true,
    anchorStart: input.anchorStart,
    anchorEnd: input.anchorEnd,
    anchorText: selectedText,
    contextBefore,
    contextAfter,
    targetTextHash,
  };
}

function boundContext(
  clientValue: string | null | undefined,
  derived: string,
): string | null {
  const candidate = normalizePlainText(clientValue ?? derived).slice(
    0,
    ANNOTATION_CONTEXT_MAX_LENGTH,
  );
  return candidate.length > 0 ? candidate : null;
}
