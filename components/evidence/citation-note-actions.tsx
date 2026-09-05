"use client";

import { useTransition } from "react";
import {
  Archive,
  ArchiveRestore,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  CircleDot,
  Link2,
  StickyNote,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  archiveEventAction,
  markEventSavedAction,
  markEventUnsavedAction,
  reopenEventAction,
  resolveEventAction,
  restoreEventAction,
} from "@/lib/inbox/actions";
import type { InboxMemberState } from "@/lib/inbox/types";
import { cn } from "@/lib/utils";

type CitationNoteActionsProps = {
  eventId: string;
  memberState: InboxMemberState;
  canArchive: boolean;
  canResolve: boolean;
  canSave: boolean;
  canCreateNote: boolean;
  canAnnotate: boolean;
  onStateChange?: (next: InboxMemberState) => void;
  onAddAnnotation?: () => void;
  onCreateNote?: () => void;
  className?: string;
  compact?: boolean;
};

export function CitationNoteActions({
  eventId,
  memberState,
  canArchive,
  canResolve,
  canSave,
  canCreateNote,
  canAnnotate,
  onStateChange,
  onAddAnnotation,
  onCreateNote,
  className,
  compact = false,
}: CitationNoteActionsProps) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const size = compact ? "xs" : "sm";

  function run(
    action: () => Promise<
      | { ok: true; memberState: InboxMemberState }
      | { ok: false; error: string }
    >,
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
      onStateChange?.(result.memberState);
    });
  }

  async function copyLink() {
    try {
      const url = `${window.location.origin}/app/inbox/${eventId}`;
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied", tone: "success" });
    } catch {
      toast({
        title: "Could not copy link",
        description: "Copy the URL from your browser instead.",
        tone: "danger",
      });
    }
  }

  return (
    <div
      className={cn("flex flex-wrap items-center gap-1.5", className)}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {canSave ? (
        <Button
          type="button"
          variant="ghost"
          size={size}
          disabled={pending}
          aria-label={memberState.savedAt ? "Unsave note" : "Save note"}
          leftIcon={
            memberState.savedAt ? (
              <BookmarkCheck className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <Bookmark className="h-3.5 w-3.5" aria-hidden />
            )
          }
          onClick={() =>
            run(
              () =>
                memberState.savedAt
                  ? markEventUnsavedAction(eventId)
                  : markEventSavedAction(eventId),
              "Could not update saved state",
            )
          }
        >
          {compact ? null : memberState.savedAt ? "Saved" : "Save"}
        </Button>
      ) : null}

      {canArchive ? (
        <Button
          type="button"
          variant="ghost"
          size={size}
          disabled={pending}
          aria-label={memberState.archivedAt ? "Restore note" : "Archive note"}
          leftIcon={
            memberState.archivedAt ? (
              <ArchiveRestore className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <Archive className="h-3.5 w-3.5" aria-hidden />
            )
          }
          onClick={() =>
            run(
              () =>
                memberState.archivedAt
                  ? restoreEventAction(eventId)
                  : archiveEventAction(eventId),
              "Could not update archive state",
            )
          }
        >
          {compact ? null : memberState.archivedAt ? "Restore" : "Archive"}
        </Button>
      ) : null}

      {canResolve ? (
        <Button
          type="button"
          variant="ghost"
          size={size}
          disabled={pending}
          aria-label={memberState.resolvedAt ? "Reopen note" : "Resolve note"}
          leftIcon={
            memberState.resolvedAt ? (
              <CircleDot className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
            )
          }
          onClick={() =>
            run(
              () =>
                memberState.resolvedAt
                  ? reopenEventAction(eventId)
                  : resolveEventAction(eventId),
              "Could not update resolve state",
            )
          }
        >
          {compact ? null : memberState.resolvedAt ? "Reopen" : "Resolve"}
        </Button>
      ) : null}

      {canAnnotate && onAddAnnotation ? (
        <Button
          type="button"
          variant="ghost"
          size={size}
          leftIcon={<StickyNote className="h-3.5 w-3.5" aria-hidden />}
          onClick={onAddAnnotation}
        >
          {compact ? null : "Add note"}
        </Button>
      ) : null}

      {canCreateNote && onCreateNote ? (
        <Button
          type="button"
          variant="ghost"
          size={size}
          onClick={onCreateNote}
        >
          {compact ? null : "Notebook"}
        </Button>
      ) : null}

      <Button
        type="button"
        variant="ghost"
        size={size}
        aria-label="Copy link"
        leftIcon={<Link2 className="h-3.5 w-3.5" aria-hidden />}
        onClick={() => void copyLink()}
      >
        {compact ? null : "Copy link"}
      </Button>
    </div>
  );
}
