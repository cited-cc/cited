#!/usr/bin/env node
/**
 * Documentation asset validation.
 */
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import {
  REPO_ROOT,
  add,
  listMarkdownFiles,
  readText,
  reportAndExit,
} from "./lib.mjs";

const SCREENSHOT_DIR = "docs/assets/screenshots";
const BRAND_DIR = "docs/assets/brand";

const REQUIRED_SCREENSHOTS = [
  { file: "dashboard.png", minWidth: 1200, alt: "Cited dashboard showing citation activity" },
  { file: "monitors.png", minWidth: 1200, alt: "Monitor list with prompts and surfaces" },
  { file: "citation-evidence.png", minWidth: 1200, alt: "Citation evidence detail view" },
  { file: "competitor-tracking.png", minWidth: 1200, alt: "Competitor citation event" },
  { file: "missed-opportunities.png", minWidth: 1200, alt: "Missed opportunity event" },
  { file: "inbox.png", minWidth: 1200, alt: "Citation inbox" },
  { file: "notebook.png", minWidth: 1200, alt: "Evidence notebook" },
  { file: "provider-settings.png", minWidth: 1200, alt: "Provider and worker settings" },
];

const REQUIRED_BRAND = [
  { file: "social-preview.png", width: 1280, height: 640 },
  { file: "readme-hero.png", minWidth: 1200 },
  { file: "cited-mark-light.svg" },
  { file: "cited-mark-dark.svg" },
  { file: "og-docs.png", minWidth: 1200 },
];

const MAX_FILE_BYTES = 800_000;
const FORBIDDEN_METADATA = [
  /\/Users\/[^/\s]+/,
  /\/home\/[^/\s]+/,
  /@[a-z0-9.-]+\.(com|io|dev)(?![a-z])/i,
  /CITED_BOOTSTRAP_TOKEN|AUTH_SECRET|postgres.*password/i,
];

function readPngDimensions(buffer) {
  if (buffer.length < 24 || buffer.readUInt32BE(0) !== 0x89504e47) {
    return null;
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function scanSvg(relativePath, content) {
  if (/<script[\s>]/i.test(content)) {
    add("svg-script", relativePath, "SVG must not contain scripts.");
  }
  if (/xlink:href=["']https?:/i.test(content) || /href=["']https?:/i.test(content)) {
    add("svg-remote-ref", relativePath, "SVG must not reference remote URLs.");
  }
}

function scanBinaryAsset(relativePath) {
  const absolute = join(REPO_ROOT, relativePath);
  const buffer = readFileSync(absolute);
  const textSample = buffer.subarray(0, Math.min(buffer.length, 4096)).toString("utf8");

  if (buffer.length > MAX_FILE_BYTES) {
    add("asset-oversized", relativePath, `Asset exceeds ${MAX_FILE_BYTES} bytes (${buffer.length}).`);
  }

  for (const pattern of FORBIDDEN_METADATA) {
    if (pattern.test(textSample)) {
      add("asset-sensitive-metadata", relativePath, "Asset may contain personal paths or secrets.");
    }
  }

  if (relativePath.endsWith(".png")) {
    const dims = readPngDimensions(buffer);
    if (!dims) {
      add("png-invalid", relativePath, "PNG dimensions could not be read.");
    }
    return dims;
  }
  return null;
}

function collectReferencedAssets() {
  const referenced = new Set();
  const files = [join(REPO_ROOT, "README.md"), ...listMarkdownFiles(join(REPO_ROOT, "docs"))];
  for (const file of files) {
    const content = readFileSync(file, "utf8");
    for (const match of content.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)) {
      const src = match[1];
      if (src && !src.startsWith("http")) {
        referenced.add(src.replace(/^\.\//, ""));
      }
    }
    for (const match of content.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)) {
      const src = match[1];
      if (src && !src.startsWith("http")) {
        referenced.add(src.replace(/^\.\//, ""));
      }
    }
  }
  return referenced;
}

function listAssetFiles(dir) {
  const absolute = join(REPO_ROOT, dir);
  if (!existsSync(absolute)) return [];
  const results = [];
  for (const entry of readdirSync(absolute)) {
    const path = join(absolute, entry);
    if (statSync(path).isFile()) {
      results.push(relative(REPO_ROOT, path));
    }
  }
  return results;
}

function main() {
  if (!existsSync(join(REPO_ROOT, SCREENSHOT_DIR))) {
    add("screenshot-dir-missing", SCREENSHOT_DIR, "Screenshot directory missing.");
  }
  if (!existsSync(join(REPO_ROOT, BRAND_DIR))) {
    add("brand-dir-missing", BRAND_DIR, "Brand asset directory missing.");
  }

  const screenshotHashes = new Map();
  for (const spec of REQUIRED_SCREENSHOTS) {
    const relativePath = `${SCREENSHOT_DIR}/${spec.file}`;
    if (!existsSync(join(REPO_ROOT, relativePath))) {
      add("screenshot-missing", relativePath, "Required screenshot missing.");
      continue;
    }
    const dims = scanBinaryAsset(relativePath);
    if (dims && dims.width < spec.minWidth) {
      add("screenshot-width", relativePath, `Screenshot width ${dims.width} below minimum ${spec.minWidth}.`);
    }
    const hash = createHash("sha256").update(readFileSync(join(REPO_ROOT, relativePath))).digest("hex");
    if (screenshotHashes.has(hash)) {
      add("duplicate-screenshot", relativePath, `Duplicate screenshot content: ${screenshotHashes.get(hash)}`);
    } else {
      screenshotHashes.set(hash, relativePath);
    }
  }

  for (const spec of REQUIRED_BRAND) {
    const relativePath = `${BRAND_DIR}/${spec.file}`;
    if (!existsSync(join(REPO_ROOT, relativePath))) {
      add("brand-missing", relativePath, "Required brand asset missing.");
      continue;
    }
    if (relativePath.endsWith(".svg")) {
      scanSvg(relativePath, readText(relativePath));
      continue;
    }
    const dims = scanBinaryAsset(relativePath);
    if (dims) {
      if (spec.width && dims.width !== spec.width) {
        add("brand-width", relativePath, `Expected width ${spec.width}, got ${dims.width}.`);
      }
      if (spec.height && dims.height !== spec.height) {
        add("brand-height", relativePath, `Expected height ${spec.height}, got ${dims.height}.`);
      }
      if (spec.minWidth && dims.width < spec.minWidth) {
        add("brand-min-width", relativePath, `Width ${dims.width} below minimum ${spec.minWidth}.`);
      }
    }
  }

  const manifestPath = "docs/assets/manifest.json";
  if (!existsSync(join(REPO_ROOT, manifestPath))) {
    add("manifest-missing", manifestPath, "Asset manifest missing.");
  }

  const referenced = collectReferencedAssets();
  const allAssets = [...listAssetFiles(SCREENSHOT_DIR), ...listAssetFiles(BRAND_DIR)];
  for (const asset of allAssets) {
    const referencedAny = [...referenced].some(
      (ref) => asset.endsWith(ref) || ref.endsWith(asset.split("/").pop() ?? ""),
    );
    if (!referencedAny && !asset.includes("manifest") && !asset.endsWith(".svg")) {
      add("unreferenced-asset", asset, "Asset is not referenced in README or docs.", "warn");
    }
  }

  for (const asset of allAssets) {
    if (asset.endsWith(".gif")) {
      add("unsupported-format", asset, "GIF assets are discouraged; prefer PNG.");
    }
  }

  reportAndExit("assets:check");
}

main();
