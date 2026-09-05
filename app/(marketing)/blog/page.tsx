import { BlogCard } from "@/components/blog/blog-card";
import { TrackCta } from "@/components/marketing/track-cta";
import {
  Eyebrow,
  MarketingContainer,
  MarketingSection,
} from "@/components/marketing/marketing-primitives";
import { MarketingPageView } from "@/components/marketing/marketing-page-view";
import { BLOG_INDEX, getAllBlogArticles } from "@/lib/content/blog";
import { BreadcrumbJsonLd } from "@/lib/seo/json-ld";
import { buildBlogIndexMetadata } from "@/lib/seo/blog-metadata";

export const metadata = buildBlogIndexMetadata();

export default function BlogIndexPage() {
  const articles = getAllBlogArticles();

  return (
    <>
      <MarketingPageView event="marketing_blog_viewed" route="/blog" />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
        ]}
      />
      <MarketingSection className="pb-8 sm:pb-12">
        <MarketingContainer width="wide">
          <div className="max-w-3xl border-l-[3px] border-l-cited-citation pl-4 sm:pl-5">
            <Eyebrow>[ {BLOG_INDEX.eyebrow.toUpperCase()} ]</Eyebrow>
            <h1 className="mt-3 type-heading">{BLOG_INDEX.headline}</h1>
            <p className="mt-4 max-w-2xl type-body text-cited-ink-muted">
              {BLOG_INDEX.supporting}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <TrackCta
                href={BLOG_INDEX.primaryCta.href}
                cta="blog_index_scan"
                size="md"
              >
                {BLOG_INDEX.primaryCta.label}
              </TrackCta>
              <TrackCta
                href={BLOG_INDEX.secondaryCta.href}
                cta="blog_index_demo"
                variant="secondary"
                size="md"
              >
                {BLOG_INDEX.secondaryCta.label}
              </TrackCta>
            </div>
          </div>
        </MarketingContainer>
      </MarketingSection>

      <MarketingSection className="pt-0">
        <MarketingContainer width="wide">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {articles.map((article) => (
              <BlogCard key={article.slug} article={article} />
            ))}
          </div>
        </MarketingContainer>
      </MarketingSection>
    </>
  );
}
