/**
 * In-app help copy and empty-state education strings.
 * Keep short, truthful, and linked to docs where useful.
 */

export const HELP_MENU_ITEMS = [
  { href: "/docs", label: "Read docs", external: true },
  { href: "/docs/getting-started", label: "Getting started", external: true },
  { href: "/docs/troubleshooting", label: "Troubleshooting", external: true },
  { href: "/docs/contact", label: "Contact support", external: true },
  { href: "/app/settings#export", label: "Export evidence", external: false },
  { href: "#keyboard-shortcuts", label: "Keyboard shortcuts", external: false },
] as const;

export const KEYBOARD_SHORTCUTS = [
  {
    id: "command-palette",
    keys: "⌘K / Ctrl+K",
    description: "Open the command palette",
  },
  {
    id: "inbox-search",
    keys: "/",
    description: "Focus Inbox search when the Inbox is open",
  },
] as const;

export const EMPTY_STATE_COPY = {
  inboxNoMonitors: {
    title: "No citation notes yet.",
    description:
      "Add prompts, verify your domain, and activate a supported AI surface. Cited will collect evidence here when monitored results include your domain, mention your brand, or show a configured competitor while you are absent.",
    primaryLabel: "Open monitors",
    primaryHref: "/app/monitors",
    docsLabel: "Learn how the Inbox works",
    docsHref: "/docs/citation-inbox",
  },
  inboxNoEvidence: {
    title: "No citation notes yet.",
    description:
      "Cited is monitoring the prompts you configured. When your verified domain appears, gets mentioned, or is absent beside a configured competitor, the evidence will appear here.",
    primaryLabel: "Review monitors",
    primaryHref: "/app/monitors",
    docsLabel: "Learn how the Inbox works",
    docsHref: "/docs/citation-inbox",
  },
  monitorsEmpty: {
    title: "No monitors yet.",
    description:
      "A monitor watches one prompt across the AI surfaces included in your plan. Start with the buyer questions that matter most.",
    primaryLabel: "Add a prompt",
    primaryHref: "/app/monitors",
    docsLabel: "Prompt strategy",
    docsHref: "/docs/monitored-prompts",
  },
  notebookEmpty: {
    title: "Notebook is empty.",
    description:
      "Use Notebook to preserve context around citation evidence. It is not a full team wiki.",
    primaryLabel: "Open Inbox",
    primaryHref: "/app/inbox",
    docsLabel: "Notebook docs",
    docsHref: "/docs/notebook",
  },
  settingsEmptyDomain: {
    title: "No domain configured.",
    description:
      "Verify a domain before Cited can attribute citation evidence to your website.",
    primaryLabel: "Add domain",
    primaryHref: "/onboarding?step=2",
    docsLabel: "Domain verification",
    docsHref: "/docs/domain-verification",
  },
  billingViewer: {
    title: "Billing is managed by owners and admins.",
    description:
      "You can review plan limits in docs. Ask a workspace owner or admin to change the plan.",
    primaryLabel: "Read billing docs",
    primaryHref: "/docs/billing-and-limits",
  },
} as const;

export const SETUP_CHECKLIST_ITEMS = [
  {
    id: "workspace",
    label: "Create workspace",
    href: "/app",
    docsHref: "/docs/getting-started",
    ownerOnly: false,
  },
  {
    id: "domain",
    label: "Add domain",
    href: "/app/settings/domains",
    docsHref: "/docs/domain-verification",
    ownerOnly: true,
  },
  {
    id: "verify",
    label: "Verify domain",
    href: "/app/settings/domains",
    docsHref: "/docs/domain-verification",
    ownerOnly: true,
  },
  {
    id: "brand",
    label: "Add brand context",
    href: "/app/settings/domains",
    docsHref: "/docs/domain-verification",
    ownerOnly: true,
  },
  {
    id: "prompts",
    label: "Add monitored prompts",
    href: "/app/monitors",
    docsHref: "/docs/monitored-prompts",
    ownerOnly: false,
  },
  {
    id: "surfaces",
    label: "Select AI surfaces",
    href: "/app/monitors",
    docsHref: "/docs/ai-surfaces",
    ownerOnly: false,
  },
  {
    id: "activate",
    label: "Activate monitoring",
    href: "/app/monitors",
    docsHref: "/docs/getting-started",
    ownerOnly: false,
  },
  {
    id: "notifications",
    label: "Set notification preferences",
    href: "/app/settings/notifications",
    docsHref: "/docs/alerts-and-digests",
    ownerOnly: false,
  },
  {
    id: "first_note",
    label: "Review first citation note",
    href: "/app/inbox",
    docsHref: "/docs/citation-inbox",
    ownerOnly: false,
  },
] as const;

export type SetupChecklistItemId =
  (typeof SETUP_CHECKLIST_ITEMS)[number]["id"];
