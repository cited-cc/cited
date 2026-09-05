import {
  escapeHtml,
  formatSafeSourceDisplay,
  PROVENANCE_LINE,
  truncateEvidence,
  truncatePrompt,
} from "@/lib/notifications/content-safety";
import { buildAppAbsoluteUrl } from "@/lib/notifications/app-url";
import type { InstantEventNotificationType } from "@/lib/notifications/types";

export type RenderedEmail = {
  subject: string;
  html: string;
  text: string;
};

/**
 * Cited email tokens adapted from the Learn Domains transactional layout:
 * black header bar, white card, pamphlet-blue CTA, quiet gray footer.
 */
const COLORS = {
  page: "#f4f4f5",
  card: "#ffffff",
  header: "#15131a",
  headerInk: "#ffffff",
  ink: "#15131a",
  muted: "#524e5c",
  faint: "#837f8d",
  line: "#e7e0d4",
  accent: "#5ce1e6",
  accentInk: "#0a3d40",
  markAccent: "#5ce1e6",
} as const;

const FONT =
  "system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

const LINK_STYLE = `color:${COLORS.accent};text-decoration:underline;`;

function linkHtml(href: string, label: string): string {
  return `<a href="${escapeHtml(href)}" style="${LINK_STYLE}">${escapeHtml(label)}</a>`;
}

function markIconHtml(): string {
  return `<span style="display:inline-block;width:22px;height:22px;background:${COLORS.markAccent};border-radius:6px;line-height:22px;text-align:center;font-size:11px;font-weight:800;color:${COLORS.accentInk};font-family:${FONT};">C</span>`;
}

function shell(input: {
  title: string;
  bodyHtml: string;
  preheader?: string;
}): string {
  const preheader = input.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(input.preheader)}</div>`
    : "";
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="color-scheme" content="light"/>
<title>${escapeHtml(input.title)}</title>
<style type="text/css">
  a, a:link, a:visited, a:hover, a:active { color: ${COLORS.accent} !important; }
  a.cta, a.cta:link, a.cta:visited, a.cta:hover, a.cta:active {
    color: ${COLORS.accentInk} !important;
    background-color: ${COLORS.accent} !important;
    text-decoration: none !important;
  }
</style>
</head>
<body style="margin:0;padding:0;background:${COLORS.page};color:${COLORS.ink};font-family:${FONT};">
${preheader}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.page};padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:${COLORS.card};border:1px solid ${COLORS.line};border-radius:12px;overflow:hidden;">
<tr><td style="background:${COLORS.header};padding:14px 24px;">
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td style="vertical-align:middle;padding-right:10px;">${markIconHtml()}</td>
<td style="vertical-align:middle;font-family:${FONT};font-size:15px;font-weight:700;color:${COLORS.headerInk};letter-spacing:-0.01em;">Cited</td>
</tr></table>
</td></tr>
${input.bodyHtml}
</table>
</td></tr>
</table>
</body>
</html>`;
}

function footerHtml(input: {
  workspaceName?: string | null;
  reason: string;
  manageUrl: string;
  unsubscribeUrl: string;
  contactLine?: string;
}): string {
  const workspace = input.workspaceName
    ? `<p style="margin:0 0 10px;font-size:12px;line-height:1.5;color:${COLORS.faint};font-family:${FONT};">Workspace: ${escapeHtml(input.workspaceName)}</p>`
    : "";
  const contactHtml =
    input.contactLine ??
    `Questions? Just reply, a human reads every email. Or write us at ${linkHtml("mailto:hello@cited.cc", "hello@cited.cc")}.`;
  return `<tr><td style="padding:8px 28px 12px;">
<p style="margin:0;font-size:12px;line-height:1.5;color:${COLORS.faint};font-family:${FONT};">${escapeHtml(input.reason)}</p>
</td></tr>
<tr><td style="padding:20px 28px 28px;border-top:1px solid ${COLORS.line};">
${workspace}
<p style="margin:0 0 10px;font-size:12px;line-height:1.55;color:${COLORS.muted};font-family:${FONT};">${contactHtml}</p>
<p style="margin:0 0 10px;font-size:12px;line-height:1.5;color:${COLORS.faint};font-family:${FONT};">Cited · citation monitoring for AI answers · ${linkHtml("https://cited.cc", "cited.cc")} · ${linkHtml("mailto:hello@cited.cc", "hello@cited.cc")}</p>
<p style="margin:0 0 10px;font-size:12px;font-family:${FONT};">
${linkHtml(input.manageUrl, "Manage notifications")}
&nbsp;·&nbsp;
${linkHtml(input.unsubscribeUrl, "Unsubscribe")}
</p>
<p style="margin:0;font-size:12px;font-family:${FONT};">
${linkHtml("https://cited.cc", "cited.cc")}
</p>
</td></tr>`;
}

