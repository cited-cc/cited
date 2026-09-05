"use client";

import { MoreHorizontal } from "lucide-react";
import { useTransition } from "react";

import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { IconButton } from "@/components/ui/icon-button";
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

type CitationNoteMobileActionsProps = {
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
};

export function CitationNoteMobileActions({
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
}: CitationNoteMobileActionsProps) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

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

  const items = [
    canSave
      ? {
          id: "save",
          label: memberState.savedAt ? "Unsave" : "Save",
          disabled: pending,
          onSelect: () =>
            run(
              () =>
                memberState.savedAt
                  ? markEventUnsavedAction(eventId)
                  : markEventSavedAction(eventId),
              "Could not update saved state",
            ),
        }
      : null,
    canArchive
      ? {
          id: "archive",
          label: memberState.archivedAt ? "Restore" : "Archive",
          disabled: pending,
          onSelect: () =>
            run(
              () =>
                memberState.archivedAt
                  ? restoreEventAction(eventId)
                  : archiveEventAction(eventId),
              "Could not update archive state",
            ),
        }
      : null,
    canResolve
      ? {
          id: "resolve",
          label: memberState.resolvedAt ? "Reopen" : "Resolve",
          disabled: pending,
          onSelect: () =>
            run(
              () =>
                memberState.resolvedAt
                  ? reopenEventAction(eventId)
                  : resolveEventAction(eventId),
              "Could not update resolve state",
            ),
        }
      : null,
    canAnnotate && onAddAnnotation
      ? {
          id: "annotate",
          label: "Add annotation",
          onSelect: onAddAnnotation,
        }
      : null,
    canCreateNote && onCreateNote
      ? {
          id: "notebook",
          label: "Create notebook note",
          onSelect: onCreateNote,
        }
      : null,
    {
      id: "copy",
      label: "Copy link",
      onSelect: () => void copyLink(),
    },
  ].filter(Boolean) as Array<{
    id: string;
    label: string;
    disabled?: boolean;
    onSelect?: () => void;
  }>;

  return (
    <div className={cn(className)}>
      <DropdownMenu
        label="Citation note actions"
        align="end"
        trigger={
          <IconButton
            label="More actions"
            icon={<MoreHorizontal className="h-4 w-4" />}
            size="sm"
          />
        }
        items={items}
      />
    </div>
  );
}
