import Link from "next/link";

import { DocsLlmsBody } from "@/components/docs/docs-llms-body";
import { Button } from "@/components/ui/button";
import {
  DocsCallout,
  DocsCodeLikeBlock,
  DocsDefinitionList,
  DocsExampleCard,
  DocsLimitTable,
  DocsPlanNote,
  DocsStepList,
  DocsTerminologyCard,
} from "@/components/docs/docs-primitives";
import {
  CHANGELOG_ENTRIES,
  CHANGELOG_INTRO,
  DOCS_FAQ_ITEMS,
  getDocsContactEmail,
  getEnabledSurfaceNamesForDocs,
  getPlanLimitRowsForDocs,
} from "@/lib/content/docs";
import { getSupportContactConfig } from "@/lib/content/support";
import { TERMINOLOGY } from "@/lib/content/terminology";

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

function Ul({ items }: { items: string[] }) {
  return (
    <ul className="my-4 list-disc space-y-2 pl-5 type-body-sm text-cited-ink-muted">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function DocsArticleBody({ slug }: { slug: string }) {
  switch (slug) {
    case "getting-started":
      return <GettingStartedBody />;
    case "what-cited-monitors":
      return <WhatCitedMonitorsBody />;
    case "citations-vs-mentions":
      return <CitationsVsMentionsBody />;
    case "monitored-prompts":
      return <MonitoredPromptsBody />;
    case "domain-verification":
      return <DomainVerificationBody />;
    case "ai-surfaces":
      return <AiSurfacesBody />;
    case "citation-inbox":
      return <CitationInboxBody />;
    case "evidence-notes":
      return <EvidenceNotesBody />;
    case "notebook":
      return <NotebookBody />;
    case "alerts-and-digests":
      return <AlertsBody />;
    case "slack-alerts":
      return <AlertsRedirectBody />;
    case "billing-and-limits":
      return <BillingBody />;
    case "exporting-evidence":
      return <ExportingBody />;
    case "learn-domains-handoff":
      return <LearnDomainsBody />;
    case "troubleshooting":
      return <TroubleshootingBody />;
    case "faq":
      return <FaqBody />;
    case "changelog":
      return <ChangelogBody />;
    case "contact":
      return <ContactBody />;
    case "llms":
      return <DocsLlmsBody />;
    default:
      return <P>This article could not be found.</P>;
  }
}

function GettingStartedBody() {
  return (
    <>
      <P>
        Cited helps you monitor selected AI answers, preserve citation evidence,
        and understand what changed. Setup stays narrow on purpose.
      </P>
      <DocsCallout title="Self-hosted installations">
        Community edition operators can start with Docker: run{" "}
        <code className="font-mono text-sm">npm run self-host:up</code>, retrieve
        the bootstrap token with{" "}
        <code className="font-mono text-sm">npm run self-host:token</code>, then
        complete first-owner setup at <Link href="/setup">/setup</Link>. Mock
        provider returns fictional labeled data by default.
      </DocsCallout>
      <H2 id="steps">Setup steps</H2>
      <DocsStepList
        steps={[
          {
            title: "Create an account",
            body: "Sign up and choose the workspace that will own your monitoring.",
          },
          {
            title: "Choose a plan",
            body: "Select a plan that matches the prompts, surfaces, and cadence you need.",
          },
          {
            title: "Verify your domain",
            body: "Add a DNS TXT record so Cited can attribute evidence to a domain you control.",
          },
          {
            title: "Add monitored prompts",
            body: "Start with buyer-like questions that matter to your business.",
          },
          {
            title: "Select supported AI surfaces",
            body: "Choose surfaces enabled for your plan and currently available in Cited.",
          },
          {
            title: "Review the Citation Inbox",
            body: "When monitored results produce evidence, notes appear in the Inbox.",
          },
          {
            title: "Open evidence notes",
            body: "Inspect the stored prompt, response snapshot, sources, and history.",
          },
          {
            title: "Set alerts and digests",
            body: "Turn on email alerts for meaningful events, plus a weekly digest.",
          },
        ]}
      />
      <H2 id="first-monitor">First monitor example</H2>
      <DocsExampleCard title="Example first monitor">
        <p>
          <span className="text-cited-ink-subtle">Domain:</span> example.com
        </p>
        <p>
          <span className="text-cited-ink-subtle">Brand:</span> Example
        </p>
        <p>
          <span className="text-cited-ink-subtle">Prompt:</span> “best tools for
          [category]”
        </p>
        <p>
          <span className="text-cited-ink-subtle">Surface:</span> ChatGPT and
          Gemini, when supported by your plan
        </p>
        <p>
          <span className="text-cited-ink-subtle">Cadence:</span> Based on your
          plan
        </p>
      </DocsExampleCard>
      <H2 id="try-demo">Try the public demo</H2>
      <P>
        Prefer a walkthrough before setup? The public demo uses clearly labeled
        fictional evidence so you can explore the Inbox without an account.
      </P>
      <p className="type-body-sm">
        <Link
          href="/demo"
          className="text-cited-accent underline-offset-4 hover:underline"
        >
          Open the interactive demo
        </Link>
      </p>
      <H2 id="timing">When results appear</H2>
      <DocsCallout title="Timing" tone="citation">
        Monitoring runs on the schedule included with your plan. Results can
        vary by provider, timing, location, and prompt wording.
      </DocsCallout>
      <P>
        Cited does not promise immediate results after setup. Open{" "}
        <Link href="/app/monitors" className="underline underline-offset-4">
          Monitors
        </Link>{" "}
        to confirm activation, then check the Inbox after scheduled runs
        complete.
      </P>
    </>
  );
}

function WhatCitedMonitorsBody() {
  return (
    <>
      <P>
        Cited monitors the prompts, AI surfaces, schedules, locations, and
        verified domains you configure. It stores evidence from those monitored
        results.
      </P>
      <H2 id="in-scope">In scope</H2>
      <Ul
        items={[
          "Monitored prompts you add",
          "AI surfaces enabled for your plan and selected in a monitor",
          "Location and language settings when a surface supports them",
          "Verified domains and approved brand aliases",
          "Configured competitors where your plan includes competitor watch",
          "The monitoring schedule included with your plan",
        ]}
      />
      <H2 id="monitor-checks">Monitor checks</H2>
      <P>{TERMINOLOGY.monitor_check.short}</P>
      <P>
        Each check produces a stored result. Meaningful appearances become
        citation events in the Inbox.
      </P>
      <H2 id="out-of-scope">What Cited does not monitor</H2>
      <Ul
        items={[
          "Private AI conversations",
          "Every possible prompt",
          "Every model output on the internet",
          "Unverified domains",
          "Unconfigured competitors",
          "Unselected AI surfaces",
          "Unselected locations",
          "General web mentions outside monitored AI results",
        ]}
      />
      <DocsCallout title="Boundary">
        Cited is the signal and evidence layer. It does not replace SEO,
        content, analytics, or technical growth work.
      </DocsCallout>
    </>
  );
}

function CitationsVsMentionsBody() {
  return (
    <>
      <P>
        Cited classifies monitored results into a small set of evidence types.
        Use these definitions consistently in the Inbox and Notebook.
      </P>
      <DocsDefinitionList
        items={[
          {
            id: "citation",
            term: "Citation",
            definition: TERMINOLOGY.citation.short,
          },
          {
            id: "mention",
            term: "Mention",
            definition: TERMINOLOGY.mention.short,
          },
          {
            id: "recommendation",
            term: "Recommendation",
            definition: TERMINOLOGY.recommendation.short,
          },
          {
            id: "competitor-citation",
            term: "Competitor citation",
            definition: TERMINOLOGY.competitor_citation.short,
          },
          {
            id: "missed-opportunity",
            term: "Missed opportunity",
            definition: TERMINOLOGY.missed_opportunity.short,
          },
          {
            id: "occurrence",
            term: "Occurrence",
            definition: TERMINOLOGY.occurrence.short,
          },
          {
            id: "citation-event",
            term: "Citation event",
            definition: TERMINOLOGY.citation_event.short,
          },
          {
            id: "citation-evidence",
            term: "Citation evidence",
            definition: TERMINOLOGY.citation_evidence.short,
          },
        ]}
      />
      <H2 id="examples">Examples</H2>
      <DocsExampleCard title="Classification examples">
        <p>
          <strong className="text-cited-ink">Citation:</strong> The monitored
          response includes example.com as a source.
        </p>
        <p>
          <strong className="text-cited-ink">Mention:</strong> The monitored
          response says “Example is a tool for…” but does not provide
          example.com as a source.
        </p>
        <p>
          <strong className="text-cited-ink">Missed opportunity:</strong> A
          configured competitor appears as a source while your verified domain
          is absent from that monitored result.
        </p>
      </DocsExampleCard>
      <DocsCallout title="Missed opportunity">
        A missed opportunity means your domain was absent in that monitored
        result while a configured competitor appeared. It does not mean you
        “lost” permanently, and it does not guarantee a future citation.
      </DocsCallout>
    </>
  );
}

function MonitoredPromptsBody() {
  return (
    <>
      <H2 id="strategy">Prompt strategy</H2>
      <P>
        Prompts should mirror real buyer questions. Use one intent per prompt.
        Cited is evidence, not prompt stuffing.
      </P>
      <H2 id="good-patterns">Good patterns</H2>
      <Ul
        items={[
          "Best tools for [job]",
          "Best [category] software for [audience]",
          "How do I solve [problem]?",
          "What is [brand]?",
          "Best alternatives to [competitor]",
          "Who should I use for [job to be done]?",
        ]}
      />
      <H2 id="bad-patterns">Patterns to avoid</H2>
      <DocsExampleCard title="Avoid these shapes">
        <p>
          <strong className="text-cited-ink">Too broad:</strong> “marketing”
        </p>
        <p>
          <strong className="text-cited-ink">Too vague:</strong> “tools”
        </p>
        <p>
          <strong className="text-cited-ink">Too many questions at once:</strong>{" "}
          “What are the best tools, prices, reviews, alternatives, and setup
          steps?”
        </p>
        <p>
          <strong className="text-cited-ink">Not buyer-like:</strong> “Please
          cite my website”
        </p>
      </DocsExampleCard>
      <H2 id="limits">Limits and focus</H2>
      <P>
        Do not spam hundreds of prompts. Monitor what matters within your plan
        limits. Narrow prompts produce clearer evidence and fewer noisy notes.
      </P>
    </>
  );
}

function DomainVerificationBody() {
  return (
    <>
      <H2 id="why">Why verification exists</H2>
      <P>
        Verification proves you control the domain Cited attributes evidence to.
        Without it, Cited will not treat a hostname as your verified domain.
      </P>
      <H2 id="record">DNS TXT record</H2>
      <DocsCodeLikeBlock>{`Type: TXT
Host: @
Value: cited-verification=your-verification-token`}</DocsCodeLikeBlock>
      <P>
        Some DNS providers use a blank host, `@`, or the bare domain name for
        root TXT records. Use the host label shown in your workspace settings.
      </P>
      <H2 id="steps">How to verify</H2>
      <DocsStepList
        steps={[
          {
            title: "Copy the token",
            body: "Open domain settings and copy the verification value Cited generated for your workspace.",
          },
          {
            title: "Add the TXT record",
            body: "Create the DNS TXT record at your DNS provider for the domain you control.",
          },
          {
            title: "Wait for propagation",
            body: "DNS changes can take a few minutes or longer depending on your provider.",
          },
          {
            title: "Verify in Cited",
            body: "Return to domain settings and run verification. Cited checks for the expected TXT value.",
          },
        ]}
      />
      <H2 id="propagation">Propagation issues</H2>
      <Ul
        items={[
          "Confirm the record is on the correct domain, not a subdomain by mistake",
          "Confirm there are no extra quotes or spaces around the value",
          "Wait for DNS TTL to expire if an older record was cached",
          "Retry verification after the provider shows the record as live",
        ]}
      />
      <H2 id="failures">If verification fails</H2>
      <P>
        Re-check the host and value, wait for propagation, then retry. If it
        still fails, regenerate the token only if you are sure the old record
        can be replaced, then update DNS and verify again.
      </P>
      <H2 id="safety">What not to do</H2>
      <DocsCallout title="Token safety" tone="warning">
        Never share your verification token publicly except as the required DNS
        record for the domain you control.
      </DocsCallout>
      <Ul
        items={[
          "Do not paste the token into public pages, tickets, or chat logs",
          "Do not verify a domain you do not control",
          "Do not remove the TXT record immediately if you still need re-checks",
        ]}
      />
    </>
  );
}

function AiSurfacesBody() {
  const enabled = getEnabledSurfaceNamesForDocs();
  return (
    <>
      <H2 id="availability">Availability</H2>
      <P>
        Supported AI surfaces depend on your plan and provider availability.
        Cited only shows surfaces that are enabled in the product.
      </P>
      <H2 id="enabled">Currently enabled surfaces</H2>
      {enabled.length > 0 ? (
        <Ul items={enabled} />
      ) : (
        <P>No AI surfaces are currently enabled in this deployment.</P>
      )}
      <DocsPlanNote>
        Plan entitlements may list additional surfaces. Surfaces that are not
        enabled in the product are not monitored, even if a plan mentions them.
      </DocsPlanNote>
      <H2 id="variation">Why results vary</H2>
      <Ul
        items={[
          "AI responses can vary by provider, model, timing, location, and prompt wording",
          "Citations are not formatted identically across providers",
          "Some surfaces support sources better than others",
        ]}
      />
      <H2 id="unsupported">Unsupported surfaces</H2>
      <P>
        Surfaces outside the enabled list are not checked. Cited does not claim
        coverage for every AI product on the internet.
      </P>
    </>
  );
}

function CitationInboxBody() {
  return (
    <>
      <H2 id="purpose">Purpose</H2>
      <P>
        The Citation Inbox is a focused stream of evidence notes from monitored
        results. It is not a general analytics dashboard.
      </P>
      <H2 id="tabs">Tabs and states</H2>
      <Ul
        items={[
          "New: notes you have not opened or acknowledged yet",
          "Seen: notes you have opened or acknowledged",
          "Saved: notes you want to keep close",
          "Archived: notes cleared from the active Inbox without deleting history",
          "Resolved: notes marked handled for your workflow",
        ]}
      />
      <H2 id="filters">Filters and search</H2>
      <P>
        Filter by event type, AI surface, date range, and more. Search across
        prompts and sources to find a specific note. Direct event links open the
        focused evidence view.
      </P>
      <H2 id="recurrence">Recurring citations</H2>
      <P>
        When the same citation appears again, Cited records an occurrence on the
        existing note instead of flooding the Inbox with duplicates.
      </P>
      <H2 id="seen">Seen behavior</H2>
      <DocsCallout title="Seen state" tone="citation">
        Opening the Inbox does not mark every event as seen. An event becomes
        seen when you open or acknowledge that specific note.
      </DocsCallout>
    </>
  );
}

function EvidenceNotesBody() {
  return (
    <>
      <H2 id="contents">What a note contains</H2>
      <Ul
        items={[
          "Monitored response snapshot",
          "Prompt snapshot",
          "Source evidence",
          "Occurrence history",
          "Material change labels when applicable",
          "Annotations and linked Notebook context",
          "Provenance for the monitored result",
        ]}
      />
      <H2 id="first-seen">First seen by Cited</H2>
      <P>{TERMINOLOGY.first_seen_by_cited.short}</P>
      <H2 id="last-observed">Last observed by Cited</H2>
      <P>{TERMINOLOGY.last_observed_by_cited.short}</P>
      <H2 id="snapshots">Stored snapshots</H2>
      <DocsCallout title="Important" tone="citation">
        Cited does not re-run the AI response when you open an evidence note. It
        shows the stored snapshot from the monitored result.
      </DocsCallout>
      <H2 id="provenance">Provenance</H2>
      <P>
        A citation note is a durable record of what Cited observed in a
        configured monitoring run. Access to older evidence follows your plan’s
        history window.
      </P>
    </>
  );
}

function NotebookBody() {
  return (
    <>
      <H2 id="purpose">Purpose</H2>
      <P>
        The Notebook is for preserving context around citation evidence. Link
        notes to events, pin important context, and keep a quiet working record.
      </P>
      <H2 id="visibility">Private vs workspace notes</H2>
      <P>
        Workspace notes are visible to authorized workspace members. Private
        notes stay with the author. Exports respect those boundaries.
      </P>
      <H2 id="annotations">Annotations vs notes</H2>
      <P>
        Annotations attach short comments to a citation note or evidence target.
        Notebook entries are longer-form context that can stand on their own or
        link back to an event.
      </P>
      <H2 id="history">Revision history</H2>
      <P>
        Notebook entries keep revision history so you can see how context
        changed over time.
      </P>
      <H2 id="boundary">What Notebook is not</H2>
      <DocsCallout title="Boundary">
        The Notebook is for preserving context around citation evidence. It is
        not meant to replace a full team wiki or document workspace.
      </DocsCallout>
    </>
  );
}

function AlertsBody() {
  return (
    <>
      <H2 id="instant">Instant alerts</H2>
      <P>
        Instant alerts notify you about meaningful new citation events according
        to workspace and personal preferences.
      </P>
      <H2 id="digest">Weekly digest</H2>
      <P>
        The weekly digest summarizes recent activity so you can review evidence
        without living in the Inbox.
      </P>
      <H2 id="issues">Monitor issue alerts</H2>
      <P>
        Monitor issue alerts help you notice blocked monitors, repeated
        failures, or setup problems that stop evidence from arriving.
      </P>
      <H2 id="recurring">Recurring citations</H2>
      <DocsCallout title="Alert quieting" tone="citation">
        Cited does not email you every time the same recurring citation appears.
        By default, it alerts on meaningful new events and summarizes activity
        in your digest.
      </DocsCallout>
      <H2 id="preferences">Preferences and unsubscribe</H2>
      <P>
        Workspace defaults set the baseline. Personal preferences and
        unsubscribe links can narrow what you receive. Preference hierarchy
        respects unsubscribe and personal opt-outs.
      </P>
    </>
  );
}

function AlertsRedirectBody() {
  return (
    <>
      <H2 id="email-only">Email alerts</H2>
      <P>
        Cited delivers citation alerts and weekly digests by email. Configure
        workspace defaults and personal preferences in notification settings.
      </P>
      <P>
        See{" "}
        <a href="/docs/alerts-and-digests" className="text-cited-accent underline-offset-4 hover:underline">
          Alerts and digests
        </a>{" "}
        for setup details.
      </P>
    </>
  );
}

function BillingBody() {
  const rows = getPlanLimitRowsForDocs();
  return (
    <>
      <H2 id="plans">Plans and limits</H2>
      <P>
        Limits come from the plan registry. The table below reflects current
        public plan entitlements.
      </P>
      <DocsLimitTable rows={rows} />
      <H2 id="meters">Usage meters</H2>
      <Ul
        items={[
          "Prompt limits",
          "Monitor check limits",
          "AI surface availability",
          "Email alert availability by plan",
          "Member limits where team seats are included",
        ]}
      />
      <H2 id="history-window">History window</H2>
      <P>{TERMINOLOGY.history_window.short}</P>
      <P>
        Evidence outside the active history window may remain stored but become
        inaccessible until you upgrade.
      </P>
      <H2 id="downgrade">Downgrade and cancellation</H2>
      <P>
        After a downgrade, Cited enforces the lower plan’s limits. Excess
        monitors or surfaces may need to be reduced. After cancellation, access
        continues through the end of the current billing period, then monitoring
        stops according to billing policy.
      </P>
      <H2 id="payments">Failed payments</H2>
      <P>
        Past-due workspaces may keep limited access during a grace period.
        Update billing to restore full monitoring. Suspended or canceled states
        follow the billing access policy in the app.
      </P>
    </>
  );
}

function ExportingBody() {
  return (
    <>
      <H2 id="formats">Export formats</H2>
      <Ul
        items={[
          "Citation events CSV",
          "Citation events JSON",
          "Single citation note Markdown",
          "Notebook entries Markdown",
          "Workspace evidence archive JSON",
        ]}
      />
      <P>
        Exports are for records, teammate sharing, and internal reports. Cited
        does not build a full reporting dashboard in this surface.
      </P>
      <H2 id="permissions">Permissions</H2>
      <Ul
        items={[
          "Owners and admins can export workspace evidence",
          "Members can export evidence they can view",
          "Viewers are view-only and cannot export by default",
        ]}
      />
      <H2 id="privacy">Privacy defaults</H2>
      <Ul
        items={[
          "Broad CSV exports exclude full response text by default",
          "Private notes from other users are never included",
          "Raw provider payloads, secrets, Stripe IDs, and webhook URLs are excluded",
          "Single citation Markdown may include the response snapshot when authorized and inside the history window",
        ]}
      />
      <H2 id="limits">Size and rate limits</H2>
      <P>
        Exports are rate-limited and bounded. If an export is too large to
        generate at once, narrow the date range and try again.
      </P>
    </>
  );
}

function LearnDomainsBody() {
  return (
    <>
      <H2 id="boundary">Product boundary</H2>
      <DocsTerminologyCard
        term="Cited"
        definition="Cited is where you detect and preserve AI citation evidence."
      />
      <div className="my-3" />
      <DocsTerminologyCard
        term="Learn Domains"
        definition="Learn Domains is where you can improve pages, content, structure, and site growth work that may help earn citations over time."
      />
      <DocsCallout title="Optional next step">
        Learn Domains is a useful next step, not a hard dependency. Cited remains
        complete without it.
      </DocsCallout>
      <div className="mt-4">
        <Button
          href="https://learn.domains"
          variant="primary"
          size="sm"
          target="_blank"
          rel="noreferrer"
        >
          Visit Learn Domains
        </Button>
      </div>
      <H2 id="when">When handoff appears</H2>
      <P>
        When enabled, Cited may show a handoff on missed opportunities,
        competitor citations, or prompts with no evidence after several
        completed scans. It does not appear as a global ad across the product.
      </P>
      <H2 id="example">Example</H2>
      <DocsExampleCard title="Signal to next step">
        <p>
          <strong className="text-cited-ink">Cited shows:</strong> Your domain
          was absent for “best AI SEO tools.”
        </p>
        <p>
          <strong className="text-cited-ink">Learn Domains can help:</strong>{" "}
          Audit the relevant page, create supporting content, improve internal
          links, and strengthen the content cluster around that topic.
        </p>
      </DocsExampleCard>
      <H2 id="limits">What handoff does not claim</H2>
      <Ul
        items={[
          "Learn Domains does not guarantee more AI citations",
          "Cited does not force AI providers to cite your website",
          "Handoff does not send private notes, full AI responses, or billing details",
        ]}
      />
    </>
  );
}

function TroubleshootingBody() {
  return (
    <>
      <H2 id="domain">Domain will not verify</H2>
      <P>
        Confirm the TXT host and value, wait for DNS propagation, then retry.
        See{" "}
        <Link
          href="/docs/domain-verification"
          className="underline underline-offset-4"
        >
          Domain verification
        </Link>
        .
      </P>
      <H2 id="no-notes">No citation notes yet</H2>
      <P>
        Confirm the domain is verified, prompts are active, surfaces are
        enabled, and monitoring has completed at least one run. Empty Inbox is
        normal before the first meaningful result.
      </P>
      <H2 id="blocked">Monitor is blocked</H2>
      <P>
        Open Monitors and review the pause reason. Common causes include plan
        limits, unsupported surfaces, or repeated provider failures.
      </P>
      <H2 id="alerts">I received fewer alerts than expected</H2>
      <P>
        Cited does not alert on every recurring occurrence. Check workspace and
        personal preferences, digest settings, and unsubscribe state.
      </P>
      <H2 id="self-hosted">Self-hosted diagnostics</H2>
      <Ul
        items={[
          "Run npm run self-host:doctor for Compose, secrets, and health checks",
          "Confirm the worker service is running when scans stay queued",
          "Mock provider output is fictional; switch to DataForSEO with your own credentials for live monitoring",
          "Use Mailpit locally to test SMTP without sending external mail",
        ]}
      />
      <H2 id="email">Email alerts are not sending</H2>
      <P>
        Confirm your notification preferences, verify the recipient email, and
        check spam filters. Use the test email action in notification settings
        to confirm delivery.
      </P>
      <H2 id="billing">Billing status needs attention</H2>
      <P>
        Owners and admins should open Billing to update payment details or
        review past-due state. Members can ask an admin for help.
      </P>
      <H2 id="classification">Classification questions</H2>
      <Ul
        items={[
          "A citation disappeared: it may be archived, outside the history window, or filtered out of the current Inbox view",
          "A mention was not classified as a citation: mentions lack an attributable source link to your verified domain",
          "A source URL looks different than expected: Cited stores the URL observed in the monitored result, which may use redirects or alternate hosts",
        ]}
      />
      <H2 id="limits">Plan limits and cancellation</H2>
      <P>
        If you reached a plan limit, reduce usage or upgrade. If you canceled
        but still see the workspace, access may remain through the end of the
        current billing period.
      </P>
    </>
  );
}

function FaqBody() {
  return (
    <>
      <H2 id="questions">Questions</H2>
      <div className="space-y-6">
        {DOCS_FAQ_ITEMS.map((item) => (
          <div key={item.id} id={item.id}>
            <h3 className="type-title text-base">{item.question}</h3>
            <p className="mt-2 type-body-sm text-cited-ink-muted">
              {item.answer}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}

function ChangelogBody() {
  return (
    <>
      <P>{CHANGELOG_INTRO}</P>
      <H2 id="entries">Entries</H2>
      <ul className="my-4 space-y-4">
        {CHANGELOG_ENTRIES.map((entry) => (
          <li
            key={entry.id}
            className="rounded-md border border-cited-line-subtle px-4 py-3"
          >
            <p className="type-meta text-cited-ink-faint">{entry.label}</p>
            <p className="mt-1 type-title text-base">{entry.area}</p>
            <p className="mt-1 type-body-sm text-cited-ink-muted">
              {entry.summary}
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}

function ContactBody() {
  const support = getSupportContactConfig();
  const email = getDocsContactEmail();

  return (
    <>
      <H2 id="support">Support</H2>
      {email ? (
        <P>
          Email{" "}
          <a href={`mailto:${email}`} className="underline underline-offset-4">
            {email}
          </a>{" "}
          for product questions and account help.
        </P>
      ) : (
        <P>
          Support email is not configured for this deployment. Use in-app
          billing controls where available, or contact your workspace owner.
        </P>
      )}
      <H2 id="billing">Billing</H2>
      <P>{support.billingGuidance}</P>
      <H2 id="security">Security</H2>
      <P>{support.securityGuidance}</P>
      {support.securityEmail ? (
        <P>
          Security contact:{" "}
          <a
            href={`mailto:${support.securityEmail}`}
            className="underline underline-offset-4"
          >
            {support.securityEmail}
          </a>
        </P>
      ) : null}
      <H2 id="include">What to include</H2>
      <Ul items={[...support.whatToInclude]} />
      <DocsCallout title="Response timing">
        Cited does not promise a response time. Clear details help support
        investigate faster.
      </DocsCallout>
      <ul className="mt-4 space-y-2">
        {support.docsLinks.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="underline underline-offset-4">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
