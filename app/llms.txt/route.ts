import { DISCOVERY_TEXT_HEADERS } from "@/lib/seo/discovery-headers";
import { buildLlmsTxtBody } from "@/lib/seo/llms-content";

/**
 * Concise, truthful summary for AI systems.
 * Served at /llms.txt
 */
export async function GET() {
  return new Response(buildLlmsTxtBody(), {
    headers: DISCOVERY_TEXT_HEADERS,
  });
}