function footerText(input: {
  workspaceName?: string | null;
  reason: string;
  manageUrl: string;
  unsubscribeUrl: string;
  contactLine?: string;
}): string {
  const contact =
    input.contactLine ??
    "Questions? Just reply, a human reads every email. Or write us at hello@cited.cc.";
  const lines = [
    "---",
    input.workspaceName ? `Workspace: ${input.workspaceName}` : null,
    input.reason,
    contact,
    "Cited · citation monitoring for AI answers · cited.cc · hello@cited.cc",
    `Manage notifications: ${input.manageUrl}`,
    `Unsubscribe: ${input.unsubscribeUrl}`,
    "https://cited.cc",
  ];
  return lines.filter(Boolean).join("\n");
}

function ctaButton(label: string, href: string): string {
  return `<tr><td style="padding:8px 28px 20px;">
<a class="cta" href="${escapeHtml(href)}" style="display:inline-block;background:${COLORS.accent};background-color:${COLORS.accent};color:${COLORS.accentInk} !important;text-decoration:none;font-family:${FONT};font-size:14px;font-weight:700;line-height:1.3;padding:12px 20px;border-radius:8px;mso-line-height-rule:exactly;">
<!--[if mso]><i style="letter-spacing:20px;mso-font-width:-100%;mso-text-raise:18pt;">&nbsp;</i><![endif]-->
<span style="color:${COLORS.accentInk} !important;text-decoration:none;">${escapeHtml(label)}</span>
<!--[if mso]><i style="letter-spacing:20px;mso-font-width:-100%;">&nbsp;</i><![endif]-->
</a>
</td></tr>`;
}

function headingBlock(input: {
  headline: string;
  greeting?: string;
  paragraphs: string[];
}): string {
  const greeting = input.greeting
    ? `<p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:${COLORS.ink};font-family:${FONT};">${escapeHtml(input.greeting)}</p>`
    : "";
  const paras = input.paragraphs
    .map(
      (p) =>
        `<p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:${COLORS.ink};font-family:${FONT};">${escapeHtml(p)}</p>`,
    )
    .join("");
  return `<tr><td style="padding:28px 28px 8px;">
<h1 style="margin:0 0 18px;font-size:22px;line-height:1.35;color:${COLORS.ink};font-weight:700;font-family:${FONT};letter-spacing:-0.02em;">${escapeHtml(input.headline)}</h1>
${greeting}
${paras}
</td></tr>`;
}

function metaRow(label: string, value: string): string {
  return `<tr>
<td style="padding:4px 0;font-size:12px;color:${COLORS.muted};font-family:${FONT};width:140px;vertical-align:top;">${escapeHtml(label)}</td>
<td style="padding:4px 0;font-size:13px;color:${COLORS.ink};font-family:${FONT};">${escapeHtml(value)}</td>
</tr>`;
}

export function instantEventSubject(input: {
  notificationType: InstantEventNotificationType;
  domainOrBrand?: string | null;
}): string {
  const label = input.domainOrBrand?.trim() || null;
  switch (input.notificationType) {
    case "new_citation":
      return label
        ? `New citation found for ${label}`
        : "New citation found";
    case "new_mention":
      return label
        ? `${label} was mentioned in a monitored AI answer`
        : "Brand mention found";
    case "new_recommendation":
      return label
        ? `${label} was recommended in a monitored AI answer`
        : "Recommendation found";
    case "new_competitor_citation":
      return "Configured competitor cited in a monitored answer";
    case "new_missed_opportunity":
      return "Missed opportunity found for a monitored prompt";
    case "renewed_citation":
      return label
        ? `Citation observed again for ${label}`
        : "Citation observed again";
    default: {
      const _exhaustive: never = input.notificationType;
      return _exhaustive;
    }
  }
}

