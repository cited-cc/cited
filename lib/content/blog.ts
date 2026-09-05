/**
 * Blog content registry for Cited editorial articles.
 * Typed TS registry (no MDX), matching the docs content pattern.
 */

export type BlogCategory =
  | "AI Citation Monitoring"
  | "AI Search"
  | "LLM Visibility";

export type BlogTocItem = {
  id: string;
  title: string;
};

export type BlogFaqItem = {
  id: string;
  question: string;
  answer: string;
};

export type BlogArticle = {
  slug: string;
  title: string;
  /** Full browser / OG title when it differs from the H1. */
  metaTitle: string;
  description: string;
  eyebrow: string;
  category: BlogCategory;
  author: string;
  authorRole: string;
  publishedAt: string;
  updatedAt: string;
  readingTime: string;
  canonicalPath: string;
  ogImage?: string;
  keywords: string[];
  noindex?: boolean;
  relatedSlugs: string[];
  tableOfContents: BlogTocItem[];
  faq: BlogFaqItem[];
  /** Plain Markdown export for llms-full.txt (no JSX). */
  markdown: string;
};

export const BLOG_INDEX = {
  title: "Cited Blog",
  metaTitle:
    "Cited Blog: AI Citation Monitoring, AI Search Evidence, and LLM Visibility",
  description:
    "Field notes on AI citation monitoring, AI search evidence, LLM visibility, and how to know when your website becomes part of the answer.",
  eyebrow: "Research archive",
  headline: "AI citation field notes.",
  supporting:
    "Clear, evidence-first writing about how AI search cites websites, how to monitor selected prompts, and why the teams who care about discovery need a receipt.",
  primaryCta: { label: "Check a domain", href: "/scan" },
  secondaryCta: { label: "See demo", href: "/demo" },
} as const;

export const BLOG_AUTHOR = {
  name: "Cited Editorial",
  role: "Cited",
} as const;

const PUBLISHED = "2026-07-09";
const NEW_PUBLISHED = "2026-08-18";

