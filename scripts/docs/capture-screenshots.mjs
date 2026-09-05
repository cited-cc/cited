#!/usr/bin/env node
/**
 * Deterministic documentation screenshot capture.
 * Requires a local self-hosted instance on localhost with mock provider.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";

const REPO_ROOT = process.cwd();
const OUTPUT_DIR = join(REPO_ROOT, "docs/assets/screenshots");
const MANIFEST_PATH = join(REPO_ROOT, "docs/assets/screenshot-manifest.json");

const ALLOWED_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const VIEWPORT = { width: 1440, height: 900 };
const DEVICE_SCALE = 2;

const CAPTURES = [
  { file: "dashboard.png", path: "/app", waitFor: /citation|monitor|inbox/i },
  { file: "monitors.png", path: "/app/monitors", waitFor: /monitor|prompt|surface/i },
  { file: "inbox.png", path: "/app/inbox", waitFor: /inbox|citation|event/i },
  { file: "citation-evidence.png", path: "/app/inbox", waitFor: /inbox|citation/i, followFirstLink: true },
  { file: "competitor-tracking.png", path: "/app/inbox?type=competitor_citation", waitFor: /competitor|inbox/i },
  { file: "missed-opportunities.png", path: "/app/inbox?type=missed_opportunity", waitFor: /missed|opportunity|inbox/i },
  { file: "notebook.png", path: "/app/notebook", waitFor: /notebook|note|evidence/i },
  { file: "provider-settings.png", path: "/app/settings/provider", waitFor: /provider|mock|monitoring/i },
];

function assertLocalBaseUrl(baseUrl) {
  let parsed;
  try {
    parsed = new URL(baseUrl);
  } catch {
    throw new Error(`Invalid CITED_DOCS_SCREENSHOT_BASE_URL: ${baseUrl}`);
  }
  if (!ALLOWED_HOSTS.has(parsed.hostname)) {
    throw new Error(
      `Refusing non-local application URL for screenshots: ${baseUrl}. Use localhost or 127.0.0.1 only.`,
    );
  }
}

function readScreenshotCredentials() {
  const statePath = join(REPO_ROOT, ".cited", "docs-screenshots", "state.json");
  if (existsSync(statePath)) {
    return JSON.parse(readFileSync(statePath, "utf8"));
  }
  const e2eStatePath = join(REPO_ROOT, ".cited", "e2e", "state.json");
  if (existsSync(e2eStatePath)) {
    return JSON.parse(readFileSync(e2eStatePath, "utf8"));
  }
  return null;
}

async function signIn(page, baseUrl, credentials) {
  await page.goto(`${baseUrl}/sign-in`);
  await page.getByLabel(/email/i).fill(credentials.ownerEmail);
  await page.getByLabel(/^password$/i).fill(credentials.ownerPassword);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/\/app/, { timeout: 120_000 });
}

async function preparePage(page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `,
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
}

async function blockExternal(page) {
  await page.route("**/*", (route) => {
    const url = route.request().url();
    if (url.startsWith("http://localhost") || url.startsWith("http://127.0.0.1")) {
      return route.continue();
    }
    if (url.startsWith("data:") || url.startsWith("blob:")) {
      return route.continue();
    }
    return route.abort("blockedbyclient");
  });
}

async function captureRoute(page, baseUrl, spec) {
  await page.goto(`${baseUrl}${spec.path}`, { waitUntil: "networkidle" });
  if (spec.waitFor) {
    await page.getByText(spec.waitFor).first().waitFor({ timeout: 60_000 });
  }
  if (spec.followFirstLink) {
    const link = page.locator('a[href*="/app/inbox/"]').first();
    if (await link.count()) {
      await link.click();
      await page.waitForLoadState("networkidle");
    }
  }
  await page.waitForTimeout(500);
  const output = join(OUTPUT_DIR, spec.file);
  await page.screenshot({ path: output, fullPage: false });
  return output;
}

async function main() {
  const baseUrl = (process.env.CITED_DOCS_SCREENSHOT_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
  assertLocalBaseUrl(baseUrl);

  const credentials = readScreenshotCredentials();
  if (!credentials?.ownerEmail || !credentials?.ownerPassword) {
    throw new Error(
      "Screenshot credentials missing. Run with CITED_E2E_ENABLED=true first or create .cited/docs-screenshots/state.json",
    );
  }

  mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: DEVICE_SCALE,
    locale: "en-US",
    timezoneId: "UTC",
    colorScheme: "light",
  });
  const page = await context.newPage();
  await blockExternal(page);
  await preparePage(page);
  await signIn(page, baseUrl, credentials);

  const manifest = { generatedAt: new Date().toISOString(), baseUrl, captures: [] };
  for (const spec of CAPTURES) {
    const output = await captureRoute(page, baseUrl, spec);
    manifest.captures.push({ file: spec.file, path: spec.path, output: output.replace(`${REPO_ROOT}/`, "") });
    console.log(`captured ${spec.file}`);
  }

  writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  await browser.close();
  console.log("docs:screenshots complete");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