export function instantEventHeader(
  notificationType: InstantEventNotificationType,
): string {
  switch (notificationType) {
    case "new_citation":
      return "New citation found";
    case "new_mention":
      return "Brand mention found";
    case "new_recommendation":
      return "Recommendation found";
    case "new_competitor_citation":
      return "Competitor citation found";
    case "new_missed_opportunity":
      return "Missed opportunity found";
    case "renewed_citation":
      return "Citation observed again";
    default: {
      const _exhaustive: never = notificationType;
      return _exhaustive;
    }
  }
}

export function renderInstantEventAlert(input: {
  notificationType: InstantEventNotificationType;
  workspaceName?: string | null;
  domainOrBrand?: string | null;
  aiSurface: string;
  promptText?: string | null;
  firstSeenAt?: string | null;
  observedAt?: string | null;
  eventTypeLabel: string;
  evidenceExcerpt?: string | null;
  sourceDisplay?: string | null;
  eventId: string;
  manageUrl: string;
  unsubscribeUrl: string;
}): RenderedEmail {
  const subject = instantEventSubject({
    notificationType: input.notificationType,
    domainOrBrand: input.domainOrBrand,
  });
  const header = instantEventHeader(input.notificationType);
  const ctaUrl = buildAppAbsoluteUrl(`/app/inbox/${input.eventId}`);
  const prompt = input.promptText ? truncatePrompt(input.promptText) : null;
  const evidence = input.evidenceExcerpt
    ? truncateEvidence(input.evidenceExcerpt)
    : null;
  const source =
    formatSafeSourceDisplay(input.sourceDisplay) ?? input.sourceDisplay ?? null;

  const summary = `${header}. ${PROVENANCE_LINE}`;

  const bodyHtml = `
${headingBlock({
  headline: "New citation note",
  paragraphs: [summary],
})}
<tr><td style="padding:8px 28px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${metaRow("AI surface", input.aiSurface)}
${prompt ? metaRow("Prompt", prompt) : ""}
${input.firstSeenAt ? metaRow("First seen by Cited", input.firstSeenAt) : ""}
${input.observedAt ? metaRow("Observed by Cited", input.observedAt) : ""}
${metaRow("Event type", input.eventTypeLabel)}
</table>
</td></tr>
${
  evidence || source
    ? `<tr><td style="padding:0 28px 16px;">
<div style="border-left:3px solid ${COLORS.accent};padding:12px 14px;background:#f8fafb;">
<p style="margin:0 0 6px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${COLORS.accentInk};font-family:${FONT};font-weight:700;">Evidence</p>
${evidence ? `<p style="margin:0;font-size:14px;line-height:1.5;color:${COLORS.ink};font-family:${FONT};">${escapeHtml(evidence)}</p>` : ""}
${source ? `<p style="margin:8px 0 0;font-size:12px;color:${COLORS.muted};font-family:ui-monospace,Menlo,Consolas,monospace;">${escapeHtml(source)}</p>` : ""}
<p style="margin:10px 0 0;font-size:11px;color:${COLORS.muted};font-family:${FONT};">${escapeHtml(PROVENANCE_LINE)}</p>
</div>
</td></tr>`
    : ""
}
${ctaButton("Open citation note", ctaUrl)}
${footerHtml({
  workspaceName: input.workspaceName,
  reason:
    "You received this because instant citation alerts are enabled for your Cited workspace.",
  manageUrl: input.manageUrl,
  unsubscribeUrl: input.unsubscribeUrl,
})}`;

  const text = [
    "Cited",
    "",
    "New citation note",
    summary,
    "",
    `AI surface: ${input.aiSurface}`,
    prompt ? `Prompt: ${prompt}` : null,
    input.firstSeenAt ? `First seen by Cited: ${input.firstSeenAt}` : null,
    input.observedAt ? `Observed by Cited: ${input.observedAt}` : null,
    `Event type: ${input.eventTypeLabel}`,
    evidence ? `Evidence: ${evidence}` : null,
    source ? `Source: ${source}` : null,
    "",
    `Open citation note: ${ctaUrl}`,
    "",
    footerText({
      workspaceName: input.workspaceName,
      reason:
        "You received this because instant citation alerts are enabled for your Cited workspace.",
      manageUrl: input.manageUrl,
      unsubscribeUrl: input.unsubscribeUrl,
    }),
  ]
    .filter((line) => line !== null)
    .join("\n");

  return {
    subject,
    html: shell({ title: subject, bodyHtml, preheader: header }),
    text,
  };
}