export const BLOG_ARTICLES: Record<string, BlogArticle> = {
  "how-to-know-if-chatgpt-cites-your-website": {
    slug: "how-to-know-if-chatgpt-cites-your-website",
    title: "How to Know If ChatGPT Cites Your Website",
    metaTitle: "How to Know If ChatGPT Cites Your Website",
    description:
      "Learn how to check whether ChatGPT and other AI-search surfaces cite your website, what counts as citation evidence, and how Cited turns monitored answers into a clean citation inbox.",
    eyebrow: "Field manual",
    category: "AI Search",
    author: BLOG_AUTHOR.name,
    authorRole: BLOG_AUTHOR.role,
    publishedAt: PUBLISHED,
    updatedAt: PUBLISHED,
    readingTime: "11 min",
    canonicalPath: "/blog/how-to-know-if-chatgpt-cites-your-website",
    keywords: [
      "how to know if ChatGPT cites your website",
      "does ChatGPT cite my website",
      "track ChatGPT citations",
      "AI citation tracking",
      "AI search citations",
      "ChatGPT website citations",
      "AI citation monitoring",
    ],
    relatedSlugs: [
      "ai-citation-monitoring",
      "llm-visibility-audit",
      "is-my-brand-cited-in-chatgpt",
    ],
    tableOfContents: [
      { id: "short-answer", title: "The short answer" },
      { id: "what-counts", title: "What counts as a ChatGPT citation?" },
      { id: "what-you-cannot-know", title: "What you cannot know" },
      { id: "what-you-can-monitor", title: "What you can monitor" },
      { id: "manual-way", title: "The manual way to check" },
      { id: "manual-breaks", title: "Why manual tracking breaks" },
      { id: "citation-note", title: "What a citation note should preserve" },
      { id: "how-cited-solves", title: "How Cited solves this" },
      { id: "example", title: "Example citation note" },
      { id: "faq", title: "FAQ" },
      { id: "conclusion", title: "Evidence beats guessing" },
    ],
    faq: [
      {
        id: "every-answer",
        question: "Does Cited monitor every ChatGPT answer?",
        answer:
          "No. Cited monitors the prompts, supported AI surfaces, schedules, locations, and verified domains you configure. It does not see every ChatGPT answer on the internet.",
      },
      {
        id: "private-ask",
        question:
          "Can I know if someone privately asked ChatGPT about my company?",
        answer:
          "No. Private conversations are out of scope. You can monitor buyer-like prompts that matter to your business and preserve evidence from those configured checks.",
      },
      {
        id: "mention-counts",
        question: "Does a brand mention count as a citation?",
        answer:
          "No. A mention names your brand without an attributable source link to your verified domain. A citation includes your verified domain as a source or linked reference.",
      },
      {
        id: "guarantee",
        question: "Can Cited guarantee more citations?",
        answer:
          "No. Cited records evidence from monitored results. It does not force AI providers to cite your website or guarantee more citations.",
      },
      {
        id: "how-often",
        question: "How often should I monitor prompts?",
        answer:
          "Start with the prompts that matter most, then check on a schedule you can actually review. Weekly review is enough for many teams. Increase cadence when a category is moving fast or a launch is live.",
      },
    ],
    markdown: `# How to Know If ChatGPT Cites Your Website

AI answers are becoming a discovery layer. The problem is not that citations are impossible to find. The problem is that most teams have no system for checking the questions that matter and preserving the evidence.

## The short answer

You cannot see every private ChatGPT conversation. You can monitor selected buyer-like prompts across supported AI-search surfaces and look for source citations, linked references, brand mentions, and recommendations.

If your verified domain appears as a source, that is citation evidence. If your brand is named without a source link, that is a mention. If a competitor is cited and you are absent, that is a missed opportunity.

## What counts as a ChatGPT citation?

- **Citation:** the monitored answer includes your verified domain as a source or linked reference.
- **Mention:** the answer names your brand or product without an attributable source link to your verified domain.
- **Recommendation:** the answer explicitly recommends your product, brand, or domain.
- **Non-citation:** the answer does not cite, mention, or recommend you in a way you can attribute.

## What you cannot know

Private chats stay private. Answers vary by provider, model, timing, location, and prompt wording. A single screenshot is not a complete picture of how AI search treats your site.

## What you can monitor

Configured prompts. Supported AI surfaces. Verified domains and brand aliases. Competitor domains you choose. Scheduled checks that create occurrence history over time.

## The manual way to check

1. Choose buyer-like prompts.
2. Run the same prompt in supported AI surfaces.
3. Record the answer.
4. Check source links.
5. Look for brand mentions.
6. Repeat over time.
7. Compare against competitors.

## Why manual tracking breaks

Screenshots drift. Spreadsheets go stale. There is no alerting, no dedupe, no shared inbox, and no clean history of first seen versus last observed.

## What a citation note should preserve

Prompt, surface, timestamp, cited URL, evidence excerpt, source title, first seen, last observed, and occurrence history.

## How Cited solves this

Cited is the evidence inbox for AI search. Add a domain, choose prompts, monitor supported surfaces, classify citations, mentions, recommendations, and missed opportunities, save evidence, alert via email or Slack, and export or share the record.

Cited is the evidence layer. Learn Domains is the action layer for site and content work that may improve future visibility.

## Limitations

Cited does not monitor private AI conversations or every possible AI answer. It does not guarantee more citations.

Canonical URL: https://cited.cc/blog/how-to-know-if-chatgpt-cites-your-website
`,
  },
  "ai-citation-monitoring": {
    slug: "ai-citation-monitoring",
    title: "What Is AI Citation Monitoring?",
    metaTitle: "What Is AI Citation Monitoring? A Practical Guide for AI Search",
    description:
      "AI citation monitoring helps teams track when selected AI-search prompts cite, mention, recommend, or miss their website. Learn what it is, what it is not, and how Cited works.",
    eyebrow: "Category definition",
    category: "AI Citation Monitoring",
    author: BLOG_AUTHOR.name,
    authorRole: BLOG_AUTHOR.role,
    publishedAt: PUBLISHED,
    updatedAt: PUBLISHED,
    readingTime: "10 min",
    canonicalPath: "/blog/ai-citation-monitoring",
    keywords: [
      "AI citation monitoring",
      "AI citation tracking",
      "AI search monitoring",
      "AI answer citations",
      "LLM citation monitoring",
      "AI visibility monitoring",
      "AI search evidence",
    ],
    relatedSlugs: [
      "how-to-know-if-chatgpt-cites-your-website",
      "llm-visibility-audit",
      "geo-vs-seo-what-citation-evidence-actually-is",
    ],
    tableOfContents: [
      { id: "definition", title: "The definition" },
      { id: "why-it-matters", title: "Why it matters now" },
      { id: "what-it-tracks", title: "What AI citation monitoring tracks" },
      { id: "what-it-does-not", title: "What it does not track" },
      { id: "vs-seo", title: "Citation monitoring vs SEO analytics" },
      { id: "anatomy", title: "Anatomy of a good system" },
      { id: "screenshots", title: "Why screenshots are not enough" },
      { id: "how-cited", title: "How Cited approaches it" },
      { id: "who-needs", title: "Who needs AI citation monitoring?" },
      { id: "workflow", title: "Example workflow" },
      { id: "faq", title: "FAQ" },
      { id: "conclusion", title: "Preserve the evidence" },
    ],
    faq: [
      {
        id: "same-as-ai-seo",
        question: "Is AI citation monitoring the same as AI SEO?",
        answer:
          "No. AI SEO usually means content and technical work meant to improve how AI systems discover and use your pages. AI citation monitoring is the evidence workflow that records whether selected AI answers cite, mention, recommend, or miss you.",
      },
      {
        id: "replace-gsc",
        question: "Does Cited replace Google Search Console?",
        answer:
          "No. Cited is the signal and evidence layer for monitored AI answers. It does not replace Search Console, analytics, or a full SEO suite.",
      },
      {
        id: "scraping",
        question: "Does Cited use scraping?",
        answer:
          "Cited uses product data providers and supported monitoring paths configured in the product. It only checks the prompts, surfaces, schedules, and domains you set up.",
      },
      {
        id: "competitors",
        question: "Can Cited monitor competitors?",
        answer:
          "Yes, on plans that include competitor watch. Cited only evaluates competitor domains you configure, and only within monitored results.",
      },
      {
        id: "how-many-prompts",
        question: "How many prompts should I start with?",
        answer:
          "Start with a focused set of buyer-like prompts, often around ten. Expand after you can review the inbox without drowning in noise.",
      },
    ],
    markdown: `# What Is AI Citation Monitoring?

AI search is changing discovery. Traditional analytics tell you what happened after someone clicked. AI citation monitoring helps you understand whether selected AI answers are citing you before the click ever happens.

## The definition

AI citation monitoring is the practice of checking selected AI-search prompts and preserving evidence when a website is cited, mentioned, recommended, or absent beside competitors.

## Why it matters now

AI answers act as discovery surfaces. Buyers research with prompts. Source trust shapes shortlists. Zero-click discovery means the citation itself can matter before traffic appears in analytics.

## What AI citation monitoring tracks

Citations, mentions, recommendations, competitor citations, missed opportunities, and occurrences over time.

## What it does not track

Every AI conversation. Private chats. Every possible prompt. Guaranteed visibility. Rankings. Traffic attribution by itself.

## Citation monitoring vs SEO analytics

SEO analytics covers rankings, traffic, clicks, backlinks, and technical issues. Citation monitoring covers AI answer evidence, source inclusion, prompt-level monitoring, and occurrence history.

## Anatomy of a good system

Verified domains. Prompt library. Supported surfaces. Evidence snapshots. Deterministic classification. Alerts. Exportable records. Clear limitations.

## Why screenshots are not enough

Screenshots are fragile. Evidence systems need structured records: prompt, surface, source, timestamp, and history.

## How Cited approaches AI citation monitoring

Domain verification. Selected prompts. Supported AI-search surfaces. Evidence notes. A citation inbox. Alerts. Notebook. Exports. Cited is the evidence layer. Learn Domains is the action layer.

## Who needs it

Founders, SEO leads, content teams, SaaS marketers, agencies, category creators, and teams with high-intent buyer prompts.

## Limitations

Cited does not monitor private AI conversations or every possible AI answer. It does not guarantee more citations.

Canonical URL: https://cited.cc/blog/ai-citation-monitoring
`,
  },
  "llm-visibility-audit": {
    slug: "llm-visibility-audit",
    title: "How to Run an LLM Visibility Audit",
    metaTitle: "How to Run an LLM Visibility Audit Without Guessing",
    description:
      "Learn how to run an LLM visibility audit by choosing buyer prompts, checking AI citations, recording evidence, and identifying missed opportunities. See how Cited makes the workflow repeatable.",
    eyebrow: "Audit workflow",
    category: "LLM Visibility",
    author: BLOG_AUTHOR.name,
    authorRole: BLOG_AUTHOR.role,
    publishedAt: PUBLISHED,
    updatedAt: PUBLISHED,
    readingTime: "12 min",
    canonicalPath: "/blog/llm-visibility-audit",
    keywords: [
      "LLM visibility audit",
      "AI visibility audit",
      "AI search audit",
      "LLM citation audit",
      "AI citation audit",
      "AI visibility tracking",
      "AI search visibility",
    ],
    relatedSlugs: [
      "ai-citation-monitoring",
      "how-to-know-if-chatgpt-cites-your-website",
      "ai-citation-checker",
    ],
    tableOfContents: [
      { id: "what-it-is", title: "What an LLM visibility audit is" },
      { id: "what-it-answers", title: "What a good audit should answer" },
      { id: "step-1", title: "Step 1: Choose buyer-like prompts" },
      { id: "step-2", title: "Step 2: Define the surfaces" },
      { id: "step-3", title: "Step 3: Verify the domain and aliases" },
      { id: "step-4", title: "Step 4: Record citation evidence" },
      { id: "step-5", title: "Step 5: Separate citations from mentions" },
      { id: "step-6", title: "Step 6: Identify missed opportunities" },
      { id: "step-7", title: "Step 7: Repeat the audit" },
      { id: "step-8", title: "Step 8: Turn evidence into action" },
      { id: "template", title: "Manual audit template" },
      { id: "how-cited", title: "How Cited makes this repeatable" },
      { id: "faq", title: "FAQ" },
      { id: "conclusion", title: "A useful audit is a record" },
    ],
    faq: [
      {
        id: "how-many",
        question:
          "How many prompts should an LLM visibility audit include?",
        answer:
          "Start with a focused set of high-intent buyer prompts, often 8 to 15. Add more only when you can review the evidence without creating noise.",
      },
      {
        id: "how-often",
        question: "How often should I rerun the audit?",
        answer:
          "One-off audits go stale. Weekly or twice-weekly monitoring creates useful history for most teams. Increase cadence around launches.",
      },
      {
        id: "same-as-seo",
        question: "Is this the same as SEO?",
        answer:
          "No. An LLM visibility audit reviews selected AI-search answers for citation evidence. SEO covers rankings, crawlability, content, and traffic systems.",
      },
      {
        id: "audit-competitors",
        question: "Can I audit competitors?",
        answer:
          "Yes. Configure competitor domains and review whether monitored answers cite them while your verified domain is absent.",
      },
      {
        id: "guarantee-future",
        question: "Can Cited guarantee future visibility?",
        answer:
          "No. Cited preserves evidence from monitored checks. It does not guarantee future inclusion, ranking, or citation in any AI answer.",
      },
    ],
    markdown: `# How to Run an LLM Visibility Audit Without Guessing

Most LLM visibility audits are too vague. They ask a few prompts, take screenshots, and call it strategy. A better audit preserves evidence.

## What an LLM visibility audit is

A structured review of selected AI-search prompts to see whether your brand or domain appears, gets cited, gets recommended, or is absent beside competitors.

## What a good audit should answer

Are we cited? Are we mentioned? Are competitors cited instead? Which prompts matter? Which pages are cited? Which topics are missing? What evidence should we preserve?

## Steps

1. Choose buyer-like prompts.
2. Define the supported AI surfaces you will check.
3. Verify the domain and aliases.
4. Record citation evidence.
5. Separate citations from mentions.
6. Identify missed opportunities.
7. Repeat the audit on a schedule.
8. Turn evidence into action with content and site work.

## Manual audit template

Prompt | Surface | Our domain cited? | Mentioned? | Competitor cited? | Evidence URL | Notes | Next action

## How Cited makes this repeatable

Prompt monitoring, evidence inbox, occurrence history, alerts, notebook, and exports. Cited shows the signal. Learn Domains or internal content work can help improve pages, internal links, and topical authority.

## Limitations

Cited does not monitor private AI conversations or every possible AI answer. It does not guarantee future visibility.

Canonical URL: https://cited.cc/blog/llm-visibility-audit
`,
  },
  "is-my-brand-cited-in-chatgpt": {
    slug: "is-my-brand-cited-in-chatgpt",
    title: "Is my brand cited in ChatGPT?",
    metaTitle: "Is my brand cited in ChatGPT? How to get a clear answer",
    description:
      "Find out what it means for ChatGPT to cite your brand, what a yes or no actually looks like, and how a free citation check differs from ongoing monitoring.",
    eyebrow: "Decision page",
    category: "AI Search",
    author: BLOG_AUTHOR.name,
    authorRole: BLOG_AUTHOR.role,
    publishedAt: NEW_PUBLISHED,
    updatedAt: NEW_PUBLISHED,
    readingTime: "10 min",
    canonicalPath: "/blog/is-my-brand-cited-in-chatgpt",
    keywords: [
      "is my brand cited in ChatGPT",
      "does ChatGPT cite my brand",
      "ChatGPT brand citation",
      "ChatGPT citation check",
      "AI brand citation",
    ],
    relatedSlugs: [
      "how-to-know-if-chatgpt-cites-your-website",
      "ai-citation-checker",
    ],
    tableOfContents: [
      { id: "the-decision", title: "The decision in front of you" },
      { id: "what-cited-means", title: "What cited means here" },
      { id: "what-yes-looks-like", title: "What a yes looks like" },
      { id: "what-no-looks-like", title: "What a no looks like" },
      { id: "mentions-and-recs", title: "Mentions and recommendations" },
      { id: "claude-gemini", title: "Claude and Gemini, briefly" },
      { id: "free-check", title: "What a free check can tell you" },
      { id: "next-step", title: "When monitoring is the next step" },
      { id: "faq", title: "FAQ" },
      { id: "conclusion", title: "Get the receipt, then decide" },
    ],
    faq: [
      {
        id: "every-chatgpt-answer",
        question: "Can I know if ChatGPT cites my brand in every conversation?",
        answer:
          "No. Private chats are out of scope. You can check selected buyer-like prompts on supported surfaces and preserve evidence from those checks.",
      },
      {
        id: "mention-equals-cited",
        question: "If ChatGPT names my brand, am I cited?",
        answer:
          "No. A mention names your brand without an attributable source link to your verified domain. A citation includes that domain as a source or linked reference.",
      },
      {
        id: "same-as-howto",
        question: "Is this the same as the ChatGPT how-to guide?",
        answer:
          "No. The how-to guide walks through the manual method. This page helps you decide what a yes, a no, and a mention mean, and whether a snapshot or monitoring is the right next step.",
      },
      {
        id: "guarantee-cited",
        question: "Can Cited make ChatGPT cite my brand?",
        answer:
          "No. Cited records evidence from monitored results. It does not force ChatGPT to cite your website or guarantee more citations.",
      },
      {
        id: "other-surfaces",
        question: "Should I only check ChatGPT?",
        answer:
          "No. Answers vary by surface. Claude and Gemini can treat the same prompt differently. A useful check includes the surfaces that matter for your buyers, not one provider in isolation.",
      },
    ],
    markdown: `# Is my brand cited in ChatGPT?

This is the decision page, not the method page. If you want the step-by-step check, use the how-to guide. If you want to know what a yes, a no, and a maybe actually mean, stay here.

## The decision in front of you

You are not asking for a ranking. You are asking whether selected ChatGPT answers treat your website as a source. That question has a bounded answer. It does not have a global one.

You cannot see every private ChatGPT conversation. You can check the prompts that sound like buyer research and keep the evidence.

## What cited means here

- **Citation:** the answer includes your verified domain as a source or linked reference.
- **Mention:** the answer names your brand or product without that attributable source link.
- **Recommendation:** the answer explicitly recommends your product, brand, or domain.
- **Miss:** a relevant answer cites a configured competitor while your verified domain is absent.

Naming is not citing. A compliment without a source link is still a mention.

## What a yes looks like

A yes is specific. A monitored ChatGPT answer includes your verified domain as a source. The useful record keeps the prompt, the surface, the timestamp, the cited URL, and an excerpt.

A yes on one prompt is not a yes on every prompt. Treat it as evidence for that check.

## What a no looks like

A no is also useful. The monitored answer does not cite, mention, or recommend your verified domain. If a competitor is cited instead, that is a missed opportunity, not a ranking.

Absence is evidence. It is not a verdict on your whole business.

## Mentions and recommendations

Mentions tell you the model knows the name. Recommendations tell you the model is willing to suggest you. Neither replaces a citation. Keep them in separate columns so the next action stays honest.

## Claude and Gemini, briefly

The same prompt can produce a citation on ChatGPT, a mention on Gemini, and silence on Claude. Do not collapse those surfaces into one score. If you want the method, use the how-to guide. If you want a snapshot across supported surfaces, start with a free check.

## What a free check can tell you

A free check is a snapshot. You choose a domain and a small set of prompts. Cited checks supported surfaces and preserves evidence when your site appears. It does not watch those prompts next week.

## When monitoring is the next step

Monitor when the prompts matter enough to revisit. Monitoring adds a schedule, an inbox, alerts, and history. Cited does not guarantee more citations. It keeps the record so you can decide what to do next.

Canonical URL: https://cited.cc/blog/is-my-brand-cited-in-chatgpt
`,
  },
  "how-to-check-if-perplexity-cites-your-website": {
    slug: "how-to-check-if-perplexity-cites-your-website",
    title: "How to check if Perplexity cites your website",
    metaTitle: "How to check if Perplexity cites your website",
    description:
      "Learn how to check whether Perplexity cites your website, what counts as source evidence, and how Cited monitors selected prompts so the receipt does not disappear.",
    eyebrow: "Field manual",
    category: "AI Search",
    author: BLOG_AUTHOR.name,
    authorRole: BLOG_AUTHOR.role,
    publishedAt: NEW_PUBLISHED,
    updatedAt: NEW_PUBLISHED,
    readingTime: "11 min",
    canonicalPath: "/blog/how-to-check-if-perplexity-cites-your-website",
    keywords: [
      "how to check if Perplexity cites your website",
      "does Perplexity cite my website",
      "Perplexity citations",
      "Perplexity source check",
      "AI citation monitoring Perplexity",
    ],
    relatedSlugs: [
      "ai-citation-monitoring",
      "llm-visibility-audit",
    ],
    tableOfContents: [
      { id: "short-answer", title: "The short answer" },
      { id: "why-perplexity", title: "Why Perplexity is worth a separate check" },
      { id: "what-counts", title: "What counts as a Perplexity citation" },
      { id: "manual-check", title: "The manual way to check" },
      { id: "what-to-record", title: "What to record" },
      { id: "one-off", title: "Why a one-off check is incomplete" },
      { id: "how-cited", title: "How Cited monitors Perplexity" },
      { id: "plans", title: "Which plans include Perplexity" },
      { id: "faq", title: "FAQ" },
      { id: "conclusion", title: "Keep the source list" },
    ],
    faq: [
      {
        id: "every-perplexity-answer",
        question: "Does Cited see every Perplexity answer?",
        answer:
          "No. Cited only checks the prompts, supported surfaces, schedules, locations, and verified domains you configure. Private Perplexity threads are out of scope.",
      },
      {
        id: "source-card",
        question: "If Perplexity lists sources, is my brand cited?",
        answer:
          "Only if your verified domain appears as a source or linked reference. A brand name in the prose without that link is a mention, not a citation.",
      },
      {
        id: "founder-plan",
        question: "Does every Cited plan monitor Perplexity?",
        answer:
          "No. Perplexity monitoring starts on Growth. Founder covers ChatGPT and Gemini. Compare plans before you assume a surface is included.",
      },
      {
        id: "guarantee-sources",
        question: "Can Cited get my site into Perplexity's sources?",
        answer:
          "No. Cited records evidence from monitored results. It does not control Perplexity's retrieval or guarantee more citations.",
      },
      {
        id: "same-as-chatgpt",
        question: "Can I reuse a ChatGPT check as a Perplexity result?",
        answer:
          "No. Surfaces differ. Run the same prompt wording on Perplexity and store it as its own evidence note.",
      },
    ],
    markdown: `# How to check if Perplexity cites your website

Perplexity makes sources visible. That does not make the check automatic. You still need a prompt list, a repeatable method, and a place to keep the evidence.

## The short answer

Ask buyer-like prompts on Perplexity. Inspect the sources and the prose. If your verified domain appears as a source or linked reference, that is citation evidence. If only the brand name appears, that is a mention. If a competitor is sourced and you are not, that is a missed opportunity.

You cannot see every private Perplexity thread. You can monitor selected prompts.

## Why Perplexity is worth a separate check

Perplexity is built around cited answers. Buyers who live there are already looking at source lists. A ChatGPT result does not stand in for a Perplexity result. Keep the surfaces separate.

## What counts as a Perplexity citation

- **Citation:** your verified domain appears as a source or linked reference.
- **Mention:** your brand is named without that attributable source link.
- **Recommendation:** the answer explicitly recommends you.
- **Miss:** a configured competitor is sourced and your verified domain is absent.

## The manual way to check

1. Choose buyer-like prompts.
2. Run the same wording in Perplexity.
3. Capture the answer and the source list before they change.
4. Check each source URL against your verified domain.
5. Separate mentions from citations.
6. Repeat later with the same wording.

## What to record

Prompt, surface, timestamp, cited URL, evidence excerpt, source title, first seen, last observed.

## Why a one-off check is incomplete

Source lists move. A screenshot from Tuesday does not answer Friday. Without a schedule you are collecting souvenirs.

## How Cited monitors Perplexity

Cited is the evidence inbox. On plans that include Perplexity, you add a verified domain, choose prompts, and let scheduled checks classify citations, mentions, recommendations, and misses. Free checks can include supported surfaces as a snapshot. Monitoring keeps the record.

Cited does not guarantee more citations.

## Which plans include Perplexity

Growth ($29), Pro ($49), and Portfolio ($199) include Perplexity. Founder ($19) covers ChatGPT and Gemini. The free check at /scan is a snapshot, not a substitute for a plan.

Canonical URL: https://cited.cc/blog/how-to-check-if-perplexity-cites-your-website
`,
  },
  "are-you-showing-up-in-google-ai-overviews": {
    slug: "are-you-showing-up-in-google-ai-overviews",
    title: "Are you showing up in Google AI Overviews?",
    metaTitle: "Are you showing up in Google AI Overviews?",
    description:
      "Learn what it means to appear in Google AI Overviews, how that differs from a blue-link ranking, and how to check selected queries for citation evidence.",
    eyebrow: "Decision page",
    category: "AI Search",
    author: BLOG_AUTHOR.name,
    authorRole: BLOG_AUTHOR.role,
    publishedAt: NEW_PUBLISHED,
    updatedAt: NEW_PUBLISHED,
    readingTime: "10 min",
    canonicalPath: "/blog/are-you-showing-up-in-google-ai-overviews",
    keywords: [
      "Google AI Overviews",
      "are you showing up in Google AI Overviews",
      "AI Overviews citations",
      "Google AI Overview check",
      "AI Overview visibility",
    ],
    relatedSlugs: [
      "llm-visibility-audit",
      "ai-citation-checker",
    ],
    tableOfContents: [
      { id: "the-question", title: "The question" },
      { id: "what-appearance-is", title: "What an Overview appearance is" },
      { id: "not-blue-links", title: "This is not a blue-link ranking" },
      { id: "what-you-can-check", title: "What you can check" },
      { id: "what-you-cannot", title: "What you cannot know from one search" },
      { id: "manual-vs-monitored", title: "Manual versus monitored" },
      { id: "how-cited", title: "How Cited treats Google AI" },
      { id: "plans", title: "Which plans include Google AI" },
      { id: "faq", title: "FAQ" },
      { id: "conclusion", title: "Check the query, keep the evidence" },
    ],
    faq: [
      {
        id: "every-overview",
        question: "Can Cited see every Google AI Overview?",
        answer:
          "No. Cited only checks the prompts, supported surfaces, schedules, locations, and verified domains you configure. It does not watch every Overview on the internet.",
      },
      {
        id: "ranking-same",
        question: "If I rank in Google, am I in the Overview?",
        answer:
          "No. A classic ranking and an Overview citation are different evidence. One can exist without the other.",
      },
      {
        id: "founder-google-ai",
        question: "Does Founder include Google AI Overviews?",
        answer:
          "No. Google AI monitoring starts on Pro. Founder covers ChatGPT and Gemini. Growth adds Perplexity. Compare plans before you assume the surface is included.",
      },
      {
        id: "guarantee-overview",
        question: "Can Cited put my site into AI Overviews?",
        answer:
          "No. Cited records evidence from monitored results. It does not control Google and does not guarantee inclusion or more citations.",
      },
      {
        id: "one-search-enough",
        question: "Is one Google search enough?",
        answer:
          "No. Overviews vary by wording, location, and timing. A single search is a moment. Monitoring is how you get first seen and last observed.",
      },
    ],
    markdown: `# Are you showing up in Google AI Overviews?

The question sounds like a ranking question. It is not. An Overview can cite you, mention you, skip you, or never appear for that query. You need evidence for the queries you care about, not a single screenshot of the search box.

## The question

You want to know whether selected Google AI Overviews treat your website as a source. That is a prompt-level question. It is not a sitewide score.

## What an Overview appearance is

An appearance is evidence that a monitored Overview included your verified domain as a source or linked reference. A brand name in the generated text without that link is a mention. A competitor in the source list while you are absent is a miss.

## This is not a blue-link ranking

Search Console still matters for clicks and classic results. It does not tell you whether an Overview cited your page. Do not treat a ranking as an Overview receipt.

## What you can check

Selected queries. Supported Google AI surfaces on plans that include them. Verified domains. Competitor domains you configure. Scheduled checks that create history.

## What you cannot know from one search

Whether the Overview will render the same way tomorrow. Whether a different location sees the same sources. Whether every related query behaves the same. Private searches stay private.

## Manual versus monitored

You can run the query yourself, save the Overview, and inspect sources. That is a start. It breaks when the query set grows or when someone asks what changed last week. Monitoring stores prompt, surface, timestamp, source URL, and occurrence history.

## How Cited treats Google AI

Cited monitors configured prompts on supported Google AI surfaces and preserves evidence when your verified domain is cited, mentioned, recommended, or missed. A free check is a snapshot. Paid monitoring is the record. Cited does not guarantee more citations.

## Which plans include Google AI

Pro ($49) and Portfolio ($199) include Google AI. Founder ($19) covers ChatGPT and Gemini. Growth ($29) adds Perplexity. The free check at /scan can include supported surfaces as a one-time snapshot.

Canonical URL: https://cited.cc/blog/are-you-showing-up-in-google-ai-overviews
`,
  },
  "geo-vs-seo-what-citation-evidence-actually-is": {
    slug: "geo-vs-seo-what-citation-evidence-actually-is",
    title: "GEO vs SEO: what citation evidence actually is",
    metaTitle: "GEO vs SEO: what citation evidence actually is",
    description:
      "GEO is not a new SEO suite. Citation evidence is a record that a selected AI answer cited, mentioned, recommended, or missed your verified domain.",
    eyebrow: "Category definition",
    category: "AI Citation Monitoring",
    author: BLOG_AUTHOR.name,
    authorRole: BLOG_AUTHOR.role,
    publishedAt: NEW_PUBLISHED,
    updatedAt: NEW_PUBLISHED,
    readingTime: "11 min",
    canonicalPath: "/blog/geo-vs-seo-what-citation-evidence-actually-is",
    keywords: [
      "GEO vs SEO",
      "generative engine optimization",
      "citation evidence",
      "AI citation vs SEO",
      "what is citation evidence",
    ],
    relatedSlugs: [
      "ai-citation-monitoring",
      "llm-visibility-audit",
    ],
    tableOfContents: [
      { id: "short-distinction", title: "The short distinction" },
      { id: "what-seo-measures", title: "What SEO already measures" },
      { id: "what-geo-claims", title: "What GEO usually claims" },
      { id: "what-evidence-is", title: "What citation evidence actually is" },
      { id: "four-labels", title: "Four labels worth keeping separate" },
      { id: "not-screenshots", title: "Why screenshots are not GEO" },
      { id: "where-cited-sits", title: "Where Cited sits" },
      { id: "what-cited-is-not", title: "What Cited is not" },
      { id: "faq", title: "FAQ" },
      { id: "conclusion", title: "Keep the words honest" },
    ],
    faq: [
      {
        id: "geo-replaces-seo",
        question: "Does GEO replace SEO?",
        answer:
          "No. SEO still covers crawlability, rankings, content, and traffic systems. GEO, as people use the term, is usually a mix of content advice and AI-answer observation. They are related. They are not the same job.",
      },
      {
        id: "cited-is-geo-tool",
        question: "Is Cited a GEO tool?",
        answer:
          "Cited is an AI citation monitoring product. It records whether selected AI answers cite, mention, recommend, or miss a verified domain. It is not a content generator, crawler, or SEO suite.",
      },
      {
        id: "evidence-is-ranking",
        question: "Is citation evidence a ranking?",
        answer:
          "No. Citation evidence is a record from a monitored answer. It is not a position, a share of voice score, or a traffic number.",
      },
      {
        id: "guarantee-geo",
        question: "Can Cited improve my GEO score?",
        answer:
          "No. Cited does not invent a GEO score and does not guarantee more citations. It preserves evidence so your team can decide what to do next.",
      },
      {
        id: "same-as-gsc",
        question: "Can I skip Search Console if I have citation evidence?",
        answer:
          "No. Search Console and analytics still answer click and crawl questions. Citation evidence answers a different question: did this monitored AI answer use your site as a source?",
      },
    ],
    markdown: `# GEO vs SEO: what citation evidence actually is

GEO is a popular label. SEO is a mature practice. Citation evidence is neither a slogan nor a ranking. It is a record.

## The short distinction

SEO measures how pages are discovered, ranked, and clicked in search systems. Citation evidence records whether a selected AI answer used your verified domain as a source. GEO, in most marketing usage, mixes those jobs and adds content advice. Keep the evidence layer separate from the action layer.

## What SEO already measures

Rankings. Clicks. Impressions. Index coverage. Backlinks. Technical health. Those remain useful. They do not tell you whether ChatGPT, Perplexity, Claude, Gemini, or a Google AI Overview cited your page for a prompt you care about.

## What GEO usually claims

Most GEO writing promises visibility inside generated answers. Some of that work is ordinary content and site craft. Some of it is observation: did the answer cite you? The observation is the part that needs a receipt.

## What citation evidence actually is

Citation evidence is a structured note from a monitored answer: prompt, surface, timestamp, source URL, excerpt, and occurrence history. It is attributable to a verified domain. It is not a vibe, a screenshot folder, or a made-up score.

## Four labels worth keeping separate

- **Citation:** verified domain used as a source or linked reference.
- **Mention:** brand named without that link.
- **Recommendation:** explicit suggest.
- **Miss:** a configured competitor is cited and you are absent.

## Why screenshots are not GEO

A screenshot is a moment. GEO-as-strategy needs a method. The method needs records you can reopen. If the file cannot answer prompt, surface, source, and time, it is not evidence.

## Where Cited sits

Cited is the evidence layer. You choose prompts and supported surfaces. Cited classifies citations, mentions, recommendations, and misses, then keeps them in an inbox with alerts and exports. Learn Domains is the action layer for site and content work that may improve future visibility.

## What Cited is not

Cited is not an SEO suite, crawler, or content generator. It does not monitor private AI conversations or every possible answer. It does not guarantee more citations.

Canonical URL: https://cited.cc/blog/geo-vs-seo-what-citation-evidence-actually-is
`,
  },
  "ai-citation-checker": {
    slug: "ai-citation-checker",
    title: "AI citation checker",
    metaTitle: "AI citation checker: free snapshot vs paid monitoring",
    description:
      "An AI citation checker should tell you whether selected AI answers cite your website. See what Cited's free check does, what it does not do, and when to start monitoring.",
    eyebrow: "Product explainer",
    category: "AI Citation Monitoring",
    author: BLOG_AUTHOR.name,
    authorRole: BLOG_AUTHOR.role,
    publishedAt: NEW_PUBLISHED,
    updatedAt: NEW_PUBLISHED,
    readingTime: "10 min",
    canonicalPath: "/blog/ai-citation-checker",
    keywords: [
      "AI citation checker",
      "AI citation check",
      "free AI citation checker",
      "check if AI cites my website",
      "AI citation monitoring tool",
    ],
    relatedSlugs: [
      "ai-citation-monitoring",
      "is-my-brand-cited-in-chatgpt",
    ],
    tableOfContents: [
      { id: "what-people-mean", title: "What people mean by checker" },
      { id: "free-check", title: "What the free check does" },
      { id: "free-does-not", title: "What the free check does not do" },
      { id: "snapshot-vs-record", title: "Snapshot versus record" },
      { id: "what-you-get", title: "What you get from a check" },
      { id: "when-to-monitor", title: "When to start monitoring" },
      { id: "plans", title: "Plans, plainly" },
      { id: "faq", title: "FAQ" },
      { id: "conclusion", title: "Run the check you can stand behind" },
    ],
    faq: [
      {
        id: "checker-sees-everything",
        question: "Does an AI citation checker see every AI answer?",
        answer:
          "No. A useful checker only evaluates the prompts, supported surfaces, and domain you submit. Private conversations are out of scope.",
      },
      {
        id: "free-equals-monitoring",
        question: "Is the free check the same as paid monitoring?",
        answer:
          "No. The free check is a snapshot for selected prompts on supported surfaces. Monitoring adds a schedule, a citation inbox, alerts, and history.",
      },
      {
        id: "how-many-free",
        question: "How many free checks do I get?",
        answer:
          "The public check is rate limited by network. If today's check is already used, wait until tomorrow or start monitoring for recurring checks.",
      },
      {
        id: "guarantee-result",
        question: "Will the checker make AI cite my site?",
        answer:
          "No. Cited does not control AI providers and does not guarantee more citations. It preserves evidence from the check you ran.",
      },
      {
        id: "need-account",
        question: "Do I need a Cited account to run the free check?",
        answer:
          "The free check lives at /scan. You submit a domain, prompts, and an email for a private result link. Ongoing monitoring lives in the app after you choose a plan.",
      },
    ],
    markdown: `# AI citation checker

Most people who type "AI citation checker" want a simple thing: did selected AI answers use my website as a source? The honest product answer is a snapshot first, a record second.

## What people mean by checker

They want a receipt, not a content strategy. A checker should accept a domain, run selected prompts on supported surfaces, and say whether the site was cited, mentioned, recommended, or missed.

## What the free check does

Cited's free check asks for a public domain, optional brand names, and up to three questions. It runs those questions on supported surfaces and emails a private result link when the snapshot is ready. Results vary by provider, location, timing, and prompt wording.

## What the free check does not do

It does not watch those prompts next week. It does not replace an inbox, alerts, or history. It does not see private AI conversations. It does not guarantee more citations.

## Snapshot versus record

A snapshot answers: what happened on this check? A record answers: when did this first appear, and is it still true? Monitoring is the record. The free check is the snapshot.

## What you get from a check

A private result link. The prompts you chose. An evidence note when the snapshot is ready. A clear path to ongoing monitoring if the prompts are worth repeating.

## When to start monitoring

Start monitoring when you have prompts you will still care about next month. Cited plans add recurring checks, a citation inbox, email alerts, and history. Founder starts at $19/month.

## Plans, plainly

Founder $19: ChatGPT and Gemini, 10 prompts, twice-weekly. Growth $29: adds Perplexity and competitor watch. Pro $49: adds Claude and Google AI, daily checks. Portfolio $199: multiple domains. The free check is not a plan.

Canonical URL: https://cited.cc/blog/ai-citation-checker
`,
  },
};

