export type ChangelogEntry = {
  id: string;
  label: string;
  area: string;
  summary: string;
};

/**
 * Public changelog of shipping product areas.
 */
export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    id: "llm-surfaces",
    label: "Available now",
    area: "AI surfaces",
    summary:
      "Monitoring covers ChatGPT, Gemini, Perplexity, and Claude through DataForSEO LLM Responses, plus Google AI Overviews and Google AI Mode through Google SERP. Plan tiers unlock surfaces: Founder (ChatGPT, Gemini), Growth (+ Perplexity), Pro (+ Claude and Google AI).",
  },
  {
    id: "docs",
    label: "Available now",
    area: "Documentation",
    summary:
      "Public docs, help center articles, terminology guidance, and support surfaces for operating Cited.",
  },
  {
    id: "export",
    label: "Available now",
    area: "Export",
    summary:
      "Workspace-scoped export tools for citation events, citation notes, notebook entries, and evidence archives.",
  },
  {
    id: "billing",
    label: "Available now",
    area: "Billing",
    summary:
      "Stripe billing management, customer portal, plan changes, usage meters, and access gating.",
  },
  {
    id: "alerts",
    label: "Available now",
    area: "Alerts",
    summary:
      "Resend email alerts, Slack alerts, weekly digests, notification preferences, and unsubscribe flows.",
  },
  {
    id: "evidence",
    label: "Available now",
    area: "Evidence",
    summary:
      "Citation detail notes, immutable evidence snapshots, occurrence history, annotations, and Notebook entries.",
  },
  {
    id: "inbox",
    label: "Available now",
    area: "Inbox",
    summary:
      "Citation Inbox with real events, filters, search, pagination, and per-member triage states.",
  },
  {
    id: "monitoring",
    label: "Available now",
    area: "Monitoring",
    summary:
      "Durable monitoring engine for configured prompts, supported AI surfaces, schedules, and citation classification.",
  },
  {
    id: "onboarding",
    label: "Available now",
    area: "Setup",
    summary:
      "Clerk authentication, Stripe-gated workspace provisioning, DNS TXT verification, and monitor configuration.",
  },
];

export const CHANGELOG_INTRO =
  "Cited is live. Entries below describe what ships in the product today.";
