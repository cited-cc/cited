"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ExportDialog, type ExportDialogKind } from "@/components/export/export-dialog";
import { DocsLink } from "@/components/guidance/help";

export function ExportSettingsPanel({
  canExport,
  canExportArchive,
}: {
  canExport: boolean;
  canExportArchive: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<ExportDialogKind>("events-csv");

  function openKind(next: ExportDialogKind) {
    setKind(next);
    setOpen(true);
  }

  return (
    <>
      <Card>
        <CardHeader>
          <h2 className="type-title">Export evidence</h2>
        </CardHeader>
        <CardBody className="space-y-4">
          <p className="type-body-sm text-cited-ink-muted">
            Keep records, share with teammates manually, or use evidence in
            internal reports. Exports exclude secrets and raw provider payloads.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => openKind("events-csv")}
            >
              Export events CSV
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => openKind("events-json")}
            >
              Export events JSON
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => openKind("notebook-md")}
            >
              Export notebook
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => openKind("workspace-json")}
            >
              Export workspace evidence
            </Button>
          </div>
          <DocsLink href="/docs/exporting-evidence">Exporting evidence</DocsLink>
        </CardBody>
      </Card>
      <ExportDialog
        open={open}
        onOpenChange={setOpen}
        kind={kind}
        canExport={canExport}
        canExportArchive={canExportArchive}
      />
    </>
  );
}
