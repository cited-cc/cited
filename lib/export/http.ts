import { NextResponse } from "next/server";

import { AuthError } from "@/lib/auth/errors";
import { ExportError } from "@/lib/export/errors";
import {
  exportCitationEventsCsv,
  exportCitationEventsJson,
  exportCitationNoteMarkdown,
  exportNotebookMarkdown,
  exportResponseHeaders,
  exportWorkspaceEvidenceJson,
  type ExportOptions,
} from "@/lib/export/service";

function parseOptions(request: Request): ExportOptions {
  const url = new URL(request.url);
  return {
    dateRange: {
      from: url.searchParams.get("from"),
      to: url.searchParams.get("to"),
    },
    includeWorkspaceNotes: url.searchParams.get("includeWorkspaceNotes") !== "0",
    includePrivateNotes: url.searchParams.get("includePrivateNotes") === "1",
    includeResponseExcerpts:
      url.searchParams.get("includeResponseExcerpts") === "1",
  };
}

function handleExportError(error: unknown): NextResponse {
  if (error instanceof AuthError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }
  if (error instanceof ExportError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }
  console.error("Export failed", error);
  return NextResponse.json(
    { error: "Export could not be completed." },
    { status: 500 },
  );
}

export async function handleCsvExport(request: Request) {
  try {
    const result = await exportCitationEventsCsv(parseOptions(request));
    return new NextResponse(result.body, {
      status: 200,
      headers: exportResponseHeaders(result),
    });
  } catch (error) {
    return handleExportError(error);
  }
}

export async function handleJsonEventsExport(request: Request) {
  try {
    const result = await exportCitationEventsJson(parseOptions(request));
    return new NextResponse(result.body, {
      status: 200,
      headers: exportResponseHeaders(result),
    });
  } catch (error) {
    return handleExportError(error);
  }
}

export async function handleNoteMarkdownExport(
  request: Request,
  eventId: string,
) {
  try {
    const options = parseOptions(request);
    const url = new URL(request.url);
    if (!url.searchParams.has("includeResponseExcerpts")) {
      options.includeResponseExcerpts = true;
    }
    const result = await exportCitationNoteMarkdown(eventId, options);
    return new NextResponse(result.body, {
      status: 200,
      headers: exportResponseHeaders(result),
    });
  } catch (error) {
    return handleExportError(error);
  }
}

export async function handleNotebookMarkdownExport(request: Request) {
  try {
    const result = await exportNotebookMarkdown(parseOptions(request));
    return new NextResponse(result.body, {
      status: 200,
      headers: exportResponseHeaders(result),
    });
  } catch (error) {
    return handleExportError(error);
  }
}

export async function handleWorkspaceEvidenceExport(request: Request) {
  try {
    const result = await exportWorkspaceEvidenceJson(parseOptions(request));
    return new NextResponse(result.body, {
      status: 200,
      headers: exportResponseHeaders(result),
    });
  } catch (error) {
    return handleExportError(error);
  }
}
