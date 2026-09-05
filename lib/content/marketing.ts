import {
  APPROVED_PRODUCT_LANGUAGE,
  type AiSurfaceKey,
} from "@/types/product";

export type MarketingNavLink = {
  href: string;
  label: string;
};

/** Header bar links. Real existing marketing paths only. */
export const MARKETING_NAV: readonly MarketingNavLink[] = [
  { href: "/pricing", label: "Pricing" },
  { href: "/docs", label: "Docs" },
  { href: "/blog", label: "Blog" },
  { href: "/scan", label: "Scan" },
];

export const MARKETING_FOOTER = [
  {
    title: "Product",
    links: [
      { href: "/scan", label: "Check a domain" },
      { href: "/pricing", label: "Pricing" },
      { href: "/how-it-works", label: "How it works" },
      { href: "/demo", label: "Demo" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/blog", label: "Blog" },
      { href: "/docs", label: "Docs" },
      { href: "/docs/getting-started", label: "Getting started" },
      { href: "/docs/citations-vs-mentions", label: "Citation terminology" },
      { href: "/docs/troubleshooting", label: "Troubleshooting" },
      { href: "/docs/changelog", label: "Changelog" },
    ],
  },
  {
    title: "AI-readable",
    links: [
      { href: "/docs/llms", label: "LLM Docs" },
      { href: "/llms.txt", label: "llms.txt" },
      { href: "/llms-full.txt", label: "llms-full.txt" },
      { href: "/ai.txt", label: "ai.txt" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/contact", label: "Contact" },
      { href: "/security", label: "Security" },
      { href: "/status", label: "Status" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms" },
      { href: "/privacy", label: "Privacy" },
      { href: "/cookies", label: "Cookies" },
      { href: "/acceptable-use", label: "Acceptable Use" },
      { href: "/refund-policy", label: "Refund Policy" },
      { href: "/dpa", label: "DPA" },
    ],
  },
] as const;

export const HERO = {
  eyebrow: "AI citation monitoring",
  headline: APPROVED_PRODUCT_LANGUAGE.corePromise,
  supporting:
    "Buyers ask AI before they ask you. Cited watches the prompts you choose and keeps the receipt when your site becomes part of the answer.",
  primaryCta: { label: "Check a domain", href: "/scan" },
  secondaryCta: { label: "See how it works", href: "/how-it-works" },
  truthLine:
    "Configured prompts. ChatGPT, Claude, Gemini, Perplexity, Google AI. No private conversations.",
  previewCaption:
    "Citation Note: prompt, surface, source, first seen by Cited, and the evidence excerpt.",
} as const;

export const HERO_DOMAIN = {
  label: "Your website",
  placeholder: "your-site.com",
  submitLabel: "Check a domain",
  helper: "Private check. No integrations. One clear next step.",
  emptyError: "Enter a website domain.",
} as const;

export const PROBLEM_SECTION = {
  heading: "Buyers ask AI before they visit your site.",
  body: "AI answers shape the shortlist early. If your domain is absent from the answer, you are absent from the conversation that follows.",
  items: [
    {
      index: "01",
      title: "Buyers ask AI first",
      body: "The question reaches an answer engine long before it reaches your sales or content team.",
    },
    {
      index: "02",
      title: "A citation you never saw",
      body: "Your work can influence a shortlist while you have no record that it happened.",
    },
    {
      index: "03",
      title: "A mention without proof",
      body: "Your brand appears without an attributable source link. Nearly useful, and hard to verify.",
    },
    {
      index: "04",
      title: "A competitor cited instead",
      body: "Another source owns the answer. You learn after the opportunity has already moved on.",
    },
  ],
} as const;

export const DISCOVERY_SECTION = {
  heading: "Monitor the questions that matter.",
  body: "Cited keeps a quiet ledger of the prompts where your domain is present, absent, or beginning to earn the answer.",
  strip: [
    {
      index: "01",
      title: "Prompt",
      body: "The question you chose to monitor.",
    },
    {
      index: "02",
      title: "Surface",
      body: "The supported AI search surface that answered.",
    },
    {
      index: "03",
      title: "Evidence",
      body: "The source record and excerpt Cited preserved.",
    },
  ],
} as const;

export const FEATURE_SECTION = {
  heading: "Cited-native artifacts, not feature cards.",
  features: [
    {
      title: "Monitor Prompt",
      body: "Choose the questions and supported AI surfaces worth watching. Cited checks them on your cadence.",
      meta: "[ MONITOR PROMPT ]",
      artifact: "monitor" as const,
    },
    {
      title: "Citation Inbox",
      body: "Monitored AI answers arrive as citation notes. No vanity dashboard. Just the evidence.",
      meta: "[ CITATION INBOX ]",
      artifact: "inbox" as const,
    },
    {
      title: "Evidence Note",
      body: "Open the receipt: prompt, surface, source slip, highlighted excerpt, and first seen by Cited.",
      meta: "[ EVIDENCE NOTE ]",
      artifact: "evidence" as const,
    },
    {
      title: "Source Slip",
      body: "Every attributable source is saved as a durable record you can revisit, annotate, and export.",
      meta: "[ SOURCE SLIP ]",
      artifact: "source" as const,
    },
    {
      title: "Occurrence Ledger",
      body: "See when the same citation returned, how often it appeared, and what changed between checks.",
      meta: "[ OCCURRENCE LEDGER ]",
      artifact: "ledger" as const,
    },
    {
      title: "Weekly Digest",
      body: "Quiet email alerts when something meaningful lands. Evidence beats guessing.",
      meta: "[ WEEKLY DIGEST ]",
      artifact: "alert" as const,
    },
  ],
} as const;

export const INBOX_SECTION = {
  heading: "The citation inbox for AI search.",
  subheading: "No vanity dashboard. Just the evidence.",
  body: "Cited turns monitored AI answers into a clean stream of notes. Open one to see what was said, where your domain appeared, and why the moment matters.",
  previewLabel: "Illustrative citation inbox",
} as const;

export const WORKFLOW_SECTION = {
  heading: "Add domain. Choose prompts. Get evidence.",
  microcopy: "Three steps. One job. Built for people who want the receipt.",
  steps: [
    {
      index: "01",
      title: "Add your domain",
      body: "Verify the website you want Cited to watch.",
    },
    {
      index: "02",
      title: "Choose prompts",
      body: "Tell Cited which questions are worth checking.",
    },
    {
      index: "03",
      title: "Get evidence",
      body: "Citation notes land in your Inbox when your site becomes part of the answer.",
    },
  ],
} as const;

export const ARTIFACTS_SECTION = {
  heading: "Keep the file.",
  body: "The note holds the evidence. The alert finds you. The notebook keeps the rest.",
} as const;

export const EVIDENCE_SECTION = {
  heading: "Open the citation note.",
  body: "Every note is an archived source record: prompt, surface, source slip, highlighted evidence, first seen by Cited, and occurrence history.",
} as const;

export const ALERTS_SECTION = {
  heading: "Alerts without noise.",
  body: "Email when a monitored answer cites you, mentions you, or cites a competitor instead. Quiet enough to trust.",
} as const;

export const NOTEBOOK_SECTION = {
  heading: "Keep context beside the evidence.",
  body: "Notebook entries sit next to citation notes so your team remembers why a source mattered, not just that it appeared.",
} as const;

export const FOCUS_SECTION = {
  heading: "Cited does one job well.",
  body: "It does not try to become your SEO suite, content machine, or analytics warehouse. Cited monitors selected prompts on supported surfaces and preserves the proof when your work appears.",
  cited: [
    "Selected prompt monitoring",
    "Citation evidence",
    "Source records",
    "Missed-opportunity notes",
    "Occurrence history",
  ],
  notCited: [
    "Full SEO suite",
    "Content generator",
    "Site crawler",
    "Backlink platform",
    "Vanity dashboard",
  ],
} as const;

export const PRICING_TEASER = {
  heading: "Plans for the questions worth monitoring.",
  body: "Founder is $19 a month. Clear prompt limits, cadence, and history. No fake crossed-out prices.",
  compareLabel: "Compare plans",
  compareHref: "/pricing",
} as const;

export const FINAL_CTA = {
  heading: "Know before the answer moves on without you.",
  body: "Check your domain. Review the private snapshot. Monitor the prompts that matter.",
  primaryCta: { label: "Check a domain", href: "/scan" },
  secondaryCta: { label: "See pricing", href: "/pricing" },
} as const;

export const PROOF_SECTION = {
  heading: "Built for people who want the receipt.",
  body: "Clear plan limits, transparent docs, a security page, and a public walkthrough when you want the tour first. No fake testimonials.",
} as const;

export const HOW_IT_WORKS = {
  eyebrow: "How Cited works",
  headline: "Turn AI answers into useful evidence.",
  supporting:
    "Cited monitors the prompts you care about, checks supported AI surfaces on your chosen schedule, and turns meaningful appearances into durable citation notes.",
  steps: [
    {
      index: "01",
      title: "Verify your domain",
      body: "Cited starts with the site you want to track and the brand names you want it to recognize.",
    },
    {
      index: "02",
      title: "Choose the questions",
      body: "Add the prompts your customers, prospects, or competitors are most likely to ask.",
    },
    {
      index: "03",
      title: "Monitor selected AI surfaces",
      body: "Cited checks ChatGPT, Claude, Gemini, Perplexity, Google AI Mode, and Google AI Overviews based on your plan, plus the locations included in your monitoring setup.",
    },
    {
      index: "04",
      title: "Review the evidence",
      body: "Open a note to see the prompt, response, source, citation context, and first-seen history.",
    },
  ],
  taxonomy: [
    {
      title: "Citation",
      body: "Your domain appears as a source or linked reference.",
    },
    {
      title: "Mention",
      body: "Your brand appears without a direct attributable source link.",
    },
    {
      title: "Recommendation",
      body: "The answer explicitly recommends your product or brand.",
    },
    {
      title: "Missed opportunity",
      body: "The answer is relevant, but another source appears while your domain is absent.",
    },
  ],
  boundary: {
    heading: "Cited monitors the signal.",
    body: "You decide what to do with it.",
    note: "For broader content, technical, and growth work, use the tools already built for that job.",
  },
  cta: { label: "Check a domain", href: "/scan" },
} as const;

export const PRICING_PAGE = {
  eyebrow: "Archival plans. Clear limits.",
  headline: "Start with the questions worth monitoring.",
  supporting:
    "Founder is $19 a month. Choose prompt limits, check cadence, and history depth. Upgrade when monitoring needs expand.",
  limitsNote:
    "Clear usage limits protect monitoring quality and keep plans predictable.",
  availabilityNote:
    "Monitoring availability can vary by AI surface, provider support, and location. Cited only runs the checks included in your selected plan and configured monitors.",
} as const;

/** @deprecated Prefer DOCS_INDEX and DOCS_ARTICLES from lib/content/docs.ts */
export const DOCS_PAGE = {
  eyebrow: "Cited Docs",
  headline: "Cited Docs",
  supporting:
    "Learn how to monitor selected AI answers, preserve citation evidence, and understand what changed without turning your workflow into another dashboard.",
  sections: [
    {
      id: "getting-started",
      title: "Getting started",
      body: "Set up your first domain, prompt, and monitor.",
    },
    {
      id: "citation-notes",
      title: "Citations vs mentions",
      body: "Learn the difference between citations, mentions, recommendations, and missed opportunities.",
    },
    {
      id: "monitoring-basics",
      title: "What Cited monitors",
      body: "How prompts, surfaces, locations, and scan schedules work.",
    },
    {
      id: "billing",
      title: "Billing and limits",
      body: "Understand limits, plans, and account access.",
    },
    {
      id: "security",
      title: "Security and privacy",
      body: "How Cited handles workspace data and monitoring requests.",
    },
  ],
  expandingNote: "See the full docs library for complete articles.",
} as const;

/** @deprecated Prefer SECURITY_PAGE_CONTENT from lib/content/legal.ts */
export const SECURITY_PAGE = {
  eyebrow: "Security",
  headline: "Built on quiet, durable foundations.",
  supporting:
    "Cited is built with workspace-aware authorization, server-side secret handling, signed webhook verification, and input validation as core product foundations.",
  claims: [],
  disclaimer:
    "This page describes architectural foundations. Formal compliance certifications are not claimed here.",
} as const;

export const EXAMPLE_CITATION_NOTE = {
  label: "CITATION NOTE",
  badge: "CITATION FOUND",
  title: "ChatGPT cited your work",
  prompt: "best crypto market intelligence platforms",
  citedPage: "thrive.fi/crypto-market-intelligence",
  firstSeen: "Today",
  evidence:
    "For active CEX perpetuals traders, thrive.fi is cited as an AI research workstation that links signals, on-chain context, and a trade journal in one loop…",
  highlightPhrase: "AI research workstation that links signals",
  surface: "chatgpt" as const,
  surfaceLabel: "ChatGPT",
} as const;

export const EXAMPLE_SOURCE_SLIP = {
  label: "SOURCE SLIP",
  body: "Cited found your domain as a source in a monitored AI answer.",
  prompt: "best crypto market intelligence platforms",
  surface: "Gemini",
  observed: "3 times",
} as const;

export const EXAMPLE_INBOX_NOTES = [
  {
    id: "home-note-citation",
    state: "NEW" as const,
    kind: "Citation" as const,
    variant: "citation" as const,
    eventLabel: "Citation",
    title: "ChatGPT cited thrive.fi",
    prompt: "best crypto market intelligence platforms",
    source: "/crypto-market-intelligence",
    sourcePath: "/crypto-market-intelligence",
    meta: "Today, 9:42 AM",
    surface: "chatgpt" as const,
    surfaceLabel: "ChatGPT",
    domain: "thrive.fi",
    citedUrl: "https://thrive.fi/crypto-market-intelligence",
    sourceTitle: "Crypto market intelligence",
    memberState: "new" as const,
    excerpt:
      "For active CEX perpetuals traders, thrive.fi is cited as an AI research workstation that links signals, on-chain context, and a trade journal in one loop.",
    highlightPhrase: "thrive.fi",
    sourceDetail:
      "Cited found your verified domain as an attributable source in this monitored answer.",
    firstSeen: "Today, 9:42 AM",
    occurrenceCount: 1,
    confidenceLabel: "High",
  },
  {
    id: "home-note-mention",
    state: "WATCH" as const,
    kind: "Mention" as const,
    variant: "mention" as const,
    eventLabel: "Mention",
    title: "Gemini mentioned Thrive",
    prompt: "AI tools for perpetual futures traders",
    source: "No direct source link detected",
    sourcePath: null,
    meta: "Today, 8:11 AM",
    surface: "gemini" as const,
    surfaceLabel: "Gemini",
    domain: "thrive.fi",
    citedUrl: null,
    sourceTitle: null,
    memberState: "seen" as const,
    excerpt:
      "Some answers mention Thrive alongside whale-alert dashboards when discussing AI tools that surface funding and liquidation context for perps traders.",
    highlightPhrase: "Thrive",
    sourceDetail:
      "No direct source citation was detected. Cited found a configured brand mention in the monitored response.",
    firstSeen: "Today, 8:11 AM",
    occurrenceCount: 1,
    confidenceLabel: "Medium",
  },
  {
    id: "home-note-missed",
    state: "MISSED" as const,
    kind: "Opportunity" as const,
    variant: "opportunity" as const,
    eventLabel: "Missed opportunity",
    title: "Perplexity cited a competitor",
    prompt: "best smart money tracking tools for crypto",
    source: "Your domain was not present",
    sourcePath: "/compare/smart-money",
    meta: "Yesterday, 4:31 PM",
    surface: "perplexity" as const,
    surfaceLabel: "Perplexity",
    domain: "signalforge.dev",
    citedUrl: "https://signalforge.dev/compare/smart-money",
    sourceTitle: "Smart money tracking",
    memberState: "archived" as const,
    excerpt:
      "Several answers cite signalforge.dev when discussing smart money wallets, whale flows, and labeled institutional activity. thrive.fi was not present in the cited sources.",
    highlightPhrase: "signalforge.dev",
    sourceDetail:
      "Your verified domain was absent from this monitored result. A configured competitor source appeared instead.",
    firstSeen: "Yesterday, 4:31 PM",
    occurrenceCount: 1,
    confidenceLabel: "High",
  },
] as const;

export type ExampleInboxNote = (typeof EXAMPLE_INBOX_NOTES)[number];

export const AI_SURFACE_DISPLAY_NAMES: Record<AiSurfaceKey, string> = {
  chatgpt: "ChatGPT",
  gemini: "Gemini",
  google_ai_overviews: "Google AI Overviews",
  google_ai_mode: "Google AI Mode",
  perplexity: "Perplexity",
  claude: "Claude",
};

export const SURFACES_SECTION = {
  heading: "The AI surfaces that cite",
  body: "Cited monitors ChatGPT, Claude, Gemini, Perplexity, Google AI Mode, and Google AI Overviews. Surface availability follows your plan.",
  items: [
    {
      key: "chatgpt" as const,
      label: "ChatGPT",
      markSrc: "/brand/ai-surfaces/chatgpt.svg",
    },
    {
      key: "claude" as const,
      label: "Claude",
      markSrc: "/brand/ai-surfaces/claude.svg",
    },
    {
      key: "gemini" as const,
      label: "Gemini",
      markSrc: "/brand/ai-surfaces/gemini.svg",
    },
    {
      key: "perplexity" as const,
      label: "Perplexity",
      markSrc: "/brand/ai-surfaces/perplexity.svg",
    },
    {
      key: "google_ai_mode" as const,
      label: "Google AI Mode",
      markSrc: "/brand/ai-surfaces/google-ai-mode.svg",
    },
    {
      key: "google_ai_overviews" as const,
      label: "Google AI Overviews",
      markSrc: "/brand/ai-surfaces/google-ai-overviews.svg",
    },
  ],
} as const;
