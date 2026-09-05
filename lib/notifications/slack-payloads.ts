import {
  formatSafeSourceDisplay,
  PROVENANCE_LINE,
  truncateEvidence,
  truncatePrompt,
} from "@/lib/notifications/content-safety";
import { buildAppAbsoluteUrl } from "@/lib/notifications/app-url";
import type { SlackBlockPayload } from "@/lib/notifications/providers/slack";
import {
  instantEventHeader,
  type DigestCounts,
  type DigestHighlight,
} from "@/emails/templates";
import type { InstantEventNotificationType } from "@/lib/notifications/types";

export function buildInstantEventSlackPayload(input: {
  notificationType: InstantEventNotificationType;
  aiSurface: string;
  eventTypeLabel: string;
  promptText?: string | null;
  evidenceExcerpt?: string | null;
  sourceDisplay?: string | null;
  eventId: string;
  firstSeenLabel?: string | null;
}): SlackBlockPayload {
  const header = instantEventHeader(input.notificationType);
  const prompt = input.promptText ? truncatePrompt(input.promptText) : null;
  const evidence = input.evidenceExcerpt
    ? truncateEvidence(input.evidenceExcerpt)
    : null;
  const source = formatSafeSourceDisplay(input.sourceDisplay);
  const ctaUrl = buildAppAbsoluteUrl(`/app/inbox/${input.eventId}`);

  const contextParts = [
    input.aiSurface,
    input.eventTypeLabel,
    input.firstSeenLabel ? "First seen by Cited" : null,
  ].filter(Boolean);

  const evidenceLine =
    evidence ||
    (source
      ? `${source} appeared as a source in a monitored result.`
      : PROVENANCE_LINE);

  const blocks: unknown[] = [
    {
      type: "header",
      text: { type: "plain_text", text: header, emoji: false },
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: contextParts.join(" · "),
        },
      ],
    },
  ];

  if (prompt) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `*Prompt*\n“${prompt}”` },
    });
  }

  blocks.push({
    type: "section",
    text: { type: "mrkdwn", text: `*Evidence*\n${evidenceLine}` },
  });

  blocks.push({
    type: "actions",
    elements: [
      {
        type: "button",
        text: { type: "plain_text", text: "Open citation note", emoji: false },
        url: ctaUrl,
      },
    ],
  });

  return {
    text: `${header} · ${input.aiSurface}`,
    blocks,
  };
}

export function buildMonitorIssueSlackPayload(input: {
  headline: string;
  safeReason: string;
  ctaLabel: string;
  ctaPath: string;
}): SlackBlockPayload {
  const ctaUrl = buildAppAbsoluteUrl(input.ctaPath);
  return {
    text: input.headline,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: input.headline, emoji: false },
      },
      {
        type: "section",
        text: { type: "mrkdwn", text: input.safeReason },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: input.ctaLabel, emoji: false },
            url: ctaUrl,
          },
        ],
      },
    ],
  };
}

export function buildWeeklyDigestSlackPayload(input: {
  counts: DigestCounts;
  highlights: DigestHighlight[];
  isEmpty: boolean;
}): SlackBlockPayload {
  const inboxUrl = buildAppAbsoluteUrl("/app/inbox");
  if (input.isEmpty) {
    return {
      text: "Cited weekly digest: no new citation evidence this week.",
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "Cited weekly digest",
            emoji: false,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "No new citation evidence this week.",
          },
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: { type: "plain_text", text: "Open Inbox", emoji: false },
              url: inboxUrl,
            },
          ],
        },
      ],
    };
  }

  const c = input.counts;
  const lines = [
    `${c.citations} new citation${c.citations === 1 ? "" : "s"}`,
    `${c.mentions} mention${c.mentions === 1 ? "" : "s"}`,
    `${c.missedOpportunities} missed opportunit${c.missedOpportunities === 1 ? "y" : "ies"}`,
    `${c.monitorIssues} monitor issue${c.monitorIssues === 1 ? "" : "s"}`,
  ];

  const highlightLines = input.highlights
    .slice(0, 3)
    .map((h) => `• ${h.title} (${h.aiSurface})`)
    .join("\n");

  return {
    text: `Cited weekly digest: ${lines.join(", ")}`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "Cited weekly digest",
          emoji: false,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*This week:*\n${lines.map((l) => `• ${l}`).join("\n")}`,
        },
      },
      ...(highlightLines
        ? [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*Highlights*\n${highlightLines}`,
              },
            },
          ]
        : []),
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "Open Inbox", emoji: false },
            url: inboxUrl,
          },
        ],
      },
    ],
  };
}