export function renderMonitorIssueAlert(input: {
  subject: string;
  headline: string;
  whatHappened: string;
  affectedMonitorCount?: number | null;
  safeReason: string;
  nextAction: string;
  ctaLabel: string;
  ctaPath: string;
  workspaceName?: string | null;
  manageUrl: string;
  unsubscribeUrl: string;
}): RenderedEmail {
  const ctaUrl = buildAppAbsoluteUrl(input.ctaPath);
  const bodyHtml = `
${headingBlock({
  headline: input.headline,
  paragraphs: [input.whatHappened],
})}
<tr><td style="padding:8px 28px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${
  typeof input.affectedMonitorCount === "number"
    ? metaRow("Affected monitors", String(input.affectedMonitorCount))
    : ""
}
${metaRow("Reason", input.safeReason)}
${metaRow("Next step", input.nextAction)}
</table>
</td></tr>
${ctaButton(input.ctaLabel, ctaUrl)}
${footerHtml({
  workspaceName: input.workspaceName,
  reason:
    "You received this because monitor issue alerts are enabled for your Cited workspace.",
  manageUrl: input.manageUrl,
  unsubscribeUrl: input.unsubscribeUrl,
})}`;

  const text = [
    "Cited",
    "",
    input.headline,
    input.whatHappened,
    "",
    typeof input.affectedMonitorCount === "number"
      ? `Affected monitors: ${input.affectedMonitorCount}`
      : null,
    `Reason: ${input.safeReason}`,
    `Next step: ${input.nextAction}`,
    "",
    `${input.ctaLabel}: ${ctaUrl}`,
    "",
    footerText({
      workspaceName: input.workspaceName,
      reason:
        "You received this because monitor issue alerts are enabled for your Cited workspace.",
      manageUrl: input.manageUrl,
      unsubscribeUrl: input.unsubscribeUrl,
    }),
  ]
    .filter((line) => line !== null)
    .join("\n");

  return {
    subject: input.subject,
    html: shell({
      title: input.subject,
      bodyHtml,
      preheader: input.headline,
    }),
    text,
  };
}

export type DigestHighlight = {
  title: string;
  eventTypeLabel: string;
  aiSurface: string;
  eventId: string;
};

export type DigestCounts = {
  citations: number;
  mentions: number;
  recommendations: number;
  missedOpportunities: number;
  competitorCitations: number;
  monitorIssues: number;
  recurringObservations: number;
};

