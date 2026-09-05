import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, resolve, normalize, relative } from "node:path";

export const REPO_ROOT = process.cwd();

/** @typedef {{ ruleId: string; path: string; message: string; level?: "error" | "warn" }} Finding */

/** @type {Finding[]} */
export const findings = [];

export function add(ruleId, path, message, level = "error") {
  findings.push({ ruleId, path, message, level });
}

export function listMarkdownFiles(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir)) {
    const absolute = join(dir, entry);
    const stat = statSync(absolute);
    if (stat.isDirectory()) {
      if (entry === "node_modules" || entry === ".git") continue;
      listMarkdownFiles(absolute, acc);
      continue;
    }
    if (entry.endsWith(".md")) {
      acc.push(absolute);
    }
  }
  return acc;
}

export function readText(relativePath) {
  return readFileSync(join(REPO_ROOT, relativePath), "utf8");
}

export function checkInternalLinks(filePath, content, options = {}) {
  const rel = relative(REPO_ROOT, filePath);
  const blocking =
    options.blocking ??
    (rel === "README.md" ||
      rel.startsWith("docs/") ||
      rel.startsWith("CONTRIBUTING") ||
      rel.startsWith("SECURITY"));
  const links = [...content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)];
  for (const [, target] of links) {
    if (!target || target.startsWith("http") || target.startsWith("#") || target.startsWith("mailto:")) {
      continue;
    }
    const normalized = target.split("#")[0];
    if (!normalized) continue;
    const resolved = normalize(resolve(dirname(filePath), normalized));
    if (!existsSync(resolved)) {
      add(
        "broken-relative-link",
        rel,
        `Broken relative link target: ${target}`,
        blocking ? "error" : "warn",
      );
    }
  }
}

export function checkImageReferences(filePath, content) {
  const rel = relative(REPO_ROOT, filePath);
  const images = [...content.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)];
  for (const [, alt, src] of images) {
    if (!src || src.startsWith("http")) continue;
    const resolved = normalize(resolve(dirname(filePath), src.split("#")[0]));
    if (!existsSync(resolved)) {
      add("broken-image", rel, `Broken image reference: ${src}`);
    }
    if (!alt?.trim()) {
      add("missing-alt-text", rel, `Image missing alt text: ${src}`);
    }
  }
}

export function checkMermaidBlocks(filePath, content) {
  const rel = relative(REPO_ROOT, filePath);
  const blocks = [...content.matchAll(/```mermaid\n([\s\S]*?)```/g)];
  for (const [, body] of blocks) {
    const trimmed = body.trim();
    if (!trimmed) {
      add("empty-mermaid", rel, "Empty Mermaid diagram block.");
      continue;
    }
    const firstLine = trimmed.split("\n")[0]?.trim() ?? "";
    const validStarts = [
      "graph",
      "flowchart",
      "sequenceDiagram",
      "classDiagram",
      "stateDiagram",
      "erDiagram",
      "journey",
      "gantt",
      "pie",
      "gitGraph",
      "C4Context",
    ];
    if (!validStarts.some((prefix) => firstLine.startsWith(prefix))) {
      add("invalid-mermaid", rel, `Mermaid block may be invalid: ${firstLine.slice(0, 40)}`);
    }
  }
}

export function checkForbiddenClaims(content, relativePath) {
  let publicationBlocked = true;
  try {
    const policy = JSON.parse(
      readFileSync(join(REPO_ROOT, "config/publication-policy.json"), "utf8"),
    );
    publicationBlocked = policy.publicReleaseBlocked !== false;
  } catch {
    publicationBlocked = true;
  }

  const forbidden = [
    { pattern: /github\.com\/[^\s)]+\/cited[^\s)]*\.git/i, id: "fake-clone-url", msg: "Placeholder clone URL detected." },
    { pattern: /shields\.io|img\.shields\.io/i, id: "fake-badge", msg: "Remote-dependent badge detected (Phase 16 only).", skipWhenPublished: true },
    { pattern: /\b\d{1,3}(,\d{3})+\+?\s*(users|customers|stars|downloads)\b/i, id: "fabricated-metric", msg: "Unverifiable usage metric detected." },
    { pattern: /docker pull cited/i, id: "docker-pull-claim", msg: "Public Docker pull claim before publication.", skipWhenPublished: true },
  ];
  for (const rule of forbidden) {
    if (!publicationBlocked && rule.skipWhenPublished) {
      continue;
    }
    if (rule.pattern.test(content)) {
      add(rule.id, relativePath, rule.msg);
    }
  }
}

export function extractEnvKeysFromExamples() {
  const keys = new Set();
  for (const file of [".env.example", ".env.self-hosted.example", ".env.docker.example"]) {
    const absolute = join(REPO_ROOT, file);
    if (!existsSync(absolute)) continue;
    for (const line of readFileSync(absolute, "utf8").split("\n")) {
      const match = line.match(/^([A-Z0-9_]+)=/);
      if (match) keys.add(match[1]);
    }
  }
  return keys;
}

export function extractDocumentedEnvKeys(envDocPath) {
  const absolute = join(REPO_ROOT, envDocPath);
  if (!existsSync(absolute)) return new Set();
  const keys = new Set();
  for (const line of readFileSync(absolute, "utf8").split("\n")) {
    const match = line.match(/^### `([A-Z0-9_]+)`/);
    if (match) keys.add(match[1]);
  }
  return keys;
}

export function extractPackageScripts() {
  const pkg = JSON.parse(readFileSync(join(REPO_ROOT, "package.json"), "utf8"));
  return Object.keys(pkg.scripts ?? {});
}

export function reportAndExit(label) {
  if (findings.length === 0) {
    console.log(`${label}: PASS`);
    return;
  }
  const blocking = findings.filter((f) => f.level !== "warn");
  for (const finding of findings) {
    console.error(JSON.stringify({ level: finding.level ?? "error", ...finding }));
  }
  if (blocking.length > 0) {
    console.error(`${label}: FAIL (${blocking.length} blocking)`);
    process.exit(1);
  }
  console.log(`${label}: PASS (${findings.length} warnings)`);
}
