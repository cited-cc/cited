"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import {
  createNotebookEntryAction,
  updateNotebookEntryAction,
} from "@/lib/notebook/actions";
import {
  NOTEBOOK_BODY_MAX_LENGTH,
  NOTEBOOK_TITLE_MAX_LENGTH,
} from "@/lib/notebook/types";
import type { NotebookVisibility } from "@/types/product";
import { cn } from "@/lib/utils";

type NotebookEntryEditorProps = {
  mode: "create" | "edit";
  entryId?: string;
  initialTitle?: string;
  initialBody?: string;
  visibility?: NotebookVisibility;
  citationEventId?: string | null;
  onCancel: () => void;
  onSaved: (entryId: string) => void;
  className?: string;
};

export function NotebookEntryEditor({
  mode,
  entryId,
  initialTitle = "",
  initialBody = "",
  visibility = "workspace",
  citationEventId = null,
  onCancel,
  onSaved,
  className,
}: NotebookEntryEditorProps) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState({
    baselineTitle: initialTitle,
    baselineBody: initialBody,
    title: initialTitle,
    body: initialBody,
  });

  const title =
    draft.baselineTitle === initialTitle ? draft.title : initialTitle;
  const body = draft.baselineBody === initialBody ? draft.body : initialBody;

  function setTitle(next: string) {
    setDraft((prev) => ({
      ...prev,
      baselineTitle: initialTitle,
      baselineBody: initialBody,
      title: next,
      body: prev.baselineBody === initialBody ? prev.body : initialBody,
    }));
  }

  function setBody(next: string) {
    setDraft((prev) => ({
      ...prev,
      baselineTitle: initialTitle,
      baselineBody: initialBody,
      title: prev.baselineTitle === initialTitle ? prev.title : initialTitle,
      body: next,
    }));
  }

  function save() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    startTransition(async () => {
      if (mode === "create") {
        const result = await createNotebookEntryAction({
          title: trimmedTitle,
          body: body.trim(),
          visibility,
          citationEventId,
        });
        if (!result.ok) {
          toast({
            title: "Could not create note",
            description: result.error,
            tone: "danger",
          });
          return;
        }
        onSaved(result.entry.id);
        return;
      }

      if (!entryId) return;
      const result = await updateNotebookEntryAction({
        entryId,
        title: trimmedTitle,
        body: body.trim(),
      });
      if (!result.ok) {
        toast({
          title: "Could not save note",
          description: result.error,
          tone: "danger",
        });
        return;
      }
      onSaved(result.entry.id);
    });
  }

  return (
    <div
      className={cn(
        "rounded-md border border-cited-line bg-cited-surface-raised px-4 py-4",
        className,
      )}
    >
      <TextInput
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        aria-label="Note title"
        maxLength={NOTEBOOK_TITLE_MAX_LENGTH}
        disabled={pending}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            save();
          }
        }}
      />
      <Textarea
        className="mt-3 min-h-40"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write the evidence note in plain text."
        aria-label="Note body"
        maxLength={NOTEBOOK_BODY_MAX_LENGTH}
        disabled={pending}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            save();
          }
        }}
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="primary"
          size="sm"
          loading={pending}
          disabled={!title.trim()}
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
        <span className="ml-auto type-meta text-cited-ink-faint">
          Cmd+Enter to save
        </span>
      </div>
    </div>
  );
}
