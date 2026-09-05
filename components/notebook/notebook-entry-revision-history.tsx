"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { restoreNotebookRevisionAction } from "@/lib/notebook/actions";
import type { NotebookEntryRevisionItem } from "@/lib/notebook/types";
import {
  formatAbsoluteUtc,
  formatRelativeUtc,
} from "@/lib/inbox/serializers";

type NotebookEntryRevisionHistoryProps = {
  entryId: string;
  revisions: NotebookEntryRevisionItem[];
  canRestore: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
};

export function NotebookEntryRevisionHistory({
  entryId,
  revisions,
  canRestore,
  open,
  onOpenChange,
}: NotebookEntryRevisionHistoryProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [confirmId, setConfirmId] = useState<string | null>(null);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Revision history"
      description="Earlier versions of this note. Restoring creates a new revision."
    >
      {revisions.length === 0 ? (
        <p className="type-body-sm text-cited-ink-muted">
          No prior revisions yet.
        </p>
      ) : (
        <ul className="max-h-[50vh] space-y-3 overflow-y-auto">
          {revisions.map((revision) => (
            <li
              key={revision.id}
              className="rounded-md border border-cited-line-subtle bg-cited-surface px-3 py-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-[11px] text-cited-ink">
                  v{revision.revisionNumber}
                </span>
                <time
                  dateTime={revision.createdAt}
                  title={formatAbsoluteUtc(revision.createdAt)}
                  className="font-mono text-[11px] text-cited-ink-faint"
                >
                  {formatRelativeUtc(revision.createdAt)}
                </time>
              </div>
              <p className="mt-2 type-title text-cited-ink-strong">
                {revision.titleSnapshot}
              </p>
              <p className="mt-1 type-body-sm line-clamp-3 whitespace-pre-wrap text-cited-ink-muted">
                {revision.bodySnapshot || "Empty body"}
              </p>
              {canRestore ? (
                <div className="mt-3">
                  {confirmId === revision.id ? (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="primary"
                        size="xs"
                        loading={pending}
                        onClick={() => {
                          startTransition(async () => {
                            const result = await restoreNotebookRevisionAction({
                              entryId,
                              revisionId: revision.id,
                            });
                            if (!result.ok) {
                              toast({
                                title: "Could not restore version",
                                description: result.error,
                                tone: "danger",
                              });
                              return;
                            }
                            setConfirmId(null);
                            onOpenChange(false);
                            router.refresh();
                          });
                        }}
                      >
                        Confirm restore
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        disabled={pending}
                        onClick={() => setConfirmId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => setConfirmId(revision.id)}
                    >
                      Restore
                    </Button>
                  )}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Dialog>
  );
}
