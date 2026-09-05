import { createSitemapResponse } from "@/lib/seo/sitemap-response";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return createSitemapResponse();
}
