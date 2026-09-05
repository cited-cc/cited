import { getAllBlogArticles } from "@/lib/content/blog";
import {
  DOCS_NAV_GROUPS,
  DOCS_ARTICLES,
  getAllDocsArticles,
  getDocsPath,
} from "@/lib/content/docs";
import { TERMINOLOGY } from "@/lib/content/terminology";
import { PUBLIC_PLAN_LIST } from "@/lib/content/plans";
import { getLatestContentUpdatedDate } from "@/lib/seo/indexable-paths";
import {
  CANONICAL_SITEMAP_PATH,
  ORGANIZATION,
  SITE_DESCRIPTION,
  SITE_DOMAIN,
  SITE_TAGLINE,
  absoluteUrl,
} from "@/lib/seo/site";

const LLM_DISCOVERY_NOTE =
  "llms.txt and ai.txt are emerging conventions for AI discovery and grounding. They do not guarantee inclusion, ranking, or citation in any AI answer.";

function publicPlanLines(): string {
  return PUBLIC_PLAN_LIST.map(
    (plan) => `- ${plan.name}: $${plan.priceMonthly}/month — ${plan.tagline}`,
  ).join("\n");
}

export function buildLlmsTxtBody(): string {
  const blogLinks = getAllBlogArticles()
    .map(
      (article) =>
        `- [${article.title}](${absoluteUrl(article.canonicalPath)})`,
    )
    .join("\n");

  const docsLinks = DOCS_NAV_GROUPS.flatMap((group) =>
    group.slugs.map((slug) => {
      const article = DOCS_ARTICLES[slug];
      if (!article) return "";
      return `- [${article.title}](${absoluteUrl(getDocsPath(slug))})`;
    }),
  )
    .filter(Boolean)
    .join("\n");

  return `# Cited

> Cited is a citation inbox for AI search. It monitors configured prompts across ChatGPT, Gemini, Perplexity, Claude, Google AI Overviews, and Google AI Mode (based on your plan) and preserves evidence when a verified domain is cited, mentioned, recommended, or absent beside configured competitors.

${SITE_TAGLINE}

${SITE_DESCRIPTION}

## Identity

- Name: ${ORGANIZATION.name}
- Domain: ${SITE_DOMAIN}
- Canonical: ${ORGANIZATION.url}
- Category: AI citation monitoring / AI search evidence
- Contact: ${ORGANIZATION.email}

## Core Pages

- [Home](${absoluteUrl("/")})
- [Check a domain](${absoluteUrl("/scan")})
- [Demo](${absoluteUrl("/demo")})
- [Pricing](${absoluteUrl("/pricing")})
- [How it works](${absoluteUrl("/how-it-works")})
- [Docs](${absoluteUrl("/docs")})
- [Blog](${absoluteUrl("/blog")})

## Plans

${publicPlanLines()}

## Product Docs

${docsLinks}

## Blog

${blogLinks}

## Machine-readable exports

- [llms-full.txt](${absoluteUrl("/llms-full.txt")}) (longer Markdown export)
- [ai.txt](${absoluteUrl("/ai.txt")}) (AI agent alias)
- [Blog RSS](${absoluteUrl("/blog/rss.xml")})
- [Sitemap](${absoluteUrl(CANONICAL_SITEMAP_PATH)})

## Important Limitations

Cited monitors configured prompts across ChatGPT, Gemini, Perplexity, Claude, Google AI Overviews, and Google AI Mode based on your plan, plus schedules, locations, and verified domains. Cited does not monitor private AI conversations or every possible AI answer on the internet. AI responses can vary by provider, model, timing, location, and prompt wording. Cited does not guarantee more AI citations, ranking improvements, or inclusion in any AI answer.

${LLM_DISCOVERY_NOTE}

## Legal and trust

- [Terms](${absoluteUrl("/terms")})
- [Privacy](${absoluteUrl("/privacy")})
- [Security](${absoluteUrl("/security")})
- [Contact](${absoluteUrl("/contact")})

## Contact

- ${ORGANIZATION.email}
`;
}

export function buildAiTxtBody(): string {
  return `# Cited (ai.txt)

Canonical LLM map: ${absoluteUrl("/llms.txt")}

${SITE_TAGLINE}

${SITE_DESCRIPTION}

## Quick links

- [Home](${absoluteUrl("/")})
- [Check a domain](${absoluteUrl("/scan")})
- [Pricing](${absoluteUrl("/pricing")})
- [Docs](${absoluteUrl("/docs")})
- [Blog](${absoluteUrl("/blog")})
- [llms.txt](${absoluteUrl("/llms.txt")})
- [llms-full.txt](${absoluteUrl("/llms-full.txt")})
- [Blog RSS](${absoluteUrl("/blog/rss.xml")})
- [Sitemap](${absoluteUrl(CANONICAL_SITEMAP_PATH)})

## Contact

- ${ORGANIZATION.email}

${LLM_DISCOVERY_NOTE}
`;
}