export const REQUIRED_BLOG_SLUGS = [
  "how-to-know-if-chatgpt-cites-your-website",
  "ai-citation-monitoring",
  "llm-visibility-audit",
  "is-my-brand-cited-in-chatgpt",
  "how-to-check-if-perplexity-cites-your-website",
  "are-you-showing-up-in-google-ai-overviews",
  "geo-vs-seo-what-citation-evidence-actually-is",
  "ai-citation-checker",
] as const;

export type BlogSlug = (typeof REQUIRED_BLOG_SLUGS)[number];

export function getBlogArticle(slug: string): BlogArticle | null {
  return BLOG_ARTICLES[slug] ?? null;
}

export function getAllBlogArticles(): BlogArticle[] {
  return REQUIRED_BLOG_SLUGS.map((slug) => BLOG_ARTICLES[slug]).filter(
    (article): article is BlogArticle => Boolean(article),
  );
}

export function getBlogPath(slug?: string): string {
  return slug ? `/blog/${slug}` : "/blog";
}

export function getRelatedBlogArticles(slug: string): BlogArticle[] {
  const article = BLOG_ARTICLES[slug];
  if (!article) return [];
  return article.relatedSlugs
    .map((related) => BLOG_ARTICLES[related])
    .filter((item): item is BlogArticle => Boolean(item));
}

export function getBlogIndexablePaths(): string[] {
  return ["/blog", ...REQUIRED_BLOG_SLUGS.map((slug) => `/blog/${slug}`)];
}

export function formatBlogDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
