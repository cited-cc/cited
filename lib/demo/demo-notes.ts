/**
 * Fictional notebook notes, annotations, occurrences, and alert previews.
 * Demo account: Thrive (thrive.fi), crypto market intelligence.
 */

export type DemoOccurrence = {
  id: string;
  seenAtLabel: string;
  surface: "chatgpt" | "gemini" | "perplexity";
  excerpt: string;
};

export type DemoAnnotation = {
  id: string;
  authorLabel: string;
  body: string;
  createdAtLabel: string;
  resolved: boolean;
};

export type DemoNotebookNote = {
  id: string;
  title: string;
  body: string;
  linkedEventId: string;
  updatedAtLabel: string;
  pinned: boolean;
};

export const DEMO_OCCURRENCES: Record<string, DemoOccurrence[]> = {
  "demo-evt-citation-1": [
    {
      id: "occ-1a",
      seenAtLabel: "Jun 18, 2026 · 2:15 PM UTC",
      surface: "chatgpt",
      excerpt:
        "thrive.fi appears as an AI research workstation that links signals, on-chain context, and a trade journal.",
    },
    {
      id: "occ-1b",
      seenAtLabel: "Jun 15, 2026 · 9:10 AM UTC",
      surface: "chatgpt",
      excerpt:
        "Traders evaluating crypto market intelligence platforms often see thrive.fi listed among focused options for perps desks.",
    },
    {
      id: "occ-1c",
      seenAtLabel: "Jun 12, 2026 · 9:42 AM UTC",
      surface: "chatgpt",
      excerpt:
        "For CEX perpetuals traders who want signals with journal closure, thrive.fi is cited as a source for market intelligence.",
    },
  ],
  "demo-evt-citation-recurring": [
    {
      id: "occ-r1",
      seenAtLabel: "Jun 18, 2026 · 6:40 PM UTC",
      surface: "chatgpt",
      excerpt:
        "Thrive.fi continues to appear when answers discuss AI tools for perpetual futures traders.",
    },
    {
      id: "occ-r2",
      seenAtLabel: "Jun 10, 2026 · 12:05 PM UTC",
      surface: "chatgpt",
      excerpt:
        "AI research workstations such as those described on thrive.fi are mentioned again for perps workflows.",
    },
    {
      id: "occ-r3",
      seenAtLabel: "May 28, 2026 · 1:12 PM UTC",
      surface: "chatgpt",
      excerpt:
        "First recorded appearance of thrive.fi as a source for this monitored prompt.",
    },
  ],
};

export const DEMO_ANNOTATIONS: DemoAnnotation[] = [
  {
    id: "demo-ann-1",
    authorLabel: "Demo teammate",
    body: "Worth saving. This is the cleanest citation wording we have seen for the market intelligence prompt.",
    createdAtLabel: "Jun 18, 2026 · 3:02 PM UTC",
    resolved: false,
  },
  {
    id: "demo-ann-2",
    authorLabel: "Demo teammate",
    body: "Competitor still wins on Gemini for the same question. Track as a missed opportunity.",
    createdAtLabel: "Jun 11, 2026 · 8:20 AM UTC",
    resolved: true,
  },
] as const;

export const DEMO_NOTEBOOK_NOTES: DemoNotebookNote[] = [
  {
    id: "demo-note-1",
    title: "Thrive citation pattern on ChatGPT",
    body: "Fictional notebook entry. ChatGPT has cited thrive.fi three times for the crypto market intelligence prompt. Keep watching Gemini for the same question.",
    linkedEventId: "demo-evt-citation-1",
    updatedAtLabel: "Jun 18, 2026",
    pinned: true,
  },
  {
    id: "demo-note-2",
    title: "Missed opportunity follow-up",
    body: "Fictional notebook entry. Gemini recommended a competitor while our verified domain was absent. Capture for content planning later.",
    linkedEventId: "demo-evt-missed-1",
    updatedAtLabel: "Jun 11, 2026",
    pinned: false,
  },
] as const;

export const DEMO_WEEKLY_DIGEST = {
  subject: "Your weekly citation digest (demo)",
  summary:
    "This week’s fictional digest: 2 new citations, 1 mention, 1 missed opportunity across 4 monitored prompts.",
  highlights: [
    "Citation found for thrive.fi on ChatGPT",
    "Missed opportunity on Gemini for the same prompt family",
    "Recurring citation reached 5 occurrences",
  ],
} as const;

export const DEMO_EMAIL_ALERT = {
  subject: "New citation evidence (demo)",
  headline: "New citation evidence",
  body: "Citation found for thrive.fi · ChatGPT · best crypto market intelligence platforms",
  footer: "Fictional email preview. No message was sent.",
} as const;

export const DEMO_BILLING_PREVIEW = {
  planName: "Founder (demo)",
  priceLabel: "$19/month",
  promptsUsed: "4 of 10",
  surfaces: "ChatGPT, Gemini, Perplexity",
  note: "Billing preview only. Demo mode cannot start checkout or change plans.",
} as const;
