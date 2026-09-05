"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ExportDialog, type ExportDialogKind } from "@/components/export/export-dialog";

export function ExportActions({
  canExport,
  canExportArchive = false,
  eventId,
  variants = ["events-csv", "notebook-md"],
}: {
  canExport: boolean;
  canExportArchive?: boolean;
  eventId?: string;
  variants?: ExportDialogKind[];
}) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<ExportDialogKind>(variants[0] ?? "events-csv");

  if (!canExport && variants.every((v) => v !== "workspace-json")) {
    return null;
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {variants.map((variant) => (
          <Button
            key={variant}
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setKind(variant);
              setOpen(true);
            }}
          >
            {variant === "events-csv"
              ? "Export current view"
              : variant === "note-md"
                ? "Export citation note"
                : variant === "notebook-md"
                  ? "Export notebook"
                  : variant === "workspace-json"
                    ? "Export workspace evidence"
                    : "Export JSON"}
          </Button>
        ))}
      </div>
      <ExportDialog
        open={open}
        onOpenChange={setOpen}
        kind={kind}
        eventId={eventId}
        canExport={canExport}
        canExportArchive={canExportArchive}
      />
    </>
  );
}
