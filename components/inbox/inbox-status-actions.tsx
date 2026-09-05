"use client";

import { useTransition } from "react";
import {
  Archive,
  ArchiveRestore,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  CircleDot,
  Eye,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  archiveEventAction,
  markEventSavedAction,
  markEventSeenAction,
  markEventUnsavedAction,
  reopenEventAction,
  resolveEventAction,
  restoreEventAction,
} from "@/lib/inbox/actions";
import type { InboxMemberState } from "@/lib/inbox/types";
import { cn } from "@/lib/utils";

type InboxStatusActionsProps = {
  eventId: string;
  memberState: InboxMemberState;
  canArchive: boolean;
  canResolve: boolean;
  canSave: boolean;
  onStateChange?: (next: InboxMemberState) => void;
  className?: string;
  compact?: boolean;
};

export function InboxStatusActions({
  eventId,
  memberState,
  canArchive,
  canResolve,
  canSave,
  onStateChange,
  className,
  compact = false,
}: InboxStatusActionsProps) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  function run(
    action: () => Promise<{ ok: true; memberState: InboxMemberState } | { ok: false; error: string }>,
    failureTitle: string,
  ) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        toast({ title: failureTitle, description: result.error, tone: "danger" });
        return;
      }
      onStateChange?.(result.memberState);
    });
  }

  const size = compact ? "xs" : "sm";

  return (
    <div
      className={cn("flex flex-wrap items-center gap-1.5", className)}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {!memberState.seenAt ? (
        <Button
          type="button"
          variant="ghost"
          size={size}
          disabled={pending}
          aria-label="Mark as seen"
          leftIcon={<Eye className="h-3.5 w-3.5" aria-hidden />}
          onClick={() =>
            run(() => markEventSeenAction(eventId), "Could not mark as seen")
          }
        >
          {compact ? null : "Seen"}
        </Button>
      ) : null}

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
    </div>
  );
}
