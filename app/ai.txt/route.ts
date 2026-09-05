import { DISCOVERY_TEXT_HEADERS } from "@/lib/seo/discovery-headers";
import { buildAiTxtBody } from "@/lib/seo/llms-content";

/**
 * AI agent discovery alias for llms.txt.
 * Served at /ai.txt
 */
export async function GET() {
  return new Response(buildAiTxtBody(), {
    headers: DISCOVERY_TEXT_HEADERS,
  });
}