export function renderWeeklyDigest(input: {
  workspaceName?: string | null;
  periodLabel: string;
  counts: DigestCounts;
  highlights: DigestHighlight[];
  isEmpty: boolean;
  activeMonitors?: number;
  blockedMonitors?: number;
  manageUrl: string;
  unsubscribeUrl: string;
}): RenderedEmail {
  const subject = "Weekly citation digest";
  const inboxUrl = buildAppAbsoluteUrl("/app/inbox");

  if (input.isEmpty) {
    const emptyCopy =
      "No new citation evidence this week. Cited did not find new citation, mention, recommendation, or configured competitor events in the monitored prompts for this workspace during this digest period.";
    const bodyHtml = `
${headingBlock({
  headline: "Weekly citation digest",
  paragraphs: [input.periodLabel, emptyCopy],
})}
${ctaButton("Open Inbox", inboxUrl)}
${footerHtml({
  workspaceName: input.workspaceName,
  reason:
    "You received this because weekly digest email is enabled for your Cited workspace.",
  manageUrl: input.manageUrl,
  unsubscribeUrl: input.unsubscribeUrl,
})}`;
    return {
      subject,
      html: shell({ title: subject, bodyHtml, preheader: subject }),
      text: [
        "Cited",
        "",
        "Weekly citation digest",
        input.periodLabel,
        "",
        emptyCopy,
        "",
        `Open Inbox: ${inboxUrl}`,
        "",
        footerText({
          workspaceName: input.workspaceName,
          reason:
            "You received this because weekly digest email is enabled for your Cited workspace.",
          manageUrl: input.manageUrl,
          unsubscribeUrl: input.unsubscribeUrl,
        }),
      ].join("\n"),
    };
  }

  const c = input.counts;
  const summaryLines = [
    c.citations > 0
      ? `${c.citations} new citation${c.citations === 1 ? "" : "s"}`
      : null,
    c.mentions > 0
      ? `${c.mentions} mention${c.mentions === 1 ? "" : "s"}`
      : null,
    c.recommendations > 0
      ? `${c.recommendations} recommendation${c.recommendations === 1 ? "" : "s"}`
      : null,
    c.missedOpportunities > 0
      ? `${c.missedOpportunities} missed opportunit${c.missedOpportunities === 1 ? "y" : "ies"}`
      : null,
    c.competitorCitations > 0
      ? `${c.competitorCitations} competitor citation${c.competitorCitations === 1 ? "" : "s"}`
      : null,
    c.monitorIssues > 0
      ? `${c.monitorIssues} monitor issue${c.monitorIssues === 1 ? "" : "s"}`
      : null,
  ].filter(Boolean) as string[];

  const highlightHtml = input.highlights
    .slice(0, 5)
    .map((h) => {
      const url = buildAppAbsoluteUrl(`/app/inbox/${h.eventId}`);
      return `<p style="margin:0 0 12px;font-size:14px;line-height:1.45;font-family:${FONT};">
<strong style="color:${COLORS.ink};">${escapeHtml(h.title)}</strong><br/>
<span style="color:${COLORS.muted};font-size:12px;">${escapeHtml(h.aiSurface)} · ${escapeHtml(h.eventTypeLabel)}</span><br/>
<a href="${escapeHtml(url)}" style="${LINK_STYLE}font-size:12px;">Open note</a>
</p>`;
    })
    .join("");

  const bodyHtml = `
${headingBlock({
  headline: "Weekly citation digest",
  paragraphs: [
    input.periodLabel,
    summaryLines.join(" · ") || "Activity this week",
  ],
})}
${
  input.highlights.length
    ? `<tr><td style="padding:8px 28px 16px;">
<p style="margin:0 0 12px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${COLORS.accentInk};font-family:${FONT};font-weight:700;">Highlights</p>
${highlightHtml}
</td></tr>`
    : ""
}
${
  typeof input.activeMonitors === "number" ||
  typeof input.blockedMonitors === "number"
    ? `<tr><td style="padding:0 28px 16px;">
<p style="margin:0 0 8px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${COLORS.accentInk};font-family:${FONT};font-weight:700;">Monitor health</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${typeof input.activeMonitors === "number" ? metaRow("Active monitors", String(input.activeMonitors)) : ""}
${typeof input.blockedMonitors === "number" ? metaRow("Blocked monitors", String(input.blockedMonitors)) : ""}
</table>
</td></tr>`
    : ""
}
${ctaButton("Open Inbox", inboxUrl)}
${footerHtml({
  workspaceName: input.workspaceName,
  reason:
    "You received this because weekly digest email is enabled for your Cited workspace.",
  manageUrl: input.manageUrl,
  unsubscribeUrl: input.unsubscribeUrl,
})}`;

  const text = [
    "Cited",
    "",
    "Weekly citation digest",
    input.periodLabel,
    "",
    "This week:",
    ...summaryLines.map((l) => `- ${l}`),
    "",
    ...input.highlights.slice(0, 5).flatMap((h) => [
      `${h.title} (${h.aiSurface} · ${h.eventTypeLabel})`,
      buildAppAbsoluteUrl(`/app/inbox/${h.eventId}`),
      "",
    ]),
    `Open Inbox: ${inboxUrl}`,
    "",
    footerText({
      workspaceName: input.workspaceName,
      reason:
        "You received this because weekly digest email is enabled for your Cited workspace.",
      manageUrl: input.manageUrl,
      unsubscribeUrl: input.unsubscribeUrl,
    }),
  ].join("\n");

  return {
    subject,
    html: shell({ title: subject, bodyHtml, preheader: subject }),
    text,
  };
}

