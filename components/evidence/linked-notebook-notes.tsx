"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { createNotebookEntryAction } from "@/lib/notebook/actions";
import type { LinkedNotebookNoteItem } from "@/lib/evidence/types";
import {
  formatAbsoluteUtc,
  formatRelativeUtc,
} from "@/lib/inbox/serializers";
import { cn } from "@/lib/utils";

type LinkedNotebookNotesProps = {
  eventId: string;
  notes: LinkedNotebookNoteItem[];
  canCreateNote: boolean;
  className?: string;
};

export function LinkedNotebookNotes({
  eventId,
  notes,
  canCreateNote,
  className,
}: LinkedNotebookNotesProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  function createNote() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    startTransition(async () => {
      const result = await createNotebookEntryAction({
        title: trimmedTitle,
        body: body.trim(),
        visibility: "workspace",
        citationEventId: eventId,
      });
      if (!result.ok) {
        toast({
          title: "Could not create note",
          description: result.error,
          tone: "danger",
        });
        return;
      }
      setComposing(false);
      setTitle("");
      setBody("");
      router.push(`/app/notebook/${result.entry.id}`);
    });
  }

  return (
    <section className={cn("space-y-3", className)} aria-label="Linked notes">
      <div className="flex items-center justify-between gap-2">
        <p className="type-micro text-cited-ink-faint">Linked notebook notes</p>
        {canCreateNote && !composing ? (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => setComposing(true)}
          >
            Create note
          </Button>
        ) : null}
      </div>

      {composing ? (
        <div className="rounded-md border border-cited-line bg-cited-surface-raised px-3 py-3">
          <TextInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title"
            aria-label="Note title"
            maxLength={200}
            disabled={pending}
          />
          <Textarea
            className="mt-2"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Optional body"
            aria-label="Note body"
            disabled={pending}
          />
          <div className="mt-3 flex gap-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              loading={pending}
              disabled={!title.trim()}
              onClick={createNote}
            >
              Save note
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => setComposing(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {notes.length === 0 && !composing ? (
        <p className="type-body-sm text-cited-ink-muted">
          No notebook notes are linked to this citation yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {notes.map((note) => (
            <li key={note.id}>
              <Link
                href={`/app/notebook/${note.id}`}
                className="block rounded-md border border-cited-line-subtle bg-cited-surface px-3 py-2.5 transition hover:border-cited-line hover:bg-cited-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cited-accent/50"
              >
                <p className="type-title text-cited-ink-strong">{note.title}</p>
                {note.bodyPreview ? (
                  <p className="mt-1 type-body-sm line-clamp-2 text-cited-ink-muted">
                    {note.bodyPreview}
                  </p>
                ) : null}
                <p className="mt-2 font-mono text-[11px] text-cited-ink-faint">
                  {note.visibility === "private" ? "Private" : "Workspace"}
                  {note.pinned ? " · Pinned" : ""}
                  {" · "}
                  <time
                    dateTime={note.updatedAt}
                    title={formatAbsoluteUtc(note.updatedAt)}
                  >
                    {formatRelativeUtc(note.updatedAt)}
                  </time>
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
