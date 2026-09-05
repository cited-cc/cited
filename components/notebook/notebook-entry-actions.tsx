"use client";

import { useTransition } from "react";
import {
  Archive,
  ArchiveRestore,
  Pin,
  PinOff,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import {
  archiveNotebookEntryAction,
  deleteNotebookEntryAction,
  pinNotebookEntryAction,
  restoreNotebookEntryAction,
  unpinNotebookEntryAction,
} from "@/lib/notebook/actions";
import type { NotebookEntryDetail } from "@/lib/notebook/types";
import { cn } from "@/lib/utils";

type NotebookEntryActionsProps = {
  detail: NotebookEntryDetail;
  onOpenHistory?: () => void;
  onEdit?: () => void;
  onChanged?: () => void;
  className?: string;
};

export function NotebookEntryActions({
  detail,
  onOpenHistory,
  onEdit,
  onChanged,
  className,
}: NotebookEntryActionsProps) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const { entry, permissions } = detail;

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
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {permissions.canEdit && onEdit ? (
        <Button type="button" variant="secondary" size="sm" onClick={onEdit}>
          Edit
        </Button>
      ) : null}

      {permissions.canPin ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending}
          leftIcon={
            entry.pinned ? (
              <PinOff className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <Pin className="h-3.5 w-3.5" aria-hidden />
            )
          }
          onClick={() =>
            run(
              () =>
                entry.pinned
                  ? unpinNotebookEntryAction(entry.id)
                  : pinNotebookEntryAction(entry.id),
              "Could not update pin",
            )
          }
        >
          {entry.pinned ? "Unpin" : "Pin"}
        </Button>
      ) : null}

      {permissions.canArchive ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending}
          leftIcon={
            entry.archivedAt ? (
              <ArchiveRestore className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <Archive className="h-3.5 w-3.5" aria-hidden />
            )
          }
          onClick={() =>
            run(
              () =>
                entry.archivedAt
                  ? restoreNotebookEntryAction(entry.id)
                  : archiveNotebookEntryAction(entry.id),
              "Could not update archive",
            )
          }
        >
          {entry.archivedAt ? "Restore" : "Archive"}
        </Button>
      ) : null}

      {permissions.canRestoreRevision && onOpenHistory ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onOpenHistory}
        >
          History
        </Button>
      ) : null}

      {permissions.canEdit ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending}
          leftIcon={<Trash2 className="h-3.5 w-3.5" aria-hidden />}
          onClick={() =>
            run(
              () => deleteNotebookEntryAction(entry.id),
              "Could not delete note",
            )
          }
        >
          Delete
        </Button>
      ) : null}
    </div>
  );
}