export function renderFreeScanResult(input: {
  domain: string;
  questionsChecked: number;
  citationNotesFound: number;
  resultUrl: string;
  manageUrl: string;
  unsubscribeUrl: string;
}): RenderedEmail {
  const subject = "Your Cited scan result is ready";
  const bodyHtml = `
${headingBlock({
  headline: "Your private citation snapshot is ready",
  greeting: "Hi there,",
  paragraphs: [
    "Cited checked the questions you asked against monitored AI surfaces and saved what it found for your domain.",
  ],
})}
<tr><td style="padding:8px 28px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${metaRow("Domain", input.domain)}
${metaRow("Questions checked", String(input.questionsChecked))}
${metaRow("Citation notes found", String(input.citationNotesFound))}
</table>
</td></tr>
${ctaButton("View private result", input.resultUrl)}
${footerHtml({
  reason:
    "You received this because you requested a Cited free citation scan.",
  manageUrl: input.manageUrl,
  unsubscribeUrl: input.unsubscribeUrl,
})}`;

  const text = [
    "Cited",
    "",
    "Your private citation snapshot is ready.",
    "Hi there,",
    "",
    `Domain: ${input.domain}`,
    `Questions checked: ${input.questionsChecked}`,
    `Citation notes found: ${input.citationNotesFound}`,
    "",
    `View private result: ${input.resultUrl}`,
    "",
    footerText({
      reason:
        "You received this because you requested a Cited free citation scan.",
      manageUrl: input.manageUrl,
      unsubscribeUrl: input.unsubscribeUrl,
    }),
  ].join("\n");

  return {
    subject,
    html: shell({ title: subject, bodyHtml, preheader: subject }),
    text,
  };
}

export type LifecycleEmailKind =
  | "welcome_day_0"
  | "welcome_day_2"
  | "welcome_day_5"
  | "welcome_day_10"
  | "welcome_day_14"
  | "learn_domains_day_21";

export function renderLifecycleEmail(input: {
  kind: LifecycleEmailKind;
  workspaceName?: string | null;
  firstName?: string | null;
  domainOrBrand?: string | null;
  ctaUrl: string;
  manageUrl: string;
  unsubscribeUrl: string;
}): RenderedEmail {
  const greeting = input.firstName?.trim()
    ? `Hi ${input.firstName.trim()},`
    : "Hi there,";
  const brand = input.domainOrBrand?.trim() || "your domain";
  const workspace = input.workspaceName?.trim() || "your workspace";

  const copy = lifecycleCopy(input.kind, { brand, workspace });

  const bodyHtml = `
${headingBlock({
  headline: copy.headline,
  greeting,
  paragraphs: copy.paragraphs,
})}
${ctaButton(copy.ctaLabel, input.ctaUrl)}
${footerHtml({
  workspaceName: input.workspaceName,
  reason: copy.reason,
  manageUrl: input.manageUrl,
  unsubscribeUrl: input.unsubscribeUrl,
})}`;

  const text = [
    "Cited",
    "",
    copy.headline,
    greeting,
    "",
    ...copy.paragraphs,
    "",
    `${copy.ctaLabel}: ${input.ctaUrl}`,
    "",
    footerText({
      workspaceName: input.workspaceName,
      reason: copy.reason,
      manageUrl: input.manageUrl,
      unsubscribeUrl: input.unsubscribeUrl,
    }),
  ].join("\n");

  return {
    subject: copy.subject,
    html: shell({
      title: copy.subject,
      bodyHtml,
      preheader: copy.preheader,
    }),
    text,
  };
}

