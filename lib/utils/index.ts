export { cn } from "./cn";

export function normalizePromptText(prompt: string): string {
  return prompt.trim().replace(/\s+/g, " ").toLowerCase();
}

export function normalizeBrandName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function getHostname(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function truncateMiddle(value: string, max = 48): string {
  if (value.length <= max) return value;
  const keep = Math.floor((max - 1) / 2);
  return `${value.slice(0, keep)}…${value.slice(-keep)}`;
}
