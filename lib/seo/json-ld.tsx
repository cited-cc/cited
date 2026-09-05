import type { FaqItem } from "@/lib/content/faq";
import { PUBLIC_PLAN_LIST } from "@/lib/content/plans";
import {
  ORGANIZATION,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  absoluteUrl,
} from "@/lib/seo/site";

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function OrganizationJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name: ORGANIZATION.name,
        legalName: ORGANIZATION.legalName,
        url: absoluteUrl("/"),
        email: ORGANIZATION.email,
        description: ORGANIZATION.description,
        logo: {
          "@type": "ImageObject",
          url: absoluteUrl("/opengraph-image"),
        },
      }}
    />
  );
}

export function WebSiteJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: SITE_NAME,
        url: absoluteUrl("/"),
        description: SITE_DESCRIPTION,
        publisher: {
          "@type": "Organization",
          name: ORGANIZATION.name,
          logo: {
            "@type": "ImageObject",
            url: absoluteUrl("/opengraph-image"),
          },
        },
      }}
    />
  );
}

export function SoftwareApplicationJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: SITE_NAME,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description:
          "Cited is software for monitoring selected AI prompts and recording citation evidence for verified domains. It tracks citations, mentions, recommendations, and missed opportunities across ChatGPT, Gemini, Perplexity, Claude, Google AI Overviews, and Google AI Mode based on your plan.",
        offers: {
          "@type": "Offer",
          price: "19.00",
          priceCurrency: "USD",
          description: "Founder plan starting price",
        },
        url: absoluteUrl("/"),
        slogan: SITE_TAGLINE,
      }}
    />
  );
}

export function FaqPageJsonLd({ items }: { items: FaqItem[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      }}
    />
  );
}

export function BreadcrumbJsonLd({
  items,
}: {
  items: { name: string; path: string }[];
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: absoluteUrl(item.path),
        })),
      }}
    />
  );
}

export function TechArticleJsonLd({
  title,
  description,
  path,
  lastUpdated,
}: {
  title: string;
  description: string;
  path: string;
  lastUpdated: string;
}) {
  const url = absoluteUrl(path);
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "TechArticle",
        headline: title,
        description,
        dateModified: lastUpdated,
        author: {
          "@type": "Organization",
          name: ORGANIZATION.name,
        },
        publisher: {
          "@type": "Organization",
          name: ORGANIZATION.name,
          logo: {
            "@type": "ImageObject",
            url: absoluteUrl("/opengraph-image"),
          },
        },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": url,
        },
        url,
      }}
    />
  );
}

export function OfferCatalogJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "OfferCatalog",
        name: "Cited plans",
        url: absoluteUrl("/pricing"),
        itemListElement: PUBLIC_PLAN_LIST.map((plan, index) => ({
          "@type": "Offer",
          position: index + 1,
          name: plan.name,
          description: plan.tagline,
          url: absoluteUrl("/pricing"),
          price: plan.priceMonthly.toFixed(2),
          priceCurrency: "USD",
        })),
      }}
    />
  );
}

export function HowToJsonLd({
  name,
  description,
  steps,
}: {
  name: string;
  description: string;
  steps: { name: string; text: string }[];
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "HowTo",
        name,
        description,
        step: steps.map((step, index) => ({
          "@type": "HowToStep",
          position: index + 1,
          name: step.name,
          text: step.text,
        })),
      }}
    />
  );
}
