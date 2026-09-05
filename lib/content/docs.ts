import { CHANGELOG_ENTRIES, CHANGELOG_INTRO } from "@/lib/content/changelog";
import { getSupportContactConfig } from "@/lib/content/support";
import { TERMINOLOGY } from "@/lib/content/terminology";
import { getPlanEntitlements } from "@/lib/entitlements/plan-entitlements";
import { getPlanRegistryEntry } from "@/lib/entitlements/plan-catalog";
import {
  getEnabledAiSurfaces,
  getAiSurfaceDefinition,
} from "@/lib/monitoring/surfaces";
import type { CheckoutPlanKey } from "@/lib/entitlements/plan-catalog";

export type DocsCategory =
  | "start"
  | "setup"
  | "use"
  | "account"
  | "next";

export type DocsTocItem = {
  id: string;
  title: string;
};

export type DocsArticleMeta = {
  slug: string;
  title: string;
  description: string;
  category: DocsCategory;
  lastUpdated: string;
  estimatedReadingTime: string;
  tableOfContents: DocsTocItem[];
  relatedSlugs: string[];
};

export type DocsNavGroup = {
  id: DocsCategory;
  title: string;
  slugs: string[];
};

export const DOCS_NAV_GROUPS: DocsNavGroup[] = [
  {
    id: "start",
    title: "Start",
    slugs: ["getting-started", "what-cited-monitors", "citations-vs-mentions"],
  },
  {
    id: "setup",
    title: "Setup",
    slugs: ["monitored-prompts", "domain-verification", "ai-surfaces"],
  },
  {
    id: "use",
    title: "Use Cited",
    slugs: [
      "citation-inbox",
      "evidence-notes",
      "notebook",
      "alerts-and-digests",
    ],
  },
  {
    id: "account",
    title: "Account",
    slugs: [
      "billing-and-limits",
      "exporting-evidence",
      "troubleshooting",
      "faq",
      "contact",
    ],
  },
  {
    id: "next",
    title: "Next steps",
    slugs: ["learn-domains-handoff", "llms", "changelog"],
  },
];

export const DOCS_INDEX = {
  eyebrow: "Cited Docs",
  headline: "Cited Docs",
  supporting:
    "Learn how to monitor selected AI answers, preserve citation evidence, and understand what changed without turning your workflow into another dashboard.",
  primaryCta: { label: "Open Cited", href: "/app" },
  secondaryCta: { label: "Self-host with Docker", href: "/docs/getting-started" },
  lastUpdated: "2026-09-05",
} as const;

const LAST_UPDATED = "2026-09-05";

