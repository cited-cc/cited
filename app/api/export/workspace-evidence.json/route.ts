import { handleWorkspaceEvidenceExport } from "@/lib/export/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return handleWorkspaceEvidenceExport(request);
}
