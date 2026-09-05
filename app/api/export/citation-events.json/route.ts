import { handleJsonEventsExport } from "@/lib/export/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return handleJsonEventsExport(request);
}