export const DOCS_ARTICLES: Record<string, DocsArticleMeta> = {
  "getting-started": {
    slug: "getting-started",
    title: "Getting started",
    description:
      "Create an account, verify a domain, add prompts, and review your first citation evidence in Cited.",
    category: "start",
    lastUpdated: LAST_UPDATED,
    estimatedReadingTime: "5 min",
    tableOfContents: [
      { id: "steps", title: "Setup steps" },
      { id: "first-monitor", title: "First monitor example" },
      { id: "timing", title: "When results appear" },
    ],
    relatedSlugs: [
      "what-cited-monitors",
      "domain-verification",
      "monitored-prompts",
      "citation-inbox",
    ],
  },
  "what-cited-monitors": {
    slug: "what-cited-monitors",
    title: "What Cited monitors",
    description:
      "Cited monitors the prompts, AI surfaces, schedules, locations, and verified domains you configure. Learn what is in scope and what is not.",
    category: "start",
    lastUpdated: LAST_UPDATED,
    estimatedReadingTime: "4 min",
    tableOfContents: [
      { id: "in-scope", title: "In scope" },
      { id: "monitor-checks", title: "Monitor checks" },
      { id: "out-of-scope", title: "What Cited does not monitor" },
    ],
    relatedSlugs: [
      "getting-started",
      "ai-surfaces",
      "monitored-prompts",
      "citations-vs-mentions",
    ],
  },
  "citations-vs-mentions": {
    slug: "citations-vs-mentions",
    title: "Citations vs mentions",
    description:
      "Definitions for citation, mention, recommendation, competitor citation, missed opportunity, and related evidence terms.",
    category: "start",
    lastUpdated: LAST_UPDATED,
    estimatedReadingTime: "5 min",
    tableOfContents: [
      { id: "citation", title: "Citation" },
      { id: "mention", title: "Mention" },
      { id: "recommendation", title: "Recommendation" },
      { id: "competitor-citation", title: "Competitor citation" },
      { id: "missed-opportunity", title: "Missed opportunity" },
      { id: "occurrence", title: "Occurrence and events" },
      { id: "examples", title: "Examples" },
    ],
    relatedSlugs: [
      "citation-inbox",
      "evidence-notes",
      "what-cited-monitors",
      "learn-domains-handoff",
    ],
  },
  "monitored-prompts": {
    slug: "monitored-prompts",
    title: "Monitored prompts",
    description:
      "How to write buyer-like prompts, avoid prompt stuffing, and keep monitoring focused on questions that matter.",
    category: "setup",
    lastUpdated: LAST_UPDATED,
    estimatedReadingTime: "5 min",
    tableOfContents: [
      { id: "strategy", title: "Prompt strategy" },
      { id: "good-patterns", title: "Good patterns" },
      { id: "bad-patterns", title: "Patterns to avoid" },
      { id: "limits", title: "Limits and focus" },
    ],
    relatedSlugs: [
      "getting-started",
      "what-cited-monitors",
      "billing-and-limits",
      "ai-surfaces",
    ],
  },
  "domain-verification": {
    slug: "domain-verification",
    title: "Domain verification",
    description:
      "Verify ownership with a DNS TXT record so Cited can attribute citation evidence to domains you control.",
    category: "setup",
    lastUpdated: LAST_UPDATED,
    estimatedReadingTime: "5 min",
    tableOfContents: [
      { id: "why", title: "Why verification exists" },
      { id: "record", title: "DNS TXT record" },
      { id: "steps", title: "How to verify" },
      { id: "propagation", title: "Propagation issues" },
      { id: "failures", title: "If verification fails" },
      { id: "safety", title: "What not to do" },
    ],
    relatedSlugs: [
      "getting-started",
      "troubleshooting",
      "what-cited-monitors",
      "billing-and-limits",
    ],
  },
  "ai-surfaces": {
    slug: "ai-surfaces",
    title: "AI surfaces",
    description:
      "Which AI surfaces Cited can monitor, how plan availability works, and why results can vary across providers.",
    category: "setup",
    lastUpdated: LAST_UPDATED,
    estimatedReadingTime: "4 min",
    tableOfContents: [
      { id: "availability", title: "Availability" },
      { id: "enabled", title: "Currently enabled surfaces" },
      { id: "variation", title: "Why results vary" },
      { id: "unsupported", title: "Unsupported surfaces" },
    ],
    relatedSlugs: [
      "what-cited-monitors",
      "billing-and-limits",
      "monitored-prompts",
      "faq",
    ],
  },
  "citation-inbox": {
    slug: "citation-inbox",
    title: "Citation Inbox",
    description:
      "How the Citation Inbox organizes new, seen, saved, archived, and resolved notes without turning monitoring into noise.",
    category: "use",
    lastUpdated: LAST_UPDATED,
    estimatedReadingTime: "5 min",
    tableOfContents: [
      { id: "purpose", title: "Purpose" },
      { id: "tabs", title: "Tabs and states" },
      { id: "filters", title: "Filters and search" },
      { id: "recurrence", title: "Recurring citations" },
      { id: "seen", title: "Seen behavior" },
    ],
    relatedSlugs: [
      "evidence-notes",
      "citations-vs-mentions",
      "alerts-and-digests",
      "exporting-evidence",
    ],
  },
  "evidence-notes": {
    slug: "evidence-notes",
    title: "Evidence notes",
    description:
      "Open a citation note to review the stored prompt, response snapshot, sources, occurrence history, and annotations.",
    category: "use",
    lastUpdated: LAST_UPDATED,
    estimatedReadingTime: "5 min",
    tableOfContents: [
      { id: "contents", title: "What a note contains" },
      { id: "first-seen", title: "First seen by Cited" },
      { id: "last-observed", title: "Last observed by Cited" },
      { id: "snapshots", title: "Stored snapshots" },
      { id: "provenance", title: "Provenance" },
    ],
    relatedSlugs: [
      "citation-inbox",
      "notebook",
      "exporting-evidence",
      "citations-vs-mentions",
    ],
  },
  notebook: {
    slug: "notebook",
    title: "Notebook",
    description:
      "Preserve context around citation evidence with linked notes, private notes, and revision history.",
    category: "use",
    lastUpdated: LAST_UPDATED,
    estimatedReadingTime: "4 min",
    tableOfContents: [
      { id: "purpose", title: "Purpose" },
      { id: "visibility", title: "Private vs workspace notes" },
      { id: "annotations", title: "Annotations vs notes" },
      { id: "history", title: "Revision history" },
      { id: "boundary", title: "What Notebook is not" },
    ],
    relatedSlugs: [
      "evidence-notes",
      "citation-inbox",
      "exporting-evidence",
      "alerts-and-digests",
    ],
  },
  "alerts-and-digests": {
    slug: "alerts-and-digests",
    title: "Alerts and digests",
    description:
      "Instant alerts, weekly digests, monitor issue alerts, preference hierarchy, and unsubscribe behavior.",
    category: "use",
    lastUpdated: LAST_UPDATED,
    estimatedReadingTime: "5 min",
    tableOfContents: [
      { id: "instant", title: "Instant alerts" },
      { id: "digest", title: "Weekly digest" },
      { id: "issues", title: "Monitor issue alerts" },
      { id: "recurring", title: "Recurring citations" },
      { id: "preferences", title: "Preferences and unsubscribe" },
    ],
    relatedSlugs: [
      "citation-inbox",
      "billing-and-limits",
      "troubleshooting",
    ],
  },
  "billing-and-limits": {
    slug: "billing-and-limits",
    title: "Billing and limits",
    description:
      "Plan limits, usage meters, email alerts, history windows, downgrades, cancellations, and failed payments.",
    category: "account",
    lastUpdated: LAST_UPDATED,
    estimatedReadingTime: "6 min",
    tableOfContents: [
      { id: "plans", title: "Plans and limits" },
      { id: "meters", title: "Usage meters" },
      { id: "history-window", title: "History window" },
      { id: "downgrade", title: "Downgrade and cancellation" },
      { id: "payments", title: "Failed payments" },
    ],
    relatedSlugs: [
      "exporting-evidence",
      "ai-surfaces",
      "troubleshooting",
    ],
  },
  "exporting-evidence": {
    slug: "exporting-evidence",
    title: "Exporting evidence",
    description:
      "Export citation events, citation notes, notebook entries, and workspace evidence archives for records and internal reports.",
    category: "account",
    lastUpdated: LAST_UPDATED,
    estimatedReadingTime: "5 min",
    tableOfContents: [
      { id: "formats", title: "Export formats" },
      { id: "permissions", title: "Permissions" },
      { id: "privacy", title: "Privacy defaults" },
      { id: "limits", title: "Size and rate limits" },
    ],
    relatedSlugs: [
      "evidence-notes",
      "notebook",
      "billing-and-limits",
      "citation-inbox",
    ],
  },
  "learn-domains-handoff": {
    slug: "learn-domains-handoff",
    title: "Learn Domains",
    description:
      "Cited preserves citation evidence. Learn Domains can help with site, content, and structure work that may earn citations over time.",
    category: "next",
    lastUpdated: LAST_UPDATED,
    estimatedReadingTime: "4 min",
    tableOfContents: [
      { id: "boundary", title: "Product boundary" },
      { id: "when", title: "When handoff appears" },
      { id: "example", title: "Example" },
      { id: "limits", title: "What handoff does not claim" },
    ],
    relatedSlugs: [
      "citations-vs-mentions",
      "what-cited-monitors",
      "evidence-notes",
      "getting-started",
    ],
  },
  troubleshooting: {
    slug: "troubleshooting",
    title: "Troubleshooting",
    description:
      "Calm steps for domain verification, empty inboxes, blocked monitors, email alerts, billing, and classification questions.",
    category: "account",
    lastUpdated: LAST_UPDATED,
    estimatedReadingTime: "8 min",
    tableOfContents: [
      { id: "domain", title: "Domain will not verify" },
      { id: "no-notes", title: "No citation notes yet" },
      { id: "blocked", title: "Monitor is blocked" },
      { id: "alerts", title: "Fewer alerts than expected" },
      { id: "self-hosted", title: "Self-hosted diagnostics" },
      { id: "email", title: "Email alerts are not sending" },
      { id: "billing", title: "Billing needs attention" },
      { id: "classification", title: "Classification questions" },
      { id: "limits", title: "Plan limits and cancellation" },
    ],
    relatedSlugs: [
      "domain-verification",
      "alerts-and-digests",
      "billing-and-limits",
      "contact",
    ],
  },
  faq: {
    slug: "faq",
    title: "FAQ",
    description:
      "Short answers about what Cited monitors, citation definitions, supported surfaces, exports, cancellation, and Learn Domains.",
    category: "account",
    lastUpdated: LAST_UPDATED,
    estimatedReadingTime: "5 min",
    tableOfContents: [{ id: "questions", title: "Questions" }],
    relatedSlugs: [
      "what-cited-monitors",
      "citations-vs-mentions",
      "billing-and-limits",
      "learn-domains-handoff",
    ],
  },
  changelog: {
    slug: "changelog",
    title: "Changelog",
    description:
      "What ships in Cited today across monitoring, evidence, alerts, billing, and docs.",
    category: "next",
    lastUpdated: LAST_UPDATED,
    estimatedReadingTime: "2 min",
    tableOfContents: [{ id: "entries", title: "Entries" }],
    relatedSlugs: ["getting-started", "contact", "faq"],
  },
  contact: {
    slug: "contact",
    title: "Contact",
    description:
      "How to reach Cited support for product, billing, and security questions.",
    category: "account",
    lastUpdated: LAST_UPDATED,
    estimatedReadingTime: "2 min",
    tableOfContents: [
      { id: "support", title: "Support" },
      { id: "billing", title: "Billing" },
      { id: "security", title: "Security" },
      { id: "include", title: "What to include" },
    ],
    relatedSlugs: ["troubleshooting", "faq", "billing-and-limits", "getting-started"],
  },
  llms: {
    slug: "llms",
    title: "Cited LLM Files",
    description:
      "Cited publishes LLM-readable files to help AI systems and agents understand the product, docs, and public editorial content.",
    category: "next",
    lastUpdated: LAST_UPDATED,
    estimatedReadingTime: "4 min",
    tableOfContents: [
      { id: "what-llms-txt", title: "What /llms.txt is" },
      { id: "what-llms-full", title: "What /llms-full.txt is" },
      { id: "includes", title: "What they include" },
      { id: "excludes", title: "What they do not include" },
      { id: "files", title: "Public files" },
      { id: "related", title: "Related reading" },
    ],
    relatedSlugs: [
      "what-cited-monitors",
      "citations-vs-mentions",
      "getting-started",
      "faq",
    ],
  },
};

