import { NextResponse } from "next/server";

import { CANONICAL_SITEMAP_PATH } from "@/lib/seo/site";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export function GET(request: Request) {
  return NextResponse.redirect(new URL(CANONICAL_SITEMAP_PATH, request.url), 301);
}
