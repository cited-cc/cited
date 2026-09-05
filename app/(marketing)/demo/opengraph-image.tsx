import { createOgImage, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/seo/og-image";

export const alt = "Cited demo: Know when AI cites you.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function DemoOpenGraphImage() {
  return createOgImage({
    title: "Explore the citation inbox.",
    subtitle: "Public demo with fictional evidence. No account required.",
    footerLeft: "cited.cc/demo",
    footerRight: "fictional evidence",
  });
}
