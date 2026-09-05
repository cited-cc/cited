import { ORGANIZATION } from "@/lib/seo/site";

/**
 * Security contact file (RFC 9116).
 * Served at /.well-known/security.txt
 */
export async function GET() {
  const body = [
    "Contact: mailto:hello@cited.cc",
    `Canonical: ${ORGANIZATION.url}/.well-known/security.txt`,
    "Preferred-Languages: en",
    "Policy: https://cited.cc/security",
  ].join("\n");

  return new Response(`${body}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
