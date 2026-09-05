import type { Metadata } from "next";

import {
  SITE_NAME,
  absoluteUrl,
  isIndexableDeployment,
} from "@/lib/seo/site";
import { getDocsArticle, getDocsPath } from "@/lib/content/docs";

export function buildDocsMetadata(slug?: string): Metadata {
  if (!slug) {
    const path = "/docs";
    const title = "Cited Docs: ChatGPT, Claude, Gemini, and Perplexity";
    const description =
      "Learn how Cited monitors selected prompts across ChatGPT, Claude, Gemini, Perplexity, and Google AI, then preserves citation evidence without another vanity dashboard.";
    const canonical = absoluteUrl(path);
    const shouldIndex = isIndexableDeployment();
    const ogImage = absoluteUrl("/opengraph-image");

    return {
      title,
      description,
      alternates: { canonical },
      openGraph: {
        type: "article",
        url: canonical,
        siteName: SITE_NAME,
        title: `${title} · Cited`,
        description,
        images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      },
      twitter: {
        card: "summary_large_image",
        title: `${title} · Cited`,
        description,
        images: [ogImage],
      },
      robots: shouldIndex
        ? { index: true, follow: true }
        : { index: false, follow: false },
    };
  }

  const article = getDocsArticle(slug);
  if (!article) {
    return { title: "Docs", robots: { index: false, follow: false } };
  }

  const path = getDocsPath(slug);
  const canonical = absoluteUrl(path);
  const shouldIndex = isIndexableDeployment();
  const ogImage = absoluteUrl("/opengraph-image");

  return {
    title: article.title,
    description: article.description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
      siteName: SITE_NAME,
      title: `${article.title} · Cited`,
      description: article.description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${article.title} · Cited`,
      description: article.description,
      images: [ogImage],
    },
    robots: shouldIndex
      ? { index: true, follow: true }
      : { index: false, follow: false },
  };
}
