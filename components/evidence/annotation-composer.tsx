"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { RadioGroup, RadioItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import {
  createEventAnnotationAction,
  createEvidenceAnnotationAction,
  createResponseAnnotationAction,
} from "@/lib/evidence/actions";
import {
  ANNOTATION_BODY_MAX_LENGTH,
  type CitationAnnotationItem,
} from "@/lib/evidence/types";
import type { CitationAnnotationVisibility } from "@/types/product";
import { cn } from "@/lib/utils";

export type AnnotationComposerTarget =
  | { kind: "event" }
  | {
      kind: "response";
      aiResponseId: string;
      anchorStart?: number | null;
      anchorEnd?: number | null;
      selectedText?: string | null;
      contextBefore?: string | null;
      contextAfter?: string | null;
    }
  | {
      kind: "evidence";
      evidenceId: string;
      aiResponseId?: string | null;
      anchorText?: string | null;
    };

type AnnotationComposerProps = {
  eventId: string;
  target: AnnotationComposerTarget;
  onCancel: () => void;
  onSaved?: (annotation: CitationAnnotationItem) => void;
  className?: string;
};

export function AnnotationComposer({
  eventId,
  target,
  onCancel,
  onSaved,
  className,
}: AnnotationComposerProps) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [body, setBody] = useState("");
  const [visibility, setVisibility] =
    useState<CitationAnnotationVisibility>("workspace");

  const trimmed = body.trim();
  const invalid =
    trimmed.length === 0 || trimmed.length > ANNOTATION_BODY_MAX_LENGTH;

  function save() {
    if (invalid) return;
    startTransition(async () => {
      let result;
      switch (target.kind) {
        case "event":
          result = await createEventAnnotationAction({
            eventId,
            body: trimmed,
            visibility,
          });
          break;
        case "response":
          result = await createResponseAnnotationAction({
            eventId,
            aiResponseId: target.aiResponseId,
            body: trimmed,
            visibility,
            anchorStart: target.anchorStart ?? null,
            anchorEnd: target.anchorEnd ?? null,
            selectedText: target.selectedText ?? null,
            contextBefore: target.contextBefore ?? null,
            contextAfter: target.contextAfter ?? null,
          });
          break;
        case "evidence":
          result = await createEvidenceAnnotationAction({
            eventId,
            evidenceId: target.evidenceId,
            aiResponseId: target.aiResponseId,
            body: trimmed,
            visibility,
            anchorText: target.anchorText,
          });
          break;
        default: {
          const _exhaustive: never = target;
          return _exhaustive;
        }
      }

      if (!result.ok) {
        toast({
          title: "Could not save annotation",
          description: result.error,
          tone: "danger",
        });
        return;
      }
      onSaved?.(result.annotation);
      setBody("");
    });
  }

  return (
    <div
      className={cn(
        "rounded-md border border-cited-line bg-cited-surface-raised px-3 py-3",
        className,
      )}
    >
      <p className="type-micro text-cited-ink-faint">New annotation</p>
      {target.kind === "response" && target.selectedText ? (
        <p className="mt-2 line-clamp-2 border-l border-cited-citation/40 pl-2 type-body-sm text-cited-ink-subtle">
          {target.selectedText}
        </p>
      ) : null}
      <Textarea
        className="mt-3"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="What matters about this evidence?"
        maxLength={ANNOTATION_BODY_MAX_LENGTH}
        aria-label="Annotation body"
        disabled={pending}
      />
      <RadioGroup
        className="mt-3"
        label="Visibility"
        value={visibility}
        onChange={(v) => setVisibility(v as CitationAnnotationVisibility)}
        disabled={pending}
      >
        <RadioItem
          value="workspace"
          label="Workspace"
          description="Visible to your workspace."
        />
        <RadioItem
          value="private"
          label="Private"
          description="Only visible to you."
        />
      </RadioGroup>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="primary"
          size="sm"
          loading={pending}
          disabled={invalid}
          onClick={save}
        >
          Save
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
