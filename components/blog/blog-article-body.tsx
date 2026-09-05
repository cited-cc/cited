import {
  ArticleFooterCta,
  BlogAuditTable,
  BlogCtaCard,
  BlogDefinitionCard,
  BlogDoDontTable,
  BlogFaqList,
  BlogTextLink,
  EvidenceExampleCard,
  InlineProductNote,
  SourceSlipExample,
} from "@/components/blog/blog-cta";
import { BlogRelatedArticles } from "@/components/blog/blog-card";
import { getBlogArticle, getRelatedBlogArticles, type BlogSlug } from "@/lib/content/blog";

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-24 type-title pt-4">
      {children}
    </h2>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="type-body text-cited-ink-muted">{children}</p>;
}

function Ul({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="my-4 list-disc space-y-2 pl-5 type-body-sm text-cited-ink-muted">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

function Ol({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="my-4 list-decimal space-y-2 pl-5 type-body-sm text-cited-ink-muted">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ol>
  );
}

export function BlogArticleBody({ slug }: { slug: BlogSlug }) {
  switch (slug) {
    case "how-to-know-if-chatgpt-cites-your-website":
      return <HowToKnowBody />;
    case "ai-citation-monitoring":
      return <AiCitationMonitoringBody />;
    case "llm-visibility-audit":
      return <LlmVisibilityAuditBody />;
    case "is-my-brand-cited-in-chatgpt":
      return <IsMyBrandCitedBody />;
    case "how-to-check-if-perplexity-cites-your-website":
      return <HowToCheckPerplexityBody />;
    case "are-you-showing-up-in-google-ai-overviews":
      return <GoogleAiOverviewsBody />;
    case "geo-vs-seo-what-citation-evidence-actually-is":
      return <GeoVsSeoBody />;
    case "ai-citation-checker":
      return <AiCitationCheckerBody />;
    default: {
      const _exhaustive: never = slug;
      return <P>Unknown article: {String(_exhaustive)}</P>;
    }
  }
}

function ArticleFaq({ slug }: { slug: BlogSlug }) {
  const article = getBlogArticle(slug);
  if (!article) return null;
  return <BlogFaqList items={article.faq} />;
}

export function BlogArticleFooter({ slug }: { slug: BlogSlug }) {
  const related = getRelatedBlogArticles(slug);
  return (
    <>
      <ArticleFooterCta />
      <BlogRelatedArticles articles={related} />
    </>
  );
}

function HowToKnowBody() {
  return (
    <>
      <P>
        AI answers are becoming a discovery layer. The problem is not that
        citations are impossible to find. The problem is that most teams have no
        system for checking the questions that matter and preserving the
        evidence.
      </P>
      <P>
        If you are asking how to know whether ChatGPT cites your website, you
        are already past the vague curiosity stage. You want a receipt.
      </P>

      <H2 id="short-answer">The short answer</H2>
      <P>
        You cannot see every private ChatGPT conversation. You can monitor
        selected buyer-like prompts across supported AI-search surfaces and look
        for source citations, linked references, brand mentions, and
        recommendations.
      </P>
      <P>
        That is the practical boundary. Private chats stay private. Configured
        checks become evidence. If you want the product version of that
        workflow,{" "}
        <BlogTextLink href="/scan">check your domain</BlogTextLink> with Cited.
      </P>

      <H2 id="what-counts">What counts as a ChatGPT citation?</H2>
      <BlogDefinitionCard
        term="Citation"
        definition="A monitored answer includes your verified domain as a source or linked reference."
      />
      <BlogDefinitionCard
        term="Mention"
        definition="A monitored answer names your brand or product without an attributable source link to your verified domain."
      />
      <BlogDefinitionCard
        term="Recommendation"
        definition="A monitored answer explicitly recommends your product, brand, or domain."
      />
      <BlogDefinitionCard
        term="Non-citation"
        definition="The answer does not cite, mention, or recommend you in a way you can attribute to your verified domain."
      />
      <P>
        These distinctions matter. A brand shout-out without a source link is
        useful signal, but it is not the same as a citation. See{" "}
        <BlogTextLink href="/docs/citations-vs-mentions">
          citations vs mentions
        </BlogTextLink>{" "}
        for the full terminology.
      </P>

      <H2 id="what-you-cannot-know">What you cannot know</H2>
      <Ul
        items={[
          "Private ChatGPT conversations you were never part of.",
          "Every possible wording of every possible prompt.",
          "A single permanent ranking across all AI providers.",
          "Whether an answer will look identical tomorrow.",
        ]}
      />
      <P>
        Answers vary by provider, model, timing, location, and prompt wording.
        That variability is why one screenshot is not a monitoring system.
      </P>

      <H2 id="what-you-can-monitor">What you can monitor</H2>
      <Ul
        items={[
          "Buyer-like prompts you choose on purpose.",
          "Supported AI-search surfaces enabled in the product.",
          "Verified domains and brand aliases you control.",
          "Competitor domains you configure for comparison.",
          "Scheduled checks that create occurrence history over time.",
        ]}
      />
      <P>
        Cited only monitors what you configure. Read{" "}
        <BlogTextLink href="/docs/what-cited-monitors">
          what Cited monitors
        </BlogTextLink>{" "}
        and{" "}
        <BlogTextLink href="/docs/monitored-prompts">
          monitored prompts
        </BlogTextLink>{" "}
        if you want the product boundaries in plain language.
      </P>

      <H2 id="manual-way">The manual way to check</H2>
      <Ol
        items={[
          "Choose buyer-like prompts that map to real purchase or research intent.",
          "Run the same prompt in supported AI surfaces.",
          "Record the answer before it disappears into scroll history.",
          "Check source links for your verified domain.",
          "Look for brand mentions without source links.",
          "Repeat over time so you can see first seen versus last observed.",
          "Compare against competitors on the same prompts.",
        ]}
      />
      <BlogDoDontTable
        rows={[
          {
            do: "Use the same prompt wording across checks.",
            dont: "Change the prompt every time and pretend the results are comparable.",
          },
          {
            do: "Save prompt, surface, timestamp, and source URL together.",
            dont: "Keep a folder of unlabeled screenshots.",
          },
          {
            do: "Separate citations from mentions.",
            dont: "Treat every brand name as a citation.",
          },
        ]}
      />

      <H2 id="manual-breaks">Why manual tracking breaks</H2>
      <P>
        Manual tracking fails for boring reasons. Screenshots lose context.
        Spreadsheets go stale. Nobody owns the cadence. There is no alerting, no
        dedupe, no shared inbox, and no clean history when a teammate asks what
        changed last week.
      </P>
      <P>
        A screenshot is not a monitoring system. It is a moment. Useful once.
        Fragile forever.
      </P>

      <H2 id="citation-note">What a citation note should preserve</H2>
      <Ul
        items={[
          "Prompt",
          "Surface",
          "Timestamp",
          "Cited URL",
          "Evidence excerpt",
          "Source title",
          "First seen",
          "Last observed",
          "Occurrence history",
        ]}
      />
      <P>
        If a record cannot answer those fields, it is not ready for a team
        workflow. It is a souvenir.
      </P>

      <H2 id="how-cited-solves">How Cited solves this</H2>
      <P>
        Cited is the citation inbox for AI search. You add a domain, choose
        prompts, monitor supported surfaces, and let Cited classify citations,
        mentions, recommendations, and missed opportunities into durable notes.
      </P>
      <Ul
        items={[
          "Add and verify a domain.",
          "Choose the prompts that matter.",
          "Monitor supported AI-search surfaces on a schedule.",
          "Review a clean evidence inbox.",
          "Get alerts by email when something meaningful appears.",
          "Export or share the record when you need proof.",
        ]}
      />
      <InlineProductNote>
        Cited is the evidence layer.{" "}
        <BlogTextLink href="/docs/learn-domains-handoff">
          Learn Domains
        </BlogTextLink>{" "}
        is the action layer for site and content work that may improve future
        visibility. Cited does not guarantee more citations.
      </InlineProductNote>
      <BlogCtaCard
        variant="custom"
        title="Want the receipt?"
        body="Cited monitors the prompts you choose and saves the evidence when AI answers cite, mention, recommend, or miss your website."
        buttonLabel="Check a domain"
        href="/scan"
      />
      <P>
        Prefer a walkthrough first?{" "}
        <BlogTextLink href="/demo">See a demo citation inbox</BlogTextLink>.
        Ready to compare plans?{" "}
        <BlogTextLink href="/pricing">View Cited pricing</BlogTextLink>. Alerts
        are covered in{" "}
        <BlogTextLink href="/docs/alerts-and-digests">
          alerts and digests
        </BlogTextLink>
        .
      </P>

      <H2 id="example">Example citation note</H2>
      <SourceSlipExample
        prompt="best tools to monitor AI citations"
        evidence="A verified domain appeared as a cited source in the monitored result."
      />
      <EvidenceExampleCard
        title="Citation found on a monitored buyer prompt"
        badge="CITATION"
        meta="Example"
      >
        <p>
          Prompt, surface, source URL, evidence excerpt, and occurrence history
          stored as one note. Fictional example for illustration. Not a live
          scan result.
        </p>
      </EvidenceExampleCard>

      <H2 id="faq">FAQ</H2>
      <ArticleFaq slug="how-to-know-if-chatgpt-cites-your-website" />

      <H2 id="conclusion">Evidence beats guessing</H2>
      <P>
        Start with your most important buyer prompts. Check whether selected AI
        answers cite your website. Preserve the evidence. Then decide what to
        fix.
      </P>
      <P>
        If you want the category definition next, read{" "}
        <BlogTextLink href="/blog/ai-citation-monitoring">
          what AI citation monitoring is
        </BlogTextLink>
        . If you want a repeatable workflow, use the{" "}
        <BlogTextLink href="/blog/llm-visibility-audit">
          LLM visibility audit
        </BlogTextLink>
        .
      </P>
      <BlogCtaCard variant="scan" />
    </>
  );
}

function AiCitationMonitoringBody() {
  return (
    <>
      <P>
        AI search is changing discovery. Traditional analytics tell you what
        happened after someone clicked.{" "}
        <strong className="font-medium text-cited-ink">
          AI citation monitoring
        </strong>{" "}
        helps you understand whether selected AI answers are citing you before
        the click ever happens.
      </P>
      <P>
        AI citation monitoring is not magic SEO. It is an evidence workflow for
        selected AI answers.
      </P>

      <H2 id="definition">The definition</H2>
      <P>
        AI citation monitoring is the practice of checking selected AI-search
        prompts and preserving evidence when a website is cited, mentioned,
        recommended, or absent beside competitors.
      </P>
      <P>
        Cited’s role inside that category is narrow on purpose: monitor
        configured prompts across supported AI search surfaces and turn
        citations, mentions, recommendations, and missed opportunities into a
        clean evidence inbox.
      </P>

      <H2 id="why-it-matters">Why it matters now</H2>
      <Ul
        items={[
          "AI answers act as discovery surfaces before a click happens.",
          "Source trust shapes shortlists and recommendations.",
          "Buyer research often starts with a prompt, not a homepage visit.",
          "Zero-click discovery means the citation itself can matter.",
          "Without evidence, teams argue from vibes instead of records.",
        ]}
      />

      <H2 id="what-it-tracks">What AI citation monitoring tracks</H2>
      <Ul
        items={[
          "Citations to your verified domain",
          "Brand or product mentions without source links",
          "Explicit recommendations",
          "Competitor citations on the same prompts",
          "Missed opportunities where a competitor is cited and you are absent",
          "Occurrences over time for the same event",
        ]}
      />

      <H2 id="what-it-does-not">What it does not track</H2>
      <Ul
        items={[
          "Every AI conversation in the world",
          "Private chats",
          "Every possible prompt wording",
          "Guaranteed visibility or ranking",
          "Traffic attribution by itself",
        ]}
      />
      <P>
        Those limits are features of honesty, not missing checkboxes. See{" "}
        <BlogTextLink href="/docs/what-cited-monitors">
          what Cited monitors
        </BlogTextLink>
        .
      </P>

      <H2 id="vs-seo">Citation monitoring vs SEO analytics</H2>
      <BlogDoDontTable
        rows={[
          {
            do: "Use SEO analytics for rankings, traffic, clicks, backlinks, and technical issues.",
            dont: "Expect SEO analytics alone to show AI answer source inclusion.",
          },
          {
            do: "Use citation monitoring for AI answer evidence and prompt-level history.",
            dont: "Treat citation monitoring as a full SEO suite replacement.",
          },
        ]}
      />
      <P>
        Cited does not replace Google Search Console. It sits beside it as the
        evidence layer for monitored AI answers.
      </P>

      <H2 id="anatomy">Anatomy of a good system</H2>
      <Ol
        items={[
          "Verified domains so attribution is grounded.",
          "A prompt library built around buyer intent.",
          "Supported surfaces that are actually enabled in product.",
          "Evidence snapshots you can reopen later.",
          "Deterministic classification of citations, mentions, and misses.",
          "Alerts when something meaningful appears.",
          "Exportable records for teams and reports.",
          "Clear limitations written in public.",
        ]}
      />

      <H2 id="screenshots">Why screenshots are not enough</H2>
      <P>
        Screenshots are fragile. They lose metadata. They do not dedupe. They do
        not alert. They do not create occurrence history. Evidence systems need
        structured records.
      </P>

      <H2 id="how-cited">How Cited approaches AI citation monitoring</H2>
      <P>
        Cited starts with domain verification, selected prompts, and supported
        AI-search surfaces. Monitoring runs produce evidence notes. Those notes
        land in an inbox. Alerts and digests keep the signal visible. Notebook
        and exports keep the record useful.
      </P>
      <InlineProductNote>
        Cited uses product data providers for supported monitoring paths. The
        customer-facing promise stays simple: configured prompts, supported
        surfaces, preserved evidence. No claim that every AI conversation is
        visible.
      </InlineProductNote>
      <BlogCtaCard
        variant="custom"
        title="Start with the prompts that matter."
        body="Cited gives you a clean citation inbox for selected AI-search checks."
        buttonLabel="Run a free scan"
        href="/scan"
      />
      <P>
        Want the inbox without setup?{" "}
        <BlogTextLink href="/demo">See the demo</BlogTextLink>. Want plan
        details?{" "}
        <BlogTextLink href="/pricing">Compare Cited plans</BlogTextLink>. For
        alert setup, read{" "}
        <BlogTextLink href="/docs/alerts-and-digests">
          alerts and digests
        </BlogTextLink>
        .
      </P>

      <H2 id="who-needs">Who needs AI citation monitoring?</H2>
      <Ul
        items={[
          "Founders who need proof, not folklore",
          "SEO leads expanding beyond classic SERP work",
          "Content teams shipping pages meant to be cited",
          "SaaS marketers watching category prompts",
          "Agencies running AI visibility audits for clients",
          "Category creators defending a new term",
          "Any team with high-intent buyer prompts worth monitoring",
        ]}
      />

      <H2 id="workflow">Example workflow</H2>
      <Ol
        items={[
          "Add one domain.",
          "Add about 10 buyer prompts.",
          "Monitor supported surfaces.",
          "Review the citation inbox weekly.",
          "Save notes that matter.",
          "Route missed opportunities into content or site work.",
        ]}
      />
      <P>
        For a fuller audit checklist, use the{" "}
        <BlogTextLink href="/blog/llm-visibility-audit">
          LLM visibility audit
        </BlogTextLink>
        . For the ChatGPT-specific question, read{" "}
        <BlogTextLink href="/blog/how-to-know-if-chatgpt-cites-your-website">
          how to know if ChatGPT cites your website
        </BlogTextLink>
        .
      </P>

      <H2 id="faq">FAQ</H2>
      <ArticleFaq slug="ai-citation-monitoring" />

      <H2 id="conclusion">Preserve the evidence</H2>
      <P>
        The first step is not guessing how AI sees you. The first step is
        preserving evidence from the prompts that matter.
      </P>
      <BlogCtaCard variant="scan" />
    </>
  );
}

function LlmVisibilityAuditBody() {
  return (
    <>
      <P>
        Most LLM visibility audits are too vague. They ask a few prompts, take
        screenshots, and call it strategy. A better audit preserves evidence.
      </P>
      <P>
        An LLM visibility audit should not be a vibes report. It should be a
        repeatable evidence workflow.
      </P>

      <H2 id="what-it-is">What an LLM visibility audit is</H2>
      <P>
        An LLM visibility audit is a structured review of selected AI-search
        prompts to see whether your brand or domain appears, gets cited, gets
        recommended, or is absent beside competitors.
      </P>
      <P>
        It sits inside{" "}
        <BlogTextLink href="/blog/ai-citation-monitoring">
          AI citation monitoring
        </BlogTextLink>
        . The audit is the method. Monitoring is how the method stays current.
      </P>

      <H2 id="what-it-answers">What a good audit should answer</H2>
      <Ul
        items={[
          "Are we cited?",
          "Are we mentioned?",
          "Are competitors cited instead?",
          "Which prompts matter?",
          "Which pages are cited?",
          "Which topics are missing?",
          "What evidence should we preserve?",
        ]}
      />

      <H2 id="step-1">Step 1: Choose buyer-like prompts</H2>
      <P>Start with prompts that sound like real research, not vanity queries.</P>
      <Ul
        items={[
          "best [category] software for [audience]",
          "how to solve [problem]",
          "alternatives to [competitor]",
          "tools for [job]",
          "what is [brand]",
          "who should I use for [job]",
        ]}
      />
      <P>
        Keep the set focused. Eight to fifteen strong prompts beat fifty vague
        ones. Guidance on prompt design lives in{" "}
        <BlogTextLink href="/docs/monitored-prompts">
          monitored prompts
        </BlogTextLink>
        .
      </P>

      <H2 id="step-2">Step 2: Define the surfaces</H2>
      <P>
        Decide which supported AI-search surfaces you will check. Do not
        overpromise providers that are not enabled in your product config.
        Answers can vary by surface, so treat each surface as its own evidence
        lane.
      </P>

      <H2 id="step-3">Step 3: Verify the domain and aliases</H2>
      <P>
        Domain verification keeps attribution honest. Brand aliases help catch
        mentions that do not include a clean source link. Without verification,
        you are guessing which domain the answer meant.
      </P>
      <P>
        Cited’s setup path is documented under{" "}
        <BlogTextLink href="/docs/domain-verification">
          domain verification
        </BlogTextLink>
        .
      </P>

      <H2 id="step-4">Step 4: Record citation evidence</H2>
      <Ul
        items={[
          "Prompt",
          "Answer snapshot",
          "Source URL",
          "Timestamp",
          "Surface",
          "Location",
          "First seen",
          "Last observed",
        ]}
      />
      <SourceSlipExample
        prompt="best AI citation monitoring tools for SaaS marketers"
        evidence="A verified domain appeared as a cited source beside two competitor domains in the monitored result."
      />

      <H2 id="step-5">Step 5: Separate citations from mentions</H2>
      <P>
        A citation includes your verified domain as a source or linked
        reference. A mention names the brand without that attributable link.
        Mixing them inflates the report and confuses the next action. Use{" "}
        <BlogTextLink href="/docs/citations-vs-mentions">
          citations vs mentions
        </BlogTextLink>{" "}
        as the shared vocabulary.
      </P>

      <H2 id="step-6">Step 6: Identify missed opportunities</H2>
      <P>
        A missed opportunity is simple: a relevant monitored answer cites a
        configured competitor while your verified domain is absent. That is the
        signal worth routing into content or site work.
      </P>

      <H2 id="step-7">Step 7: Repeat the audit</H2>
      <P>
        One-off audits become stale. Monitoring creates history. First seen and
        last observed matter more than a single lucky screenshot.
      </P>

      <H2 id="step-8">Step 8: Turn evidence into action</H2>
      <P>
        Cited shows the signal. Learn Domains or internal content work can help
        improve pages, internal links, and topical authority. The evidence layer
        and the action layer are different jobs. Keep them that way.
      </P>
      <InlineProductNote>
        Cited does not guarantee future visibility. It preserves evidence from
        monitored checks so your team can act with a record instead of a guess.
      </InlineProductNote>

      <H2 id="template">Manual audit template</H2>
      <BlogAuditTable
        rows={[
          {
            prompt: "best tools for AI citation monitoring",
            surface: "Supported surface",
            cited: "Yes / No",
            mentioned: "Yes / No",
            competitor: "Yes / No",
            evidence: "URL or note ID",
            notes: "What appeared",
            next: "Content / site / watch",
          },
          {
            prompt: "alternatives to [competitor]",
            surface: "Supported surface",
            cited: "Yes / No",
            mentioned: "Yes / No",
            competitor: "Yes / No",
            evidence: "URL or note ID",
            notes: "Who got cited",
            next: "Compare pages",
          },
          {
            prompt: "what is [brand]",
            surface: "Supported surface",
            cited: "Yes / No",
            mentioned: "Yes / No",
            competitor: "Yes / No",
            evidence: "URL or note ID",
            notes: "Brand accuracy",
            next: "Clarify source pages",
          },
        ]}
      />

      <H2 id="how-cited">How Cited makes this repeatable</H2>
      <Ul
        items={[
          "Prompt monitoring on a schedule you choose",
          "Evidence inbox instead of screenshot folders",
          "Occurrence history for the same event",
          "Alerts and digests when something changes",
          "Notebook for annotations",
          "Exports for reports and handoffs",
        ]}
      />
      <BlogCtaCard
        variant="custom"
        title="Run the audit with evidence."
        body="Cited turns selected AI-search checks into citation notes you can revisit, annotate, and export."
        buttonLabel="Check a domain"
        href="/scan"
      />
      <P>
        See the inbox shape in the{" "}
        <BlogTextLink href="/demo">demo</BlogTextLink>, compare{" "}
        <BlogTextLink href="/pricing">plans</BlogTextLink>, or read{" "}
        <BlogTextLink href="/docs/what-cited-monitors">
          what Cited monitors
        </BlogTextLink>{" "}
        and{" "}
        <BlogTextLink href="/docs/alerts-and-digests">
          alerts and digests
        </BlogTextLink>
        . For the ChatGPT-specific check, use{" "}
        <BlogTextLink href="/blog/how-to-know-if-chatgpt-cites-your-website">
          how to know if ChatGPT cites your website
        </BlogTextLink>
        .
      </P>

      <H2 id="faq">FAQ</H2>
      <ArticleFaq slug="llm-visibility-audit" />

      <H2 id="conclusion">A useful audit is a record</H2>
      <P>
        A useful audit is not a screenshot. It is a record. Run the first check.
        Keep the evidence. Repeat on purpose.
      </P>
      <BlogCtaCard variant="scan" />
    </>
  );
}

function IsMyBrandCitedBody() {
  return (
    <>
      <P>
        This is the decision page, not the method page. If you want the
        step-by-step check, use{" "}
        <BlogTextLink href="/blog/how-to-know-if-chatgpt-cites-your-website">
          how to know if ChatGPT cites your website
        </BlogTextLink>
        . If you want to know what a yes, a no, and a maybe actually mean, stay
        here.
      </P>
      <P>
        The useful question is not “does ChatGPT know us?” The useful question
        is whether selected ChatGPT answers treat your website as a source.
      </P>

      <H2 id="the-decision">The decision in front of you</H2>
      <P>
        You are not asking for a ranking. You are asking for a receipt on the
        prompts that sound like buyer research. That question has a bounded
        answer. It does not have a global one.
      </P>
      <P>
        You cannot see every private ChatGPT conversation. You can check the
        prompts that matter and keep the evidence. If you want the product
        version of that snapshot,{" "}
        <BlogTextLink href="/scan">check your domain</BlogTextLink>.
      </P>

      <H2 id="what-cited-means">What cited means here</H2>
      <BlogDefinitionCard
        term="Citation"
        definition="A monitored answer includes your verified domain as a source or linked reference."
      />
      <BlogDefinitionCard
        term="Mention"
        definition="A monitored answer names your brand or product without an attributable source link to your verified domain."
      />
      <BlogDefinitionCard
        term="Recommendation"
        definition="A monitored answer explicitly recommends your product, brand, or domain."
      />
      <BlogDefinitionCard
        term="Miss"
        definition="A relevant monitored answer cites a configured competitor while your verified domain is absent."
      />
      <P>
        Naming is not citing. A compliment without a source link is still a
        mention. The shared vocabulary lives in{" "}
        <BlogTextLink href="/docs/citations-vs-mentions">
          citations vs mentions
        </BlogTextLink>
        .
      </P>

      <H2 id="what-yes-looks-like">What a yes looks like</H2>
      <P>
        A yes is specific. A monitored ChatGPT answer includes your verified
        domain as a source. The useful record keeps the prompt, the surface, the
        timestamp, the cited URL, and an excerpt you can reopen.
      </P>
      <P>
        A yes on one prompt is not a yes on every prompt. Treat it as evidence
        for that check, not a brand-wide score.
      </P>
      <SourceSlipExample
        prompt="best tools to monitor AI citations"
        evidence="A verified domain appeared as a cited source in the monitored ChatGPT result."
      />

      <H2 id="what-no-looks-like">What a no looks like</H2>
      <P>
        A no is also useful. The monitored answer does not cite, mention, or
        recommend your verified domain. If a competitor is cited instead, that
        is a missed opportunity, not a ranking.
      </P>
      <P>
        Absence is evidence. It is not a verdict on your whole business. A
        repeatable{" "}
        <BlogTextLink href="/blog/llm-visibility-audit">
          LLM visibility audit
        </BlogTextLink>{" "}
        is how you keep that absence from becoming folklore.
      </P>

      <H2 id="mentions-and-recs">Mentions and recommendations</H2>
      <P>
        Mentions tell you the model knows the name. Recommendations tell you the
        model is willing to suggest you. Neither replaces a citation. Keep them
        in separate columns so the next action stays honest.
      </P>
      <BlogDoDontTable
        rows={[
          {
            do: "Treat a source link to your verified domain as a citation.",
            dont: "Count every brand name as proof you were cited.",
          },
          {
            do: "Record the prompt and surface next to the yes or no.",
            dont: "Ask ChatGPT once and remember the vibe.",
          },
          {
            do: "Compare the same wording later.",
            dont: "Change the prompt and pretend the results are comparable.",
          },
        ]}
      />

      <H2 id="claude-gemini">Claude and Gemini, briefly</H2>
      <P>
        The same prompt can produce a citation on ChatGPT, a mention on Gemini,
        and silence on Claude. Do not collapse those surfaces into one score.
        Founder monitoring covers ChatGPT and Gemini. Claude is available on
        Pro and Portfolio. A free check can include supported surfaces as a
        snapshot.
      </P>
      <P>
        If you need the method, stay with the{" "}
        <BlogTextLink href="/blog/how-to-know-if-chatgpt-cites-your-website">
          ChatGPT how-to
        </BlogTextLink>
        . Separate Claude or Gemini posts would repeat that method. The
        decision is the same: selected prompts, attributable sources, preserved
        evidence.
      </P>

      <H2 id="free-check">What a free check can tell you</H2>
      <P>
        A free check is a snapshot. You choose a domain and a small set of
        prompts. Cited checks supported surfaces and preserves evidence when
        your site appears. It does not watch those prompts next week.
      </P>
      <Ul
        items={[
          "Private result link",
          "The prompts you chose",
          "An evidence note when the snapshot is ready",
          "A clear path to ongoing monitoring",
        ]}
      />
      <InlineProductNote>
        Free checks use selected prompts and supported surfaces. Results vary by
        provider, location, timing, and prompt wording. Cited does not see
        private chats and does not guarantee more citations.
      </InlineProductNote>
      <BlogCtaCard
        variant="custom"
        title="Want a clear yes or no?"
        body="Run a free citation check on the prompts that matter. Then decide whether those prompts deserve a schedule."
        buttonLabel="Check a domain"
        href="/scan"
      />

      <H2 id="next-step">When monitoring is the next step</H2>
      <P>
        Monitor when the prompts matter enough to revisit. Monitoring adds a
        schedule, a citation inbox, alerts, and history. That workflow is
        described on{" "}
        <BlogTextLink href="/how-it-works">how it works</BlogTextLink>. Plans
        start at $19/month on{" "}
        <BlogTextLink href="/pricing">pricing</BlogTextLink>.
      </P>
      <P>
        Cited is the evidence layer. It does not force ChatGPT to cite your
        website. If you want the category definition, read{" "}
        <BlogTextLink href="/blog/ai-citation-monitoring">
          what AI citation monitoring is
        </BlogTextLink>
        .
      </P>

      <H2 id="faq">FAQ</H2>
      <ArticleFaq slug="is-my-brand-cited-in-chatgpt" />

      <H2 id="conclusion">Get the receipt, then decide</H2>
      <P>
        A brand citation in ChatGPT is not a feeling. It is a source link you
        can attribute to a verified domain on a prompt you chose. Get the
        receipt. Then decide whether the prompts deserve monitoring.
      </P>
      <BlogCtaCard variant="scan" />
    </>
  );
}

function HowToCheckPerplexityBody() {
  return (
    <>
      <P>
        Perplexity makes sources visible. That does not make the check
        automatic. You still need a prompt list, a repeatable method, and a
        place to keep the evidence.
      </P>
      <P>
        A ChatGPT result does not stand in for a Perplexity result. Keep the
        surfaces separate.
      </P>

      <H2 id="short-answer">The short answer</H2>
      <P>
        Ask buyer-like prompts on Perplexity. Inspect the sources and the
        prose. If your verified domain appears as a source or linked reference,
        that is citation evidence. If only the brand name appears, that is a
        mention. If a competitor is sourced and you are not, that is a missed
        opportunity.
      </P>
      <P>
        You cannot see every private Perplexity thread. You can monitor selected
        prompts. If you want the product snapshot,{" "}
        <BlogTextLink href="/scan">check your domain</BlogTextLink>.
      </P>

      <H2 id="why-perplexity">Why Perplexity is worth a separate check</H2>
      <P>
        Perplexity is built around cited answers. Buyers who live there are
        already looking at source lists. That makes a missing source more
        obvious, and a present source more useful as a receipt.
      </P>
      <P>
        It also makes sloppy tracking more tempting. A screenshot of the source
        rail is still a moment.{" "}
        <BlogTextLink href="/blog/ai-citation-monitoring">
          AI citation monitoring
        </BlogTextLink>{" "}
        is how that moment becomes a record.
      </P>

      <H2 id="what-counts">What counts as a Perplexity citation</H2>
      <BlogDefinitionCard
        term="Citation"
        definition="Your verified domain appears as a source or linked reference in the monitored Perplexity answer."
      />
      <BlogDefinitionCard
        term="Mention"
        definition="The answer names your brand without an attributable source link to your verified domain."
      />
      <BlogDefinitionCard
        term="Recommendation"
        definition="The answer explicitly recommends your product, brand, or domain."
      />
      <BlogDefinitionCard
        term="Miss"
        definition="A configured competitor is sourced and your verified domain is absent."
      />
      <P>
        See{" "}
        <BlogTextLink href="/docs/citations-vs-mentions">
          citations vs mentions
        </BlogTextLink>{" "}
        if you need the same labels across surfaces.
      </P>

      <H2 id="manual-check">The manual way to check</H2>
      <Ol
        items={[
          "Choose buyer-like prompts that map to real research intent.",
          "Run the same wording in Perplexity.",
          "Capture the answer and the source list before they change.",
          "Check each source URL against your verified domain.",
          "Separate mentions from citations.",
          "Repeat later with the same wording.",
        ]}
      />
      <BlogDoDontTable
        rows={[
          {
            do: "Compare the source list to your verified domain.",
            dont: "Assume a brand mention in the prose is a citation.",
          },
          {
            do: "Save prompt, timestamp, and source URLs together.",
            dont: "Keep an unlabeled screenshot of the source rail.",
          },
          {
            do: "Treat Perplexity as its own evidence lane.",
            dont: "Reuse a ChatGPT check as a Perplexity result.",
          },
        ]}
      />

      <H2 id="what-to-record">What to record</H2>
      <Ul
        items={[
          "Prompt",
          "Surface",
          "Timestamp",
          "Cited URL",
          "Evidence excerpt",
          "Source title",
          "First seen",
          "Last observed",
        ]}
      />
      <SourceSlipExample
        prompt="best tools for AI citation monitoring"
        surface="Perplexity"
        evidence="A verified domain appeared in the source list of the monitored Perplexity answer."
      />

      <H2 id="one-off">Why a one-off check is incomplete</H2>
      <P>
        Source lists move. A screenshot from Tuesday does not answer Friday.
        Without a schedule you are collecting souvenirs. A useful{" "}
        <BlogTextLink href="/blog/llm-visibility-audit">
          LLM visibility audit
        </BlogTextLink>{" "}
        repeats the same prompts on purpose.
      </P>

      <H2 id="how-cited">How Cited monitors Perplexity</H2>
      <P>
        Cited is the evidence inbox. On plans that include Perplexity, you add a
        verified domain, choose prompts, and let scheduled checks classify
        citations, mentions, recommendations, and misses. The workflow is on{" "}
        <BlogTextLink href="/how-it-works">how it works</BlogTextLink>.
      </P>
      <Ul
        items={[
          "Verify the domain you want attributed.",
          "Choose the buyer prompts worth repeating.",
          "Monitor Perplexity on a schedule your plan includes.",
          "Review the citation inbox instead of a screenshot folder.",
          "Get alerts when meaningful evidence appears.",
        ]}
      />
      <InlineProductNote>
        Cited does not control Perplexity&apos;s retrieval. It does not
        guarantee more citations. It preserves evidence from the prompts you
        configure.
      </InlineProductNote>
      <BlogCtaCard
        variant="custom"
        title="Check Perplexity with a receipt."
        body="Start with a free snapshot, then keep the prompts that matter on a schedule."
        buttonLabel="Check a domain"
        href="/scan"
      />

      <H2 id="plans">Which plans include Perplexity</H2>
      <P>
        Growth ($29), Pro ($49), and Portfolio ($199) include Perplexity.
        Founder ($19) covers ChatGPT and Gemini. The free check at{" "}
        <BlogTextLink href="/scan">/scan</BlogTextLink> is a snapshot, not a
        substitute for a plan. Compare{" "}
        <BlogTextLink href="/pricing">Cited pricing</BlogTextLink> before you
        assume a surface is included.
      </P>

      <H2 id="faq">FAQ</H2>
      <ArticleFaq slug="how-to-check-if-perplexity-cites-your-website" />

      <H2 id="conclusion">Keep the source list</H2>
      <P>
        Perplexity already shows sources. Your job is to keep the ones that
        mention your verified domain, and to notice when they do not. Run the
        check. Store the evidence. Repeat on purpose.
      </P>
      <BlogCtaCard variant="scan" />
    </>
  );
}

function GoogleAiOverviewsBody() {
  return (
    <>
      <P>
        The question sounds like a ranking question. It is not. An Overview can
        cite you, mention you, skip you, or never appear for that query. You
        need evidence for the queries you care about, not a single screenshot of
        the search box.
      </P>
      <P>
        If you want a repeatable method across surfaces, use the{" "}
        <BlogTextLink href="/blog/llm-visibility-audit">
          LLM visibility audit
        </BlogTextLink>
        . This page is the Overview-specific decision: what an appearance is,
        what it is not, and what to do next.
      </P>

      <H2 id="the-question">The question</H2>
      <P>
        You want to know whether selected Google AI Overviews treat your
        website as a source. That is a prompt-level question. It is not a
        sitewide score.
      </P>
      <P>
        Start with the queries that already sound like buyer research. Then{" "}
        <BlogTextLink href="/scan">check your domain</BlogTextLink> or run the
        same wording yourself and save the sources.
      </P>

      <H2 id="what-appearance-is">What an Overview appearance is</H2>
      <BlogDefinitionCard
        term="Cited in the Overview"
        definition="A monitored Overview includes your verified domain as a source or linked reference."
      />
      <BlogDefinitionCard
        term="Mentioned in the Overview"
        definition="The generated text names your brand without an attributable source link to your verified domain."
      />
      <BlogDefinitionCard
        term="Overview miss"
        definition="A relevant Overview cites a configured competitor while your verified domain is absent."
      />
      <P>
        An Overview that never renders is also a result. Record that the
        generated block was absent for that query, location, and time. Do not
        invent a citation from the blue links underneath.
      </P>

      <H2 id="not-blue-links">This is not a blue-link ranking</H2>
      <P>
        Search Console still matters for clicks and classic results. It does
        not tell you whether an Overview cited your page. One can exist without
        the other.
      </P>
      <BlogDoDontTable
        rows={[
          {
            do: "Treat Overview sources as their own evidence lane.",
            dont: "Assume a page-one ranking means you were cited in the Overview.",
          },
          {
            do: "Save the query, location, and source URLs together.",
            dont: "Crop a screenshot and lose the query that produced it.",
          },
          {
            do: "Separate citations from mentions in the generated text.",
            dont: "Count every brand name as an Overview win.",
          },
        ]}
      />

      <H2 id="what-you-can-check">What you can check</H2>
      <Ul
        items={[
          "Selected queries you choose on purpose.",
          "Supported Google AI surfaces on plans that include them.",
          "Verified domains and brand aliases.",
          "Competitor domains you configure.",
          "Scheduled checks that create first-seen and last-observed history.",
        ]}
      />
      <P>
        Cited only monitors what you configure. Read{" "}
        <BlogTextLink href="/docs/what-cited-monitors">
          what Cited monitors
        </BlogTextLink>{" "}
        for the product boundary.
      </P>

      <H2 id="what-you-cannot">What you cannot know from one search</H2>
      <Ul
        items={[
          "Whether the Overview will render the same way tomorrow.",
          "Whether a different location sees the same sources.",
          "Whether every related query behaves the same.",
          "Private searches you were never part of.",
        ]}
      />
      <P>
        Answers vary by wording, location, and timing. That is why a single
        search is a moment, not a monitoring system.
      </P>

      <H2 id="manual-vs-monitored">Manual versus monitored</H2>
      <P>
        You can run the query yourself, save the Overview, and inspect sources.
        That is a start. It breaks when the query set grows or when someone asks
        what changed last week.
      </P>
      <SourceSlipExample
        prompt="best AI citation monitoring tools"
        surface="Google AI Overviews"
        evidence="A verified domain appeared as a cited source in the monitored Overview."
      />
      <P>
        The{" "}
        <BlogTextLink href="/how-it-works">how it works</BlogTextLink> page
        shows the product version: prompts, surfaces, evidence notes, inbox,
        and alerts.
      </P>

      <H2 id="how-cited">How Cited treats Google AI</H2>
      <P>
        Cited monitors configured prompts on supported Google AI surfaces and
        preserves evidence when your verified domain is cited, mentioned,
        recommended, or missed. A free check is a snapshot. Paid monitoring is
        the record.
      </P>
      <InlineProductNote>
        Cited does not control Google. It does not guarantee inclusion in any
        Overview or more citations. It keeps the evidence from the checks you
        run.
      </InlineProductNote>
      <BlogCtaCard
        variant="custom"
        title="Check the queries that matter."
        body="Run a free snapshot, then keep high-intent queries on a schedule if they are worth repeating."
        buttonLabel="Check a domain"
        href="/scan"
      />

      <H2 id="plans">Which plans include Google AI</H2>
      <P>
        Pro ($49) and Portfolio ($199) include Google AI. Founder ($19) covers
        ChatGPT and Gemini. Growth ($29) adds Perplexity. The free check at{" "}
        <BlogTextLink href="/scan">/scan</BlogTextLink> can include supported
        surfaces as a one-time snapshot. See{" "}
        <BlogTextLink href="/pricing">pricing</BlogTextLink> for the full
        comparison.
      </P>
      <P>
        If you want the tool-shaped page, read the{" "}
        <BlogTextLink href="/blog/ai-citation-checker">
          AI citation checker
        </BlogTextLink>
        .
      </P>

      <H2 id="faq">FAQ</H2>
      <ArticleFaq slug="are-you-showing-up-in-google-ai-overviews" />

      <H2 id="conclusion">Check the query, keep the evidence</H2>
      <P>
        An Overview appearance is a source you can attribute, on a query you
        chose, at a time you recorded. That is enough to make a decision. It is
        not enough to invent a ranking.
      </P>
      <BlogCtaCard variant="scan" />
    </>
  );
}

function GeoVsSeoBody() {
  return (
    <>
      <P>
        GEO is a popular label. SEO is a mature practice. Citation evidence is
        neither a slogan nor a ranking. It is a record.
      </P>
      <P>
        If you keep those three ideas in one pile, you will buy the wrong tool
        and write the wrong report. This page separates them.
      </P>

      <H2 id="short-distinction">The short distinction</H2>
      <P>
        SEO measures how pages are discovered, ranked, and clicked in search
        systems. Citation evidence records whether a selected AI answer used
        your verified domain as a source. GEO, in most marketing usage, mixes
        those jobs and adds content advice.
      </P>
      <P>
        Keep the evidence layer separate from the action layer. Cited is the
        evidence layer. Site and content work, including{" "}
        <BlogTextLink href="/docs/learn-domains-handoff">
          Learn Domains
        </BlogTextLink>
        , is the action layer.
      </P>

      <H2 id="what-seo-measures">What SEO already measures</H2>
      <Ul
        items={[
          "Rankings and SERP features",
          "Clicks, impressions, and pages",
          "Index coverage and crawl issues",
          "Backlinks and referring domains",
          "Technical health",
        ]}
      />
      <P>
        Those remain useful. They do not tell you whether ChatGPT, Perplexity,
        Claude, Gemini, or a Google AI Overview cited your page for a prompt
        you care about.
      </P>

      <H2 id="what-geo-claims">What GEO usually claims</H2>
      <P>
        Most GEO writing promises visibility inside generated answers. Some of
        that work is ordinary content and site craft: clearer pages, better
        internal links, fewer contradictions. Some of it is observation: did
        the answer cite you?
      </P>
      <P>
        The observation is the part that needs a receipt. The rest is still
        SEO, content, or product marketing under a new name.
      </P>

      <H2 id="what-evidence-is">What citation evidence actually is</H2>
      <P>
        Citation evidence is a structured note from a monitored answer. It is
        attributable to a verified domain. It can be reopened. It is not a
        vibe, a screenshot folder, or a made-up score.
      </P>
      <Ul
        items={[
          "Prompt",
          "Surface",
          "Timestamp",
          "Source URL",
          "Evidence excerpt",
          "First seen and last observed",
        ]}
      />
      <SourceSlipExample
        prompt="best AI citation monitoring tools for SaaS marketers"
        evidence="A verified domain appeared as a cited source beside two competitor domains in the monitored result."
      />
      <P>
        That is the object{" "}
        <BlogTextLink href="/blog/ai-citation-monitoring">
          AI citation monitoring
        </BlogTextLink>{" "}
        is built to produce.
      </P>

      <H2 id="four-labels">Four labels worth keeping separate</H2>
      <BlogDefinitionCard
        term="Citation"
        definition="The monitored answer uses your verified domain as a source or linked reference."
      />
      <BlogDefinitionCard
        term="Mention"
        definition="The answer names your brand without that attributable link."
      />
      <BlogDefinitionCard
        term="Recommendation"
        definition="The answer explicitly recommends your product, brand, or domain."
      />
      <BlogDefinitionCard
        term="Miss"
        definition="A configured competitor is cited and your verified domain is absent."
      />
      <P>
        Mixing those labels inflates reports. Use{" "}
        <BlogTextLink href="/docs/citations-vs-mentions">
          citations vs mentions
        </BlogTextLink>{" "}
        as the shared vocabulary.
      </P>

      <H2 id="not-screenshots">Why screenshots are not GEO</H2>
      <P>
        A screenshot is a moment. GEO-as-strategy needs a method. The method
        needs records you can reopen. If the file cannot answer prompt,
        surface, source, and time, it is not evidence.
      </P>
      <P>
        A one-off{" "}
        <BlogTextLink href="/blog/llm-visibility-audit">
          LLM visibility audit
        </BlogTextLink>{" "}
        is the method. Monitoring is how the method stays current.
      </P>

      <H2 id="where-cited-sits">Where Cited sits</H2>
      <P>
        Cited monitors the prompts and supported surfaces you choose, then
        classifies citations, mentions, recommendations, and misses. The inbox,
        alerts, and exports are described on{" "}
        <BlogTextLink href="/how-it-works">how it works</BlogTextLink>.
      </P>
      <P>
        You can start with a snapshot at{" "}
        <BlogTextLink href="/scan">/scan</BlogTextLink>. Plans for recurring
        checks start at $19/month on{" "}
        <BlogTextLink href="/pricing">pricing</BlogTextLink>.
      </P>
      <BlogCtaCard
        variant="custom"
        title="Evidence first. Strategy second."
        body="Cited records whether selected AI answers cite, mention, recommend, or miss your website. It does not invent a GEO score."
        buttonLabel="Check a domain"
        href="/scan"
      />

      <H2 id="what-cited-is-not">What Cited is not</H2>
      <Ul
        items={[
          "An SEO suite",
          "A crawler",
          "A content generator",
          "A replacement for Search Console",
          "A guarantee of more citations",
        ]}
      />
      <InlineProductNote>
        Cited does not monitor private AI conversations or every possible
        answer. It does not guarantee more citations, rankings, or inclusion in
        any AI answer.
      </InlineProductNote>

      <H2 id="faq">FAQ</H2>
      <ArticleFaq slug="geo-vs-seo-what-citation-evidence-actually-is" />

      <H2 id="conclusion">Keep the words honest</H2>
      <P>
        Call SEO what it is. Call citation evidence what it is. Use GEO only
        when you mean a mix of those jobs, and then say which part you are
        doing. The receipt is the part Cited keeps.
      </P>
      <BlogCtaCard variant="scan" />
    </>
  );
}

function AiCitationCheckerBody() {
  return (
    <>
      <P>
        Most people who type “AI citation checker” want a simple thing: did
        selected AI answers use my website as a source? The honest product
        answer is a snapshot first, a record second.
      </P>
      <P>
        Cited’s checker lives at{" "}
        <BlogTextLink href="/scan">/scan</BlogTextLink>. It is not a ranking
        tool, a crawler, or a content generator.
      </P>

      <H2 id="what-people-mean">What people mean by checker</H2>
      <P>
        They want a receipt, not a content strategy. A checker should accept a
        domain, run selected prompts on supported surfaces, and say whether the
        site was cited, mentioned, recommended, or missed.
      </P>
      <P>
        That is the same object described in{" "}
        <BlogTextLink href="/blog/ai-citation-monitoring">
          what AI citation monitoring is
        </BlogTextLink>
        . The checker is the first pass. Monitoring is the continuing pass.
      </P>

      <H2 id="free-check">What the free check does</H2>
      <P>
        The free check asks for a public domain you control or represent,
        optional brand names, and up to three questions. Cited runs those
        questions on supported surfaces and emails a private result link when
        the snapshot is ready.
      </P>
      <Ul
        items={[
          "Private result link",
          "The prompts you chose",
          "An evidence note when the snapshot is ready",
          "A clear path to ongoing monitoring",
        ]}
      />
      <P>
        Results vary by provider, location, timing, and prompt wording. The
        scan page says that up front. Believe it.
      </P>
      <BlogCtaCard
        variant="custom"
        title="Run the free citation check."
        body="Paste a domain. Choose the questions worth checking. Get a private result when the snapshot is ready."
        buttonLabel="Check a domain"
        href="/scan"
      />

      <H2 id="free-does-not">What the free check does not do</H2>
      <Ul
        items={[
          "Watch those prompts next week",
          "Replace a citation inbox, alerts, or history",
          "See private AI conversations",
          "Score your brand against the whole internet",
          "Guarantee more citations",
        ]}
      />
      <InlineProductNote>
        The public check is rate limited by network. If today’s check is
        already used, wait until tomorrow or start monitoring for recurring
        checks. Cited does not sell your contact information.
      </InlineProductNote>

      <H2 id="snapshot-vs-record">Snapshot versus record</H2>
      <BlogDefinitionCard
        term="Snapshot"
        definition="What happened on this check, for these prompts, on the supported surfaces that ran."
      />
      <BlogDefinitionCard
        term="Record"
        definition="First seen, last observed, and the inbox of notes you can reopen when someone asks what changed."
      />
      <P>
        A snapshot answers a decision. A record answers a week. If you only
        need the decision, the free check is the right object. If you will
        still care about the prompts next month, monitor them.
      </P>
      <BlogDoDontTable
        rows={[
          {
            do: "Use the free check to see whether a prompt is worth repeating.",
            dont: "Treat one snapshot as a monitoring program.",
          },
          {
            do: "Keep citations, mentions, and misses in separate labels.",
            dont: "Turn a brand mention into a made-up visibility score.",
          },
          {
            do: "Move important prompts onto a plan when you need history.",
            dont: "Re-run informal checks and hope the screenshots line up.",
          },
        ]}
      />

      <H2 id="what-you-get">What you get from a check</H2>
      <P>
        You get a private link, not a public leaderboard. When the snapshot is
        ready, the result shows the questions checked and any included
        evidence. Absence is still useful. The result page says that plainly:
        a single check is a snapshot, monitoring is the record.
      </P>
      <EvidenceExampleCard
        title="Private citation snapshot"
        badge="EXAMPLE"
        meta="Illustrative"
      >
        <p>
          Domain, selected prompts, supported surfaces, and an evidence note
          when your site appears. Fictional example for illustration. Not a
          live scan result.
        </p>
      </EvidenceExampleCard>
      <P>
        For the ChatGPT-shaped decision, see{" "}
        <BlogTextLink href="/blog/is-my-brand-cited-in-chatgpt">
          is my brand cited in ChatGPT?
        </BlogTextLink>
        . For the method, use{" "}
        <BlogTextLink href="/blog/how-to-know-if-chatgpt-cites-your-website">
          how to know if ChatGPT cites your website
        </BlogTextLink>
        .
      </P>

      <H2 id="when-to-monitor">When to start monitoring</H2>
      <P>
        Start monitoring when you have prompts you will still care about next
        month. Cited adds recurring checks, a citation inbox, email alerts, and
        history. That workflow is on{" "}
        <BlogTextLink href="/how-it-works">how it works</BlogTextLink>.
      </P>
      <Ul
        items={[
          "Recurring checks on your prompts",
          "Citation Inbox with durable evidence notes",
          "Email alerts when meaningful evidence appears",
          "History you can reopen when stakeholders ask",
        ]}
      />

      <H2 id="plans">Plans, plainly</H2>
      <Ul
        items={[
          "Founder, $19/month: ChatGPT and Gemini, 10 prompts, twice-weekly checks.",
          "Growth, $29/month: adds Perplexity and competitor watch.",
          "Pro, $49/month: adds Claude and Google AI, daily checks.",
          "Portfolio, $199/month: multiple domains, 50 prompts per domain.",
        ]}
      />
      <P>
        The free check is not a plan. Compare the full table on{" "}
        <BlogTextLink href="/pricing">pricing</BlogTextLink>. The app lives at{" "}
        <BlogTextLink href="/app">/app</BlogTextLink> after you subscribe.
      </P>
      <BlogCtaCard variant="scan" />

      <H2 id="faq">FAQ</H2>
      <ArticleFaq slug="ai-citation-checker" />

      <H2 id="conclusion">Run the check you can stand behind</H2>
      <P>
        An AI citation checker is only useful if it tells the truth about
        scope. Cited’s free check is a snapshot of selected prompts on
        supported surfaces. Monitoring is the record. Start with the snapshot
        if that is the decision you need.
      </P>
      <BlogCtaCard
        variant="custom"
        title="Paste your domain. Get the receipt."
        body="Cited checks the questions you choose and preserves the evidence when your site appears."
        buttonLabel="Check a domain"
        href="/scan"
      />
    </>
  );
}
