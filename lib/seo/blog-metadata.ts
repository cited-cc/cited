import type { Metadata } from "next";

import {
  getBlogArticle,
  getBlogPath,
  type BlogArticle,
} from "@/lib/content/blog";
import {
  SITE_NAME,
  absoluteUrl,
  isIndexableDeployment,
} from "@/lib/seo/site";

export function buildBlogIndexMetadata(): Metadata {
  const path = "/blog";
  const title =
    "Cited Blog: AI Citation Monitoring, AI Search Evidence, and LLM Visibility";
  const description =
    "Field notes on AI citation monitoring, AI search evidence, LLM visibility, and how to know when your website becomes part of the answer.";
  const canonical = absoluteUrl(path);
  const shouldIndex = isIndexableDeployment();
  const ogImage = absoluteUrl("/opengraph-image");

  return {
    title: { absolute: title },
    description,
    keywords: [
      "AI citation monitoring",
      "AI search evidence",
      "LLM visibility",
      "ChatGPT citations",
      "Cited blog",
    ],
    alternates: {
      canonical,
      types: {
        "application/rss+xml": absoluteUrl("/blog/rss.xml"),
      },
    },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: SITE_NAME,
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    robots: shouldIndex
      ? { index: true, follow: true }
      : { index: false, follow: false },
  };
}

export function buildBlogArticleMetadata(slug: string): Metadata {
  const article = getBlogArticle(slug);
  if (!article) {
    return { title: "Blog", robots: { index: false, follow: false } };
  }

  const path = getBlogPath(slug);
  const canonical = absoluteUrl(path);
  const shouldIndex = isIndexableDeployment() && !article.noindex;
  const ogImage = absoluteUrl(article.ogImage ?? "/opengraph-image");
  const title = article.metaTitle;

  return {
    title,
    description: article.description,
    keywords: article.keywords,
    authors: [{ name: article.author }],
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
      siteName: SITE_NAME,
      title: `${title} · Cited`,
      description: article.description,
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: [article.author],
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
      title: `${title} · Cited`,
      description: article.description,
      images: [ogImage],
    },
    robots: shouldIndex
      ? { index: true, follow: true }
      : { index: false, follow: false },
  };
}

export function getBlogPostingJsonLd(article: BlogArticle) {
  const url = absoluteUrl(article.canonicalPath);
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.description,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: {
      "@type": "Organization",
      name: "Cited",
    },
    publisher: {
      "@type": "Organization",
      name: "Cited",
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/opengraph-image"),
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    image: absoluteUrl(article.ogImage ?? "/opengraph-image"),
    keywords: article.keywords.join(", "),
    articleSection: article.category,
    url,
  };
}
