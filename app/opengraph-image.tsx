import { createOgImage, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/seo/og-image";

export const alt = "Cited: Know when AI cites you.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function OpenGraphImage() {
  return createOgImage({
    title: "Know when AI cites you.",
    subtitle: "A citation inbox for AI search.",
  });
}
