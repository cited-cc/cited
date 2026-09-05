/**
 * Fictional demo monitors for the public /demo experience.
 * Demo account: Thrive (thrive.fi), crypto market intelligence.
 */

export type DemoMonitor = {
  id: string;
  prompt: string;
  surface: "chatgpt" | "gemini" | "perplexity";
  locationLabel: string;
  cadenceLabel: string;
  status: "active" | "paused";
  nextCheckLabel: string;
};

export const DEMO_MONITORS: DemoMonitor[] = [
  {
    id: "demo-mon-1",
    prompt: "best crypto market intelligence platforms",
    surface: "chatgpt",
    locationLabel: "United States",
    cadenceLabel: "Daily",
    status: "active",
    nextCheckLabel: "Jun 19, 2026 · 9:00 AM UTC",
  },
  {
    id: "demo-mon-2",
    prompt: "AI tools for perpetual futures traders",
    surface: "gemini",
    locationLabel: "United States",
    cadenceLabel: "Daily",
    status: "active",
    nextCheckLabel: "Jun 19, 2026 · 10:00 AM UTC",
  },
  {
    id: "demo-mon-3",
    prompt: "best smart money tracking tools for crypto",
    surface: "perplexity",
    locationLabel: "United Kingdom",
    cadenceLabel: "Every 3 days",
    status: "active",
    nextCheckLabel: "Jun 20, 2026 · 8:00 AM UTC",
  },
  {
    id: "demo-mon-4",
    prompt: "how do I journal crypto trades with market context",
    surface: "chatgpt",
    locationLabel: "United States",
    cadenceLabel: "Weekly",
    status: "paused",
    nextCheckLabel: "Paused",
  },
] as const;

export const DEMO_SIGNAL_DESK = {
  domain: "thrive.fi",
  verificationStatus: "Verified",
  activeMonitors: 3,
  recentEvidenceCount: 6,
  alertsSummary: "Email on · Weekly digest on · Slack connected (demo)",
  nextStep: "Open the Inbox to review fictional citation notes.",
} as const;