export const REQUIRED_DOCS_SLUGS = [
  "getting-started",
  "what-cited-monitors",
  "citations-vs-mentions",
  "monitored-prompts",
  "domain-verification",
  "ai-surfaces",
  "citation-inbox",
  "evidence-notes",
  "notebook",
  "alerts-and-digests",
  "billing-and-limits",
  "exporting-evidence",
  "learn-domains-handoff",
  "troubleshooting",
  "faq",
  "changelog",
  "contact",
  "llms",
] as const;

export type DocsSlug = (typeof REQUIRED_DOCS_SLUGS)[number];

export function getDocsArticle(slug: string): DocsArticleMeta | null {
  return DOCS_ARTICLES[slug] ?? null;
}

export function getAllDocsArticles(): DocsArticleMeta[] {
  return Object.values(DOCS_ARTICLES);
}

export function getDocsPath(slug?: string): string {
  return slug ? `/docs/${slug}` : "/docs";
}

export function getRelatedArticles(slug: string): DocsArticleMeta[] {
  const article = DOCS_ARTICLES[slug];
  if (!article) return [];
  return article.relatedSlugs
    .map((related) => DOCS_ARTICLES[related])
    .filter((item): item is DocsArticleMeta => Boolean(item));
}

export type DocsSearchResult = {
  slug: string;
  title: string;
  description: string;
  href: string;
  match: "title" | "description" | "heading" | "category";
};

