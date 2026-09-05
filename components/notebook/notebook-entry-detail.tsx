"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { NotebookEntryActions } from "@/components/notebook/notebook-entry-actions";
import { NotebookEntryEditor } from "@/components/notebook/notebook-entry-editor";
import { NotebookEntryRevisionHistory } from "@/components/notebook/notebook-entry-revision-history";
import { NotebookVisibilityControl } from "@/components/notebook/notebook-visibility-control";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { NotebookEntryDetail } from "@/lib/notebook/types";
import {
  formatAbsoluteUtc,
  formatRelativeUtc,
} from "@/lib/inbox/serializers";
import { cn } from "@/lib/utils";

type NotebookEntryDetailViewProps = {
  detail: NotebookEntryDetail;
  className?: string;
};

export function NotebookEntryDetailView({
  detail,
  className,
}: NotebookEntryDetailViewProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const { entry, linkedEvent, permissions, revisions } = detail;

  return (
    <article className={cn("mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8", className)}>
      <div className="mb-6">
        <Button href="/app/notebook" variant="ghost" size="sm">
          Back to Notebook
        </Button>
      </div>

      <header className="border-b border-cited-line-subtle pb-5">
        <div className="flex flex-wrap items-center gap-2">
          <NotebookVisibilityControl
            entryId={entry.id}
            visibility={entry.visibility}
            canChange={permissions.canChangeVisibility}
            onChanged={() => router.refresh()}
          />
          {entry.pinned ? <Badge variant="success">Pinned</Badge> : null}
          {entry.archivedAt ? <Badge variant="default">Archived</Badge> : null}
          {linkedEvent ? <Badge variant="citation">Linked</Badge> : null}
        </div>

        {editing ? (
          <div className="mt-4">
            <NotebookEntryEditor
              mode="edit"
              entryId={entry.id}
              initialTitle={entry.title}
              initialBody={entry.body}
              onCancel={() => setEditing(false)}
              onSaved={() => {
                setEditing(false);
                router.refresh();
              }}
            />
          </div>
        ) : (
          <>
            <h1 className="mt-3 type-heading text-cited-ink-strong">
              {entry.title}
            </h1>
            <p className="mt-2 font-mono text-[11px] text-cited-ink-faint">
              Updated{" "}
              <time
                dateTime={entry.updatedAt}
                title={formatAbsoluteUtc(entry.updatedAt)}
              >
                {formatRelativeUtc(entry.updatedAt)}
              </time>
              {detail.revisionCount > 1
                ? ` · ${detail.revisionCount} revisions`
                : null}
            </p>
          </>
        )}

        {!editing ? (
          <div className="mt-4">
            <NotebookEntryActions
              detail={detail}
              onEdit={() => setEditing(true)}
              onOpenHistory={() => setHistoryOpen(true)}
              onChanged={() => router.refresh()}
            />
          </div>
        ) : null}
      </header>

      {!editing ? (
        <div className="mt-6">
          <p className="type-body whitespace-pre-wrap text-cited-ink">
            {entry.body || "This note has no body yet."}
          </p>
        </div>
      ) : null}

      {linkedEvent ? (
        <section className="mt-8 rounded-md border border-cited-line-subtle bg-cited-surface px-3 py-3">
          <p className="type-micro text-cited-ink-faint">Linked citation note</p>
          <Link
            href={`/app/inbox/${linkedEvent.id}`}
            className="mt-2 block type-title text-cited-ink-strong transition hover:text-cited-citation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cited-accent/50"
          >
            {linkedEvent.summaryTitle}
          </Link>
          {linkedEvent.promptText ? (
            <p className="mt-1 type-body-sm line-clamp-2 text-cited-ink-muted">
              {linkedEvent.promptText}
            </p>
          ) : null}
        </section>
      ) : null}

      <NotebookEntryRevisionHistory
        entryId={entry.id}
        revisions={revisions}
        canRestore={permissions.canRestoreRevision}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
      />
    </article>
  );
}

export { NotebookEntryDetailView as NotebookEntryDetail };
