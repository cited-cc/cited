"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FieldLabel, FormField } from "@/components/ui/field";
import { TextInput } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

export type ExportDialogKind =
  | "events-csv"
  | "events-json"
  | "note-md"
  | "notebook-md"
  | "workspace-json";

type ExportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: ExportDialogKind;
  eventId?: string;
  canExport: boolean;
  canExportArchive?: boolean;
};

function buildHref(
  kind: ExportDialogKind,
  options: {
    eventId?: string;
    from: string;
    to: string;
    includeWorkspaceNotes: boolean;
    includePrivateNotes: boolean;
    includeResponseExcerpts: boolean;
  },
): string {
  const params = new URLSearchParams();
  if (options.from) params.set("from", options.from);
  if (options.to) params.set("to", options.to);
  params.set(
    "includeWorkspaceNotes",
    options.includeWorkspaceNotes ? "1" : "0",
  );
  params.set("includePrivateNotes", options.includePrivateNotes ? "1" : "0");
  params.set(
    "includeResponseExcerpts",
    options.includeResponseExcerpts ? "1" : "0",
  );
  const query = params.toString();

  switch (kind) {
    case "events-csv":
      return `/api/export/citation-events.csv?${query}`;
    case "events-json":
      return `/api/export/citation-events.json?${query}`;
    case "note-md":
      return `/api/export/citation-note/${options.eventId}?${query}`;
    case "notebook-md":
      return `/api/export/notebook.md?${query}`;
    case "workspace-json":
      return `/api/export/workspace-evidence.json?${query}`;
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

const TITLES: Record<ExportDialogKind, string> = {
  "events-csv": "Export citation events (CSV)",
  "events-json": "Export citation events (JSON)",
  "note-md": "Export citation note",
  "notebook-md": "Export notebook",
  "workspace-json": "Export workspace evidence",
};

export function ExportDialog({
  open,
  onOpenChange,
  kind,
  eventId,
  canExport,
  canExportArchive = false,
}: ExportDialogProps) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [includeWorkspaceNotes, setIncludeWorkspaceNotes] = useState(true);
  const [includePrivateNotes, setIncludePrivateNotes] = useState(false);
  const [includeResponseExcerpts, setIncludeResponseExcerpts] = useState(
    kind === "note-md",
  );

  const archiveBlocked = kind === "workspace-json" && !canExportArchive;
  const blocked = !canExport || archiveBlocked;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={TITLES[kind]}
      description="Exports are workspace-scoped and exclude secrets and raw provider payloads."
      footer={
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          {blocked ? (
            <Button variant="secondary" size="sm" disabled>
              Export unavailable
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              href={buildHref(kind, {
                eventId,
                from,
                to,
                includeWorkspaceNotes,
                includePrivateNotes,
                includeResponseExcerpts,
              })}
            >
              Download
            </Button>
          )}
        </>
      }
    >
      {blocked ? (
        <p className="type-body-sm text-cited-ink-muted">
          {archiveBlocked
            ? "Workspace evidence export requires an owner or admin."
            : "Your role can view evidence but cannot export it."}
        </p>
      ) : (
        <div className="space-y-4">
          {kind === "events-csv" ||
          kind === "events-json" ||
          kind === "workspace-json" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField>
                <FieldLabel htmlFor="export-from">From (ISO date)</FieldLabel>
                <TextInput
                  id="export-from"
                  value={from}
                  onChange={(event) => setFrom(event.target.value)}
                  placeholder="2026-01-01"
                />
              </FormField>
              <FormField>
                <FieldLabel htmlFor="export-to">To (ISO date)</FieldLabel>
                <TextInput
                  id="export-to"
                  value={to}
                  onChange={(event) => setTo(event.target.value)}
                  placeholder="2026-12-31"
                />
              </FormField>
            </div>
          ) : null}

          {kind !== "events-csv" ? (
            <div className="space-y-2">
              <Checkbox
                id="export-workspace-notes"
                checked={includeWorkspaceNotes}
                onChange={(event) =>
                  setIncludeWorkspaceNotes(event.target.checked)
                }
                label="Include workspace notes"
              />
              <Checkbox
                id="export-private-notes"
                checked={includePrivateNotes}
                onChange={(event) =>
                  setIncludePrivateNotes(event.target.checked)
                }
                label="Include my private notes"
              />
              {kind === "note-md" || kind === "workspace-json" ? (
                <Checkbox
                  id="export-response-excerpts"
                  checked={includeResponseExcerpts}
                  onChange={(event) =>
                    setIncludeResponseExcerpts(event.target.checked)
                  }
                  label="Include response excerpts"
                />
              ) : null}
            </div>
          ) : (
            <p className="type-body-sm text-cited-ink-muted">
              CSV exports exclude full response text by default.
            </p>
          )}
        </div>
      )}
    </Dialog>
  );
}