export function buildLlmsFullTxtBody(): string {
  const generatedAt = getLatestContentUpdatedDate();

  const blogSections = getAllBlogArticles()
    .map((article) => {
      return `### ${article.title}

URL: ${absoluteUrl(article.canonicalPath)}

${article.markdown.trim()}
`;
    })
    .join("\n");

  const docsSections = getAllDocsArticles()
    .map((article) => {
      return `### ${article.title}

URL: ${absoluteUrl(getDocsPath(article.slug))}

${article.description}

Last updated: ${article.lastUpdated}
`;
    })
    .join("\n");

  return `# Cited: Full LLM Context

Generated: ${generatedAt}

## Product Summary

${SITE_TAGLINE}

Cited is a citation inbox for AI search. It monitors configured prompts across ChatGPT, Gemini, Perplexity, Claude, Google AI Overviews, and Google AI Mode (based on your plan) and preserves evidence when a verified domain is cited, mentioned, recommended, or absent beside configured competitors.

${SITE_DESCRIPTION}

Cited is the evidence layer. Learn Domains is the action layer for site and content work that may improve future visibility.

## What Cited Does

- Monitor the prompts, locations, and AI surfaces you choose (ChatGPT, Gemini, Perplexity, Claude by plan)
- Record when a verified domain appears as a cited source, mention, recommendation, or missed opportunity
- Preserve prompt, response evidence, source, and first-seen history in a focused inbox
- Alert via email when meaningful evidence appears
- Export citation evidence for records and internal reports

## What Cited Does Not Do

- See every AI conversation in the world
- Monitor private AI chats
- Guarantee more AI citations or ranking improvements
- Control AI provider answers
- Replace a full SEO suite, content generator, site crawler, or analytics warehouse
- Guarantee uptime, alert delivery, or third-party provider availability

## Core Concepts

### Citation

${TERMINOLOGY.citation.short}

### Mention

${TERMINOLOGY.mention.short}

### Recommendation

${TERMINOLOGY.recommendation.short}

### Competitor Citation

${TERMINOLOGY.competitor_citation.short}

### Missed Opportunity

${TERMINOLOGY.missed_opportunity.short}

### Occurrence

${TERMINOLOGY.occurrence.short}

### Citation Evidence

${TERMINOLOGY.citation_evidence.short}

## Product Pages

### Home

URL: ${absoluteUrl("/")}

Cited homepage. Product promise, evidence preview, and entry points to scan, demo, pricing, and docs.

### Check a Domain

URL: ${absoluteUrl("/scan")}

Free citation check entry point. Tell Cited which domain you want to check and prepare a focused citation snapshot across supported AI surfaces.

### Demo

URL: ${absoluteUrl("/demo")}

Interactive fictional demo workspace showing the citation inbox, evidence notes, and alerts without creating an account.

### Pricing

URL: ${absoluteUrl("/pricing")}

Public plans for Founder $19, Growth $29, Pro $49, and Portfolio $199 per month.

${publicPlanLines()}

### How it works

URL: ${absoluteUrl("/how-it-works")}

Explains the monitoring workflow: prompts, surfaces, evidence notes, inbox, and alerts.

### Blog

URL: ${absoluteUrl("/blog")}

Research archive for AI citation evidence, AI search citations, and LLM visibility field notes.

### Docs

URL: ${absoluteUrl("/docs")}

Product documentation for setup, terminology, monitoring scope, alerts, billing, and exports.

## Documentation

${docsSections}

## Blog Articles

${blogSections}

## Limitations

Cited monitors configured prompts across ChatGPT, Gemini, Perplexity, Claude, Google AI Overviews, and Google AI Mode based on your plan, plus schedules, locations, and verified domains. Cited does not monitor private AI conversations or every possible AI answer on the internet. AI responses can vary by provider, model, timing, location, and prompt wording.

These LLM files help AI systems find and interpret Cited's public content. They do not guarantee inclusion, ranking, or citation in any AI answer.

llms.txt, ai.txt, and llms-full.txt are public, curated context files. They exclude private workspace data, customer evidence, API keys, and internal architecture secrets.

## Related Files

- [llms.txt](${absoluteUrl("/llms.txt")})
- [ai.txt](${absoluteUrl("/ai.txt")})
- [LLM Docs](${absoluteUrl("/docs/llms")})
- [Blog RSS](${absoluteUrl("/blog/rss.xml")})
- [Sitemap](${absoluteUrl(CANONICAL_SITEMAP_PATH)})
`;
}
