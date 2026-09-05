"use client";

import { useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  deleteAnnotationAction,
  reopenAnnotationAction,
  resolveAnnotationAction,
} from "@/lib/evidence/actions";
import type { CitationAnnotationItem } from "@/lib/evidence/types";
import {
  formatAbsoluteUtc,
  formatRelativeUtc,
} from "@/lib/inbox/serializers";
import { cn } from "@/lib/utils";

type AnnotationCardProps = {
  annotation: CitationAnnotationItem;
  eventId: string;
  onChanged?: () => void;
  className?: string;
};

export function AnnotationCard({
  annotation,
  eventId,
  onChanged,
  className,
}: AnnotationCardProps) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const resolved = Boolean(annotation.resolvedAt);

  function run(
    action: () => Promise<{ ok: true } | { ok: false; error: string }>,
    failureTitle: string,
  ) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        toast({
          title: failureTitle,
          description: result.error,
          tone: "danger",
        });
        return;
      }
      onChanged?.();
    });
  }

  return (
    <article
      className={cn(
        "rounded-md border border-cited-line-subtle bg-cited-surface px-3 py-3",
        resolved && "opacity-70",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={annotation.visibility === "private" ? "neutral" : "default"}>
          {annotation.visibility === "private" ? "Private" : "Workspace"}
        </Badge>
        {resolved ? <Badge variant="success">Resolved</Badge> : null}
        <time
          dateTime={annotation.createdAt}
          title={formatAbsoluteUtc(annotation.createdAt)}
          className="ml-auto font-mono text-[11px] text-cited-ink-faint"
        >
          {formatRelativeUtc(annotation.createdAt)}
        </time>
      </div>

      {annotation.anchorText ? (
        <p className="mt-2 line-clamp-2 border-l border-cited-citation/40 pl-2 type-body-sm text-cited-ink-subtle">
          {annotation.anchorText}
        </p>
      ) : null}

      <p className="mt-2 type-body-sm whitespace-pre-wrap text-cited-ink">
        {annotation.body}
      </p>

      {(annotation.canResolve || annotation.canDelete) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {annotation.canResolve ? (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              disabled={pending}
              onClick={() =>
                run(
                  () =>
                    resolved
                      ? reopenAnnotationAction({
                          annotationId: annotation.id,
                          eventId,
                        })
                      : resolveAnnotationAction({
                          annotationId: annotation.id,
                          eventId,
                        }),
                  resolved
                    ? "Could not reopen annotation"
                    : "Could not resolve annotation",
                )
              }
            >
              {resolved ? "Reopen" : "Resolve"}
            </Button>
          ) : null}
          {annotation.canDelete ? (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              disabled={pending}
              onClick={() =>
                run(
                  () =>
                    deleteAnnotationAction({
                      annotationId: annotation.id,
                      eventId,
                    }),
                  "Could not delete annotation",
                )
              }
            >
              Delete
            </Button>
          ) : null}
        </div>
      )}
    </article>
  );
}
