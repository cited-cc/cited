import {
  BlogCtaCard,
  BlogTextLink,
} from "@/components/blog/blog-cta";
import {
  DocsCallout,
  DocsStepList,
} from "@/components/docs/docs-primitives";
import { absoluteUrl } from "@/lib/seo/site";

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

/**
 * Body for /docs/llms. Kept here so docs-article-body can stay focused.
 */
export function DocsLlmsBody() {
  const llmsUrl = absoluteUrl("/llms.txt");
  const llmsFullUrl = absoluteUrl("/llms-full.txt");

  return (
    <>
      <P>
        Cited publishes LLM-readable files to help AI systems and agents
        understand the product, docs, and public editorial content.
      </P>
      <P>
        These files help AI systems find and interpret Cited’s public content.
        They do not guarantee inclusion, ranking, or citation in any AI answer.
      </P>

      <H2 id="what-llms-txt">What /llms.txt is</H2>
      <P>
        <BlogTextLink href="/llms.txt">/llms.txt</BlogTextLink> is a curated
        Markdown map of Cited’s most important public pages. It is an emerging
        convention for AI discovery and grounding, not a guaranteed SEO ranking
        factor.
      </P>
      <Ul
        items={[
          "Product summary and positioning",
          "Core product pages",
          "Key documentation links",
          "Blog field notes",
          "Honest product limitations",
          "Pointer to the fuller export",
        ]}
      />

      <H2 id="what-llms-full">What /llms-full.txt is</H2>
      <P>
        <BlogTextLink href="/llms-full.txt">/llms-full.txt</BlogTextLink> is a
        longer Markdown export of Cited’s public product context, docs
        summaries, and blog article Markdown. It is meant for agents that need
        richer grounding than the short map.
      </P>

      <H2 id="includes">What they include</H2>
      <Ul
        items={[
          "Public product definitions",
          "Canonical URLs for core pages",
          "Docs and blog summaries or Markdown exports",
          "Clear limitations about monitoring scope",
        ]}
      />

      <H2 id="excludes">What they do not include</H2>
      <Ul
        items={[
          "Private workspace data",
          "Customer evidence",
          "API keys or internal architecture secrets",
          "Fake claims about guaranteed AI citations",
          "A promise that publishing these files will make AI systems cite Cited",
        ]}
      />

      <DocsCallout title="Limitation" tone="warning">
        llms.txt is an emerging convention. It should support AI discovery and
        grounding. It should not be treated as a guaranteed ranking or citation
        factor.
      </DocsCallout>

      <H2 id="files">Public files</H2>
      <DocsStepList
        steps={[
          {
            title: "llms.txt",
            body: `Curated map: ${llmsUrl}`,
          },
          {
            title: "ai.txt",
            body: `AI agent alias: ${absoluteUrl("/ai.txt")}`,
          },
          {
            title: "llms-full.txt",
            body: `Fuller public context: ${llmsFullUrl}`,
          },
        ]}
      />

      <H2 id="related">Related reading</H2>
      <Ul
        items={[
          <BlogTextLink key="monitors" href="/docs/what-cited-monitors">
            What Cited monitors
          </BlogTextLink>,
          <BlogTextLink key="terms" href="/docs/citations-vs-mentions">
            Citations vs mentions
          </BlogTextLink>,
          <BlogTextLink key="blog" href="/blog">
            Cited Blog
          </BlogTextLink>,
        ]}
      />

      <BlogCtaCard variant="scan" />
    </>
  );
}
