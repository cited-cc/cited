import { DISCOVERY_TEXT_HEADERS } from "@/lib/seo/discovery-headers";
import { buildLlmsFullTxtBody } from "@/lib/seo/llms-content";

/**
 * Longer Markdown export for AI systems.
 * Served at /llms-full.txt
 */
export async function GET() {
  return new Response(buildLlmsFullTxtBody(), {
    headers: {
      ...DISCOVERY_TEXT_HEADERS,
      "X-Robots-Tag": "noindex",
    },
  });
}
