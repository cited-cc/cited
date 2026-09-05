import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  BlogArticleBody,
  BlogArticleFooter,
} from "@/components/blog/blog-article-body";
import { BlogArticleShell } from "@/components/blog/blog-layout";
import { MarketingPageView } from "@/components/marketing/marketing-page-view";
import {
  getBlogArticle,
  getBlogPath,
  type BlogSlug,
} from "@/lib/content/blog";
import {
  buildBlogArticleMetadata,
  getBlogPostingJsonLd,
} from "@/lib/seo/blog-metadata";
import { BreadcrumbJsonLd, FaqPageJsonLd } from "@/lib/seo/json-ld";
import type { FaqItem } from "@/lib/content/faq";

function BlogPostingJsonLd({ slug }: { slug: BlogSlug }) {
  const article = getBlogArticle(slug);
  if (!article) return null;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(getBlogPostingJsonLd(article)),
      }}
    />
  );
}

export function createBlogArticlePage(slug: BlogSlug) {
  async function generateMetadata(): Promise<Metadata> {
    return buildBlogArticleMetadata(slug);
  }

  async function Page() {
    const article = getBlogArticle(slug);
    if (!article) notFound();

    return (
      <>
        <MarketingPageView
          event="marketing_blog_viewed"
          route={getBlogPath(slug)}
        />
        <BreadcrumbJsonLd
          items={[
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: article.title, path: getBlogPath(slug) },
          ]}
        />
        <BlogPostingJsonLd slug={slug} />
        <FaqPageJsonLd items={article.faq as FaqItem[]} />
        <BlogArticleShell
          article={article}
          footer={<BlogArticleFooter slug={slug} />}
        >
          <BlogArticleBody slug={slug} />
        </BlogArticleShell>
      </>
    );
  }

  return { generateMetadata, Page };
}
