/**
 * Lightweight content guard for blog/docs/LLM public copy.
 * Scans for banned AI-slop phrases and unsupported claims.
 *
 * Run: npm run content:check
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();

const SCAN_DIRS = [
  "lib/content/blog.ts",
  "components/blog",
  "components/docs/docs-llms-body.tsx",
  "app/llms.txt/route.ts",
  "app/llms-full.txt/route.ts",
  "app/(marketing)/blog",
];

/** Phrases that should never appear in affirmative marketing/editorial copy. */
const BANNED_PHRASES = [
  "in today's digital landscape",
  "in todays digital landscape",
  "unlock the power",
  "supercharge",
  "revolutionize",
  "game-changer",
  "game changer",
  "harness the power",
  "leverage ai",
  "delve into",
  "dive into",
  "cutting-edge",
  "cutting edge",
  "transform your business",
  "skyrocket",
  "ensure ai citations",
  "rank in chatgpt",
  "dominate ai search",
  "product hunt",
  "producthunt",
];

/**
 * Affirmative unsupported claims only.
 * FAQ questions and "does not" lists are allowed.
 */
const CLAIM_PATTERNS: { id: string; pattern: RegExp }[] = [
  {
    id: "global-monitoring",
    pattern:
      /\b(cited|we)\s+(monitors?|tracks?|sees?)\s+every\s+(ai|chatgpt|llm)\s+(conversation|answer|chat)/i,
  },
  {
    id: "guarantee-citations",
    pattern:
      /\b(cited|we)\s+guarantees?\s+(more\s+)?(ai\s+)?citations?\b/i,
  },
  {
    id: "guarantee-visibility",
    pattern:
      /\b(cited|we)\s+guarantees?\s+(future\s+)?(ai\s+|llm\s+)?visibility\b/i,
  },
  {
    id: "llms-txt-guarantee",
    pattern:
      /\bllms\.txt\b.{0,40}\b(guarantees?|ensures?)\b/i,
  },
];

const NEGATION_WINDOW =
  /does not|do not|don't|cannot|can not|never|no\.|what cited does not/i;

type Finding = {
  file: string;
  line: number;
  rule: string;
  excerpt: string;
};

function listFiles(entry: string): string[] {
  const abs = join(ROOT, entry);
  let stats;
  try {
    stats = statSync(abs);
  } catch {
    return [];
  }
  if (stats.isFile()) return [abs];
  if (!stats.isDirectory()) return [];

  const out: string[] = [];
  for (const name of readdirSync(abs)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    out.push(...listFiles(join(entry, name)));
  }
  return out;
}

function isNegated(line: string, matchIndex: number): boolean {
  // FAQ questions and question strings in source.
  if (line.includes("?")) return true;
  if (/^\s*question\s*:/i.test(line.trim())) return true;
  const start = Math.max(0, matchIndex - 64);
  const window = line.slice(start, matchIndex + 24);
  return NEGATION_WINDOW.test(window);
}

function scanFile(filePath: string): Finding[] {
  const findings: Finding[] = [];
  const content = readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);
  const rel = relative(ROOT, filePath);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const lower = line.toLowerCase();

    for (const phrase of BANNED_PHRASES) {
      if (lower.includes(phrase)) {
        findings.push({
          file: rel,
          line: i + 1,
          rule: `banned-phrase:${phrase}`,
          excerpt: line.trim().slice(0, 160),
        });
      }
    }

    for (const claim of CLAIM_PATTERNS) {
      const match = claim.pattern.exec(line);
      if (!match) continue;
      if (isNegated(line, match.index)) continue;
      findings.push({
        file: rel,
        line: i + 1,
        rule: `unsupported-claim:${claim.id}`,
        excerpt: line.trim().slice(0, 160),
      });
    }
  }

  return findings;
}

function main() {
  const files = SCAN_DIRS.flatMap(listFiles).filter(
    (file) =>
      file.endsWith(".ts") ||
      file.endsWith(".tsx") ||
      file.endsWith(".md") ||
      file.endsWith(".mdx"),
  );

  const findings = files.flatMap(scanFile);

  if (findings.length > 0) {
    console.error(`content-guard: ${findings.length} issue(s) found\n`);
    for (const finding of findings) {
      console.error(
        `${finding.file}:${finding.line} [${finding.rule}]\n  ${finding.excerpt}\n`,
      );
    }
    process.exit(1);
  }

  console.log(
    `content-guard: ok (${files.length} files scanned, 0 issues)`,
  );
}

main();
