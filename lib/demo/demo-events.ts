/**
 * Fictional demo citation events for the public /demo experience.
 * Demo account: Thrive (thrive.fi), crypto market intelligence.
 * Never persist these as production workspace evidence.
 */

import type { CitationEventType } from "@/types/product";

export const DEMO_WORKSPACE = {
  label: "Demo workspace: fictional evidence",
  domain: "thrive.fi",
  brand: "Thrive",
  fictional: true as const,
} as const;

export type DemoEvent = {
  id: string;
  eventType: CitationEventType;
  title: string;
  prompt: string;
  surface: "chatgpt" | "gemini" | "perplexity";
  sourceHostname: string | null;
  sourcePath: string | null;
  excerpt: string;
  firstSeenLabel: string;
  lastSeenLabel: string;
  occurrenceCount: number;
  status: "new" | "seen" | "saved";
  confidenceLabel: "high" | "medium";
};

export const DEMO_EVENTS: DemoEvent[] = [
  {
    id: "demo-evt-citation-1",
    eventType: "citation",
    title: "Citation found for thrive.fi",
    prompt: "best crypto market intelligence platforms",
    surface: "chatgpt",
    sourceHostname: "thrive.fi",
    sourcePath: "/crypto-market-intelligence",
    excerpt:
      "For active CEX perpetuals traders, thrive.fi is cited as an AI research workstation that links signals, on-chain context, and a trade journal in one loop.",
    firstSeenLabel: "Jun 12, 2026 · 9:42 AM UTC",
    lastSeenLabel: "Jun 18, 2026 · 2:15 PM UTC",
    occurrenceCount: 3,
    status: "new",
    confidenceLabel: "high",
  },
  {
    id: "demo-evt-mention-1",
    eventType: "mention",
    title: "SignalForge mentioned in a monitored answer",
    prompt: "AI tools for perpetual futures traders",
    surface: "gemini",
    sourceHostname: null,
    sourcePath: null,
    excerpt:
      "Some answers mention SignalForge alongside whale-alert dashboards when discussing AI tools that surface funding and liquidation context for perps traders.",
    firstSeenLabel: "Jun 14, 2026 · 11:08 AM UTC",
    lastSeenLabel: "Jun 14, 2026 · 11:08 AM UTC",
    occurrenceCount: 1,
    status: "seen",
    confidenceLabel: "medium",
  },
  {
    id: "demo-evt-recommendation-1",
    eventType: "recommendation",
    title: "Atlas Notes was recommended in a monitored answer",
    prompt: "how do I journal crypto trades with market context",
    surface: "chatgpt",
    sourceHostname: "atlasnotes.io",
    sourcePath: "/product",
    excerpt:
      "If you want a lightweight trade journal with tagged setups, Atlas Notes is recommended as a focused notebook for logging perps sessions.",
    firstSeenLabel: "Jun 15, 2026 · 4:20 PM UTC",
    lastSeenLabel: "Jun 16, 2026 · 8:01 AM UTC",
    occurrenceCount: 2,
    status: "saved",
    confidenceLabel: "high",
  },
  {
    id: "demo-evt-competitor-1",
    eventType: "competitor_citation",
    title: "A configured competitor appeared in this monitored answer",
    prompt: "best smart money tracking tools for crypto",
    surface: "perplexity",
    sourceHostname: "signalforge.dev",
    sourcePath: "/compare/smart-money",
    excerpt:
      "Several answers cite signalforge.dev when discussing smart money wallets, whale flows, and labeled institutional activity for crypto traders.",
    firstSeenLabel: "Jun 10, 2026 · 3:33 PM UTC",
    lastSeenLabel: "Jun 17, 2026 · 10:44 AM UTC",
    occurrenceCount: 2,
    status: "new",
    confidenceLabel: "high",
  },
  {
    id: "demo-evt-missed-1",
    eventType: "missed_opportunity",
    title: "Your verified domain was absent from this monitored result",
    prompt: "best crypto market intelligence platforms",
    surface: "gemini",
    sourceHostname: "signalforge.dev",
    sourcePath: "/blog/crypto-intelligence-stack",
    excerpt:
      "The monitored answer recommended competing crypto intelligence sources. thrive.fi was not present in the cited sources.",
    firstSeenLabel: "Jun 11, 2026 · 7:55 AM UTC",
    lastSeenLabel: "Jun 11, 2026 · 7:55 AM UTC",
    occurrenceCount: 1,
    status: "seen",
    confidenceLabel: "medium",
  },
  {
    id: "demo-evt-citation-recurring",
    eventType: "citation",
    title: "Recurring citation for thrive.fi",
    prompt: "AI tools for perpetual futures traders",
    surface: "chatgpt",
    sourceHostname: "thrive.fi",
    sourcePath: "/",
    excerpt:
      "Thrive.fi continues to appear as a source when answers discuss AI workstations for perps traders who want signals explained with journal closure.",
    firstSeenLabel: "May 28, 2026 · 1:12 PM UTC",
    lastSeenLabel: "Jun 18, 2026 · 6:40 PM UTC",
    occurrenceCount: 5,
    status: "saved",
    confidenceLabel: "high",
  },
] as const;

export function getDemoEventById(id: string): DemoEvent | undefined {
  return DEMO_EVENTS.find((event) => event.id === id);
}

export function demoEventTypeLabel(type: CitationEventType): string {
  switch (type) {
    case "citation":
      return "Citation";
    case "mention":
      return "Mention";
    case "recommendation":
      return "Recommendation";
    case "competitor_citation":
      return "Competitor citation";
    case "missed_opportunity":
      return "Missed opportunity";
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}