export function searchDocs(query: string, limit = 12): DocsSearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: DocsSearchResult[] = [];

  for (const article of getAllDocsArticles()) {
    if (article.title.toLowerCase().includes(q)) {
      results.push({
        slug: article.slug,
        title: article.title,
        description: article.description,
        href: getDocsPath(article.slug),
        match: "title",
      });
      continue;
    }
    if (article.description.toLowerCase().includes(q)) {
      results.push({
        slug: article.slug,
        title: article.title,
        description: article.description,
        href: getDocsPath(article.slug),
        match: "description",
      });
      continue;
    }
    const headingHit = article.tableOfContents.find((item) =>
      item.title.toLowerCase().includes(q),
    );
    if (headingHit) {
      results.push({
        slug: article.slug,
        title: article.title,
        description: article.description,
        href: `${getDocsPath(article.slug)}#${headingHit.id}`,
        match: "heading",
      });
      continue;
    }
    if (article.category.toLowerCase().includes(q)) {
      results.push({
        slug: article.slug,
        title: article.title,
        description: article.description,
        href: getDocsPath(article.slug),
        match: "category",
      });
    }
  }

  return results.slice(0, limit);
}

export type DocsFaqItem = {
  id: string;
  question: string;
  answer: string;
};

export const DOCS_FAQ_ITEMS: DocsFaqItem[] = [
  {
    id: "every-conversation",
    question: "Does Cited monitor every AI conversation?",
    answer:
      "No. Cited monitors the prompts, AI surfaces, schedules, locations, and verified domains you configure. It does not see private ChatGPT, Claude, Gemini, or Perplexity conversations.",
  },
  {
    id: "what-counts-citation",
    question: "What counts as a citation?",
    answer: TERMINOLOGY.citation.short,
  },
  {
    id: "what-counts-mention",
    question: "What counts as a mention?",
    answer: TERMINOLOGY.mention.short,
  },
  {
    id: "guarantee",
    question: "Can Cited guarantee more citations?",
    answer:
      "No. Cited records evidence from monitored results. It does not force AI providers to cite your website or guarantee more citations.",
  },
  {
    id: "supported-surfaces",
    question: "Which AI surfaces are supported?",
    answer:
      "Cited monitors ChatGPT, Gemini, Perplexity, Claude, Google AI Overviews, and Google AI Mode based on your plan. Founder includes ChatGPT and Gemini. Growth adds Perplexity. Pro adds Claude and Google AI surfaces. Cited only shows surfaces enabled for your workspace.",
  },
  {
    id: "results-change",
    question: "Why do results change?",
    answer:
      "AI responses can vary by provider, model, timing, location, and prompt wording. A citation note is a durable record of what Cited observed in a configured monitoring run.",
  },
  {
    id: "competitors",
    question: "Can I monitor competitors?",
    answer:
      "Competitor watch is available on plans that include it. Cited only evaluates competitors you configure, and only within monitored results.",
  },
  {
    id: "export",
    question: "Can I export my evidence?",
    answer:
      "Yes. Authorized members can export citation events, citation notes, notebook entries, and workspace evidence archives from the app, subject to plan and role permissions.",
  },
  {
    id: "cancel",
    question: "What happens if I cancel?",
    answer:
      "You keep access through the end of the current billing period. After cancellation takes effect, monitoring stops and workspace access follows the billing policy for canceled workspaces.",
  },
  {
    id: "replace-seo",
    question: "Does Cited replace SEO software?",
    answer:
      "No. Cited is the signal and evidence layer for monitored AI answers. It does not replace SEO, content, analytics, or technical growth work.",
  },
  {
    id: "learn-domains",
    question: "How does Cited work with Learn Domains?",
    answer:
      "Cited shows where monitored AI answers cite, mention, recommend, or miss your website. Learn Domains can help improve the site, content, structure, and authority work that may earn more citations over time. Cited does not require Learn Domains.",
  },
];

export function getEnabledSurfaceNamesForDocs(): string[] {
  return getEnabledAiSurfaces().map(
    (key) => getAiSurfaceDefinition(key).displayName,
  );
}

export function getPlanLimitRowsForDocs(): {
  plan: string;
  prompts: number;
  surfaces: string;
  emailAlerts: string;
  history: string;
}[] {
  const keys: CheckoutPlanKey[] = ["founder", "growth", "pro", "portfolio"];
  return keys.map((key) => {
    const plan = getPlanRegistryEntry(key);
    const entitlements = getPlanEntitlements(key);
    const surfaces = entitlements.includedAiSurfaces
      .map((surface) => getAiSurfaceDefinition(surface).displayName)
      .join(", ");
    const history =
      entitlements.historyDays === null
        ? "Expanded history"
        : `${entitlements.historyDays}-day history`;
    return {
      plan: plan.name,
      prompts: entitlements.maxPrompts,
      surfaces,
      emailAlerts: "Included",
      history,
    };
  });
}

export function getDocsContactEmail(): string | null {
  return getSupportContactConfig().supportEmail;
}

export { CHANGELOG_ENTRIES, CHANGELOG_INTRO };
