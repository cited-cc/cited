"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import {
  bulkArchiveAction,
  bulkMarkSeenAction,
} from "@/lib/inbox/actions";
import { INBOX_BULK_SELECTION_CAP } from "@/lib/inbox/types";
import { cn } from "@/lib/utils";

type InboxBulkActionsProps = {
  selectedIds: string[];
  canArchive: boolean;
  onClear: () => void;
  className?: string;
};

export function InboxBulkActions({
  selectedIds,
  canArchive,
  onClear,
  className,
}: InboxBulkActionsProps) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [confirmArchive, setConfirmArchive] = useState(false);

  if (selectedIds.length === 0) return null;

  const capped = selectedIds.length > INBOX_BULK_SELECTION_CAP;

  function runMarkSeen() {
    startTransition(async () => {
      const result = await bulkMarkSeenAction(selectedIds);
      if (!result.ok) {
        toast({
          title: "Bulk update failed",
          description: result.error,
          tone: "danger",
        });
        return;
      }
      toast({
        title: "Marked as seen",
        description: `${result.updated} note${result.updated === 1 ? "" : "s"} updated.`,
        tone: "success",
      });
      onClear();
    });
  }

  function runArchive() {
    startTransition(async () => {
      const result = await bulkArchiveAction(selectedIds);
      setConfirmArchive(false);
      if (!result.ok) {
        toast({
          title: "Bulk archive failed",
          description: result.error,
          tone: "danger",
        });
        return;
      }
      toast({
        title: "Archived",
        description: `${result.updated} note${result.updated === 1 ? "" : "s"} archived.`,
        tone: "success",
      });
      onClear();
    });
  }

  return (
    <>
      <div
        className={cn(
          "sticky bottom-3 z-20 mx-auto flex w-fit max-w-full flex-wrap items-center gap-2 rounded-md border border-cited-line bg-cited-surface-raised px-3 py-2 cited-overlay-shadow",
          className,
        )}
        role="region"
        aria-label="Bulk actions"
      >
        <p className="font-mono text-[11px] tracking-[0.06em] text-cited-ink-muted">
          {selectedIds.length} selected
          {capped ? ` (max ${INBOX_BULK_SELECTION_CAP})` : ""}
        </p>
        <Button
          type="button"
          variant="subtle"
          size="xs"
          disabled={pending}
          onClick={runMarkSeen}
        >
          Mark seen
        </Button>
        {canArchive ? (
          <Button
            type="button"
            variant="subtle"
            size="xs"
            disabled={pending}
            onClick={() => setConfirmArchive(true)}
          >
            Archive
          </Button>
        ) : null}
        <Button type="button" variant="ghost" size="xs" onClick={onClear}>
          Clear
        </Button>
      </div>

      <Dialog
        open={confirmArchive}
        onOpenChange={setConfirmArchive}
        title="Archive selected notes?"
        description="Archiving removes notes from your active Inbox. Evidence is preserved and can be restored later."
        footer={
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfirmArchive(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              loading={pending}
              onClick={runArchive}
            >
              Archive
            </Button>
          </div>
        }
      >
        <p className="type-body-sm text-cited-ink-muted">
          {Math.min(selectedIds.length, INBOX_BULK_SELECTION_CAP)} note
          {selectedIds.length === 1 ? "" : "s"} will be archived for you only.
        </p>
      </Dialog>
    </>
  );
}