function lifecycleCopy(
  kind: LifecycleEmailKind,
  ctx: { brand: string; workspace: string },
): {
  subject: string;
  preheader: string;
  headline: string;
  paragraphs: string[];
  ctaLabel: string;
  reason: string;
} {
  switch (kind) {
    case "welcome_day_0":
      return {
        subject: "You are in",
        preheader: "Cited is watching the questions that matter.",
        headline: "You are in",
        paragraphs: [
          `Cited is set up for ${ctx.workspace}. From here, the work is simple: watch the prompts that matter, and keep every citation, mention, and miss tied to proof you can open.`,
          "Add the first prompts you care about. Cited starts collecting evidence on the schedule you chose.",
        ],
        ctaLabel: "Open Cited",
        reason:
          "You received this because you started a Cited workspace. Product tips only. Not legal, tax, or investment advice.",
      };
    case "welcome_day_2":
      return {
        subject: "Watch the questions that matter",
        preheader: "Pick prompts like a portfolio, not a wishlist.",
        headline: "Watch the questions that matter",
        paragraphs: [
          "Cited does not pretend to see every private AI chat. It monitors the prompts you choose across the surfaces you enable.",
          "Start with category questions, competitor comparisons, and the problem statements your buyers already ask. Those are the rooms where proof pays.",
        ],
        ctaLabel: "Add prompts",
        reason:
          "You received this as part of the Cited welcome series for paying workspaces.",
      };
    case "welcome_day_5":
      return {
        subject: "How to read a citation note",
        preheader: "Citation, mention, recommendation, miss. Different signals.",
        headline: "How to read a citation note",
        paragraphs: [
          "A citation is sourceproof. A mention is name presence without the link. A recommendation is you in the shortlist. A missed opportunity is the room you should have been in.",
          "Open the inbox. Open the note. Keep what holds up. That is the whole rhythm.",
        ],
        ctaLabel: "Open Inbox",
        reason:
          "You received this as part of the Cited welcome series for paying workspaces.",
      };
    case "welcome_day_10":
      return {
        subject: "Alerts without noise",
        preheader: "Instant notes when something changes. Digest when you want the week.",
        headline: "Alerts without noise",
        paragraphs: [
          "Turn on instant alerts for the events that move the room. Keep the weekly digest for the calm readout.",
          "You can mute categories, stop recurring noise, and leave Slack for the moments that deserve it.",
        ],
        ctaLabel: "Manage notifications",
        reason:
          "You received this as part of the Cited welcome series for paying workspaces.",
      };
    case "welcome_day_14":
      return {
        subject: "Two weeks of proof",
        preheader: `Review what Cited has recorded for ${ctx.brand}.`,
        headline: "Two weeks of proof",
        paragraphs: [
          `By now, Cited should have a first pass of evidence for ${ctx.brand}. Review the inbox. Tighten weak prompts. Keep the ones that produce clean signals.`,
          "If a monitor is quiet, that is still information. Quiet is either a coverage choice or a content problem waiting for a next move.",
        ],
        ctaLabel: "Review Inbox",
        reason:
          "You received this as part of the Cited welcome series for paying workspaces.",
      };
    case "learn_domains_day_21":
      return {
        subject: "Your Cited signals have a next move",
        preheader: "Three weeks of proof. Now close the gaps.",
        headline: "Turn Cited gaps into better answers",
        paragraphs: [
          `You have been monitoring ${ctx.brand} for three weeks. By now the inbox shows where AI cites you, where it only mentions you, and where it leaves you out.`,
          "Cited finds the signal. Learn Domains is built to act on it: page audits, supporting content, internal links, topic clusters, and structure work that make the prompts you already watch harder to miss.",
          "When a competitor keeps winning the citation, or a prompt stays empty, that is not a dashboard problem. That is a domain problem. Learn Domains is the handoff.",
        ],
        ctaLabel: "Improve this in Learn Domains",
        reason:
          "You received this because you have been a paying Cited customer for 21 days. Optional product tip. Not legal, tax, or investment advice.",
      };
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}
