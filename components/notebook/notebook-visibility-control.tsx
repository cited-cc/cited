"use client";

import { useTransition } from "react";

import { SegmentedControl } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { changeNotebookEntryVisibilityAction } from "@/lib/notebook/actions";
import type { NotebookVisibility } from "@/types/product";
import { cn } from "@/lib/utils";

type NotebookVisibilityControlProps = {
  entryId: string;
  visibility: NotebookVisibility;
  canChange: boolean;
  onChanged?: (visibility: NotebookVisibility) => void;
  className?: string;
};

export function NotebookVisibilityControl({
  entryId,
  visibility,
  canChange,
  onChanged,
  className,
}: NotebookVisibilityControlProps) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  if (!canChange) {
    return (
      <span
        className={cn(
          "font-mono text-[11px] tracking-[0.06em] uppercase text-cited-ink-subtle",
          className,
        )}
      >
        {visibility === "private" ? "Private" : "Workspace"}
      </span>
    );
  }

  return (
    <SegmentedControl
      className={className}
      label="Note visibility"
      value={visibility}
      onChange={(next) => {
        const visibilityNext = next as NotebookVisibility;
        if (visibilityNext === visibility || pending) return;
        startTransition(async () => {
          const result = await changeNotebookEntryVisibilityAction({
            entryId,
            visibility: visibilityNext,
          });
          if (!result.ok) {
            toast({
              title: "Could not change visibility",
              description: result.error,
              tone: "danger",
            });
            return;
          }
          onChanged?.(visibilityNext);
        });
      }}
      options={[
        { value: "workspace", label: "Workspace" },
        { value: "private", label: "Private" },
      ]}
    />
  );
}
