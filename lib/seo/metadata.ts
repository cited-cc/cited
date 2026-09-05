import type { Metadata } from "next";

import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  absoluteUrl,
  isIndexableDeployment,
} from "@/lib/seo/site";

export type PageSeoConfig = {
  title: string;
  description: string;
  path: string;
  /** When true, force noindex regardless of deployment. */
  noIndex?: boolean;
  ogImagePath?: string;
};

const PAGE_SEO = {
  home: {
    title: `${SITE_NAME}: ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    path: "/",
  },
  launch: {
    title: "Launch",
    description:
      "Know when AI cites you. Cited monitors the prompts you choose across ChatGPT, Gemini, Perplexity, Claude, and Google AI and saves the evidence when your website becomes part of the answer.",
    path: "/launch",
    noIndex: true,
  },
  launchScreenshots: {
    title: "Screenshot frames",
    description: "Internal capture frames for Cited product screenshots.",
    path: "/launch/screenshots",
    noIndex: true,
  },
  demo: {
    title: "Interactive Demo",
    description:
      "Explore a fictional Cited workspace. See the citation inbox, evidence notes, and alerts without creating an account.",
    path: "/demo",
  },
  pricing: {
    title: "AI Citation Monitoring Pricing ($19–$199)",
    description:
      "Cited plans for AI citation monitoring: Founder $19, Growth $29, Pro $49, and Portfolio $199. Prompt limits, cadence, and AI surfaces by plan. Cancel anytime.",
    path: "/pricing",
  },
  scan: {
    title: "Free AI Citation Check",
    description:
      "Tell Cited which domain you want to check. Prepare a focused citation snapshot across supported AI surfaces and see the evidence behind any matches.",
    path: "/scan",
  },
  scanPreview: {
    title: "Citation Scan Preview",
    description:
      "An illustrative citation snapshot showing how Cited records prompts, sources, and evidence. Not a live scan.",
    path: "/scan/preview",
    noIndex: true,
  },
  howItWorks: {
    title: "How Cited Monitors ChatGPT, Claude, Gemini, and Perplexity",
    description:
      "Cited monitors the prompts you care about, checks ChatGPT, Claude, Gemini, Perplexity, and Google AI on your schedule, and turns meaningful appearances into durable citation notes.",
    path: "/how-it-works",
  },
  docs: {
    title: "Cited Docs: ChatGPT, Claude, Gemini, and Perplexity",
    description:
      "Learn how Cited monitors selected prompts across ChatGPT, Claude, Gemini, Perplexity, and Google AI, then preserves citation evidence without another vanity dashboard.",
    path: "/docs",
  },
  status: {
    title: "Status",
    description:
      "Cited status guidance. If you are experiencing issues, contact support or review troubleshooting docs.",
    path: "/status",
    noIndex: true,
  },
  security: {
    title: "Security",
    description:
      "Cited is built with workspace-aware authorization, server-side secret handling, signed webhook verification, and input validation as core product foundations.",
    path: "/security",
  },
  privacy: {
    title: "Privacy",
    description:
      "How Cited handles personal information, workspace data, monitoring evidence, and retention.",
    path: "/privacy",
  },
  terms: {
    title: "Terms",
    description:
      "Terms of service for using Cited, the AI citation monitoring product.",
    path: "/terms",
  },
  cookies: {
    title: "Cookie Policy",
    description:
      "How Cited and its providers use cookies and similar technologies for authentication, billing, and analytics.",
    path: "/cookies",
  },
  acceptableUse: {
    title: "Acceptable Use",
    description:
      "Prohibited uses of Cited and enforcement options for abuse or misuse.",
    path: "/acceptable-use",
  },
  refundPolicy: {
    title: "Refund Policy",
    description:
      "How Cited handles monthly subscriptions, cancellations, and refund requests.",
    path: "/refund-policy",
  },
  subprocessors: {
    title: "Subprocessors",
    description:
      "Service providers Cited uses to operate authentication, hosting, billing, email, and monitoring.",
    path: "/subprocessors",
    noIndex: true,
  },
  dpa: {
    title: "Data Processing Addendum",
    description:
      "How eligible customers can request a Data Processing Addendum from Cited.",
    path: "/dpa",
  },
  contact: {
    title: "Contact",
    description:
      "Reach Cited for support, billing, security, privacy, and plan questions.",
    path: "/contact",
  },
  scanResult: {
    title: "Citation Scan Result",
    description: "Private citation scan result.",
    path: "/scan/result",
    noIndex: true,
  },
} as const satisfies Record<string, PageSeoConfig>;

export type SeoPageKey = keyof typeof PAGE_SEO;

export function getPageSeo(key: SeoPageKey): PageSeoConfig {
  return PAGE_SEO[key];
}

/**
 * Build Next.js Metadata for a marketing page.
 * Titles use the root layout template ("%s · Cited") except the homepage,
 * which sets an absolute title matching the Phase 3 pattern.
 */
export function buildPageMetadata(key: SeoPageKey): Metadata {
  const page: PageSeoConfig = PAGE_SEO[key];
  const canonical = absoluteUrl(page.path);
  const shouldIndex = isIndexableDeployment() && !page.noIndex;
  const ogImage = absoluteUrl(page.ogImagePath ?? "/opengraph-image");

  const isHome = key === "home";

  return {
    title: isHome
      ? { absolute: `Cited: Know when AI cites you` }
      : page.title,
    description: page.description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: SITE_NAME,
      title: isHome ? `Cited: Know when AI cites you` : `${page.title} · Cited`,
      description: page.description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: "Cited: Know when AI cites you.",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: isHome ? `Cited: Know when AI cites you` : `${page.title} · Cited`,
      description: page.description,
      images: [ogImage],
    },
    robots: shouldIndex
      ? { index: true, follow: true }
      : { index: false, follow: false },
  };
}

export { PAGE_SEO };
