/**
 * Safe Markdown escaping for evidence exports.
 * Do not render HTML.
 */

export function escapeMarkdown(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\*/g, "\\*")
    .replace(/_/g, "\\_")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function markdownHeading(level: 1 | 2 | 3, text: string): string {
  return `${"#".repeat(level)} ${escapeMarkdown(text)}`;
}

export function markdownField(label: string, value: string | null | undefined): string {
  return `**${escapeMarkdown(label)}:** ${escapeMarkdown(value ?? "-")}`;
}
