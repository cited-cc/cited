import { handleNoteMarkdownExport } from "@/lib/export/http";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ eventId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { eventId } = await context.params;
  const cleaned = eventId.replace(/\.md$/i, "");
  return handleNoteMarkdownExport(request, cleaned);
}
