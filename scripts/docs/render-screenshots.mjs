#!/usr/bin/env node
/**
 * Render deterministic product-style screenshots for documentation.
 * Used when a live local instance is unavailable; prefer capture-screenshots.mjs for real UI.
 */
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";

const REPO_ROOT = process.cwd();
const OUTPUT_DIR = join(REPO_ROOT, "docs/assets/screenshots");
const TEMPLATE_DIR = join(REPO_ROOT, "scripts/docs/screenshot-templates");
const MANIFEST_PATH = join(REPO_ROOT, "docs/assets/screenshot-manifest.json");

const CAPTURES = [
  { file: "dashboard.png", template: "dashboard.html", title: "Dashboard" },
  { file: "monitors.png", template: "monitors.html", title: "Monitors" },
  { file: "inbox.png", template: "inbox.html", title: "Inbox" },
  { file: "citation-evidence.png", template: "evidence.html", title: "Citation evidence" },
  { file: "competitor-tracking.png", template: "competitor.html", title: "Competitor tracking" },
  { file: "missed-opportunities.png", template: "missed.html", title: "Missed opportunities" },
  { file: "notebook.png", template: "notebook.html", title: "Notebook" },
  { file: "provider-settings.png", template: "provider.html", title: "Provider settings" },
];

const BASE_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1440px; height: 900px; overflow: hidden;
    background: #fbf7f0; color: #15131a;
    font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
  }
  .app { height: 100%; display: grid; grid-template-rows: 56px 1fr; }
  .topbar {
    background: #15131a; color: #fbf7f0; display: flex; align-items: center;
    justify-content: space-between; padding: 0 24px; font-size: 14px;
  }
  .badge { background: rgba(92,225,230,0.18); color: #0a3d40; padding: 4px 10px; border-radius: 999px; font-size: 12px; }
  .layout { display: grid; grid-template-columns: 240px 1fr; height: 100%; }
  .nav { background: #fff; border-right: 1px solid #e7e0d4; padding: 20px 12px; }
  .nav a { display: block; padding: 10px 12px; border-radius: 8px; color: #524e5c; text-decoration: none; margin-bottom: 4px; }
  .nav a.active { background: #fbf7f0; color: #15131a; font-weight: 600; }
  main { padding: 28px 32px; overflow: hidden; }
  h1 { font-size: 28px; margin-bottom: 6px; letter-spacing: -0.02em; }
  .sub { color: #524e5c; margin-bottom: 24px; font-size: 15px; }
  .card { background: #fff; border: 1px solid #e7e0d4; border-radius: 12px; padding: 18px; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th, td { text-align: left; padding: 12px 10px; border-bottom: 1px solid #e7e0d4; }
  th { color: #524e5c; font-weight: 600; }
  .pill { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 12px; }
  .pill.mock { background: rgba(92,225,230,0.18); color: #0a3d40; }
  .pill.new { background: #15131a; color: #fbf7f0; }
  .grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
`;

function shell(active, body) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8" /><style>${BASE_STYLES}</style></head><body>
  <div class="app">
    <div class="topbar"><span>Cited · Northwind Analytics</span><span class="badge">Mock provider · Fictional demo</span></div>
    <div class="layout">
      <nav class="nav">
        <a class="${active === "dashboard" ? "active" : ""}" href="#">Dashboard</a>
        <a class="${active === "monitors" ? "active" : ""}" href="#">Monitors</a>
        <a class="${active === "inbox" ? "active" : ""}" href="#">Inbox</a>
        <a class="${active === "notebook" ? "active" : ""}" href="#">Notebook</a>
        <a class="${active === "settings" ? "active" : ""}" href="#">Settings</a>
      </nav>
      <main>${body}</main>
    </div>
  </div></body></html>`;
}

const TEMPLATES = {
  "dashboard.html": shell(
    "dashboard",
    `<h1>Dashboard</h1><p class="sub">cited-test.example · monitored prompts across supported surfaces</p>
    <div class="grid3">
      <div class="card"><strong>New citation</strong><p class="sub">ChatGPT · AI citation tools</p><span class="pill mock">[MOCK] Evidence captured</span></div>
      <div class="card"><strong>Competitor cited</strong><p class="sub">competitor-labs.example</p><span class="pill mock">Tracked</span></div>
      <div class="card"><strong>Missed opportunity</strong><p class="sub">Related prompt</p><span class="pill new">Review</span></div>
    </div>`,
  ),
  "monitors.html": shell(
    "monitors",
    `<h1>Monitors</h1><p class="sub">Prompt × surface configurations</p>
    <div class="card"><table><thead><tr><th>Prompt</th><th>Surface</th><th>Frequency</th><th>Status</th></tr></thead>
    <tbody>
      <tr><td>AI citation tools</td><td>ChatGPT</td><td>Twice weekly</td><td><span class="pill mock">Active · Mock</span></td></tr>
      <tr><td>AI SEO</td><td>Gemini</td><td>Twice weekly</td><td><span class="pill mock">Active · Mock</span></td></tr>
      <tr><td>Crypto intelligence</td><td>Perplexity</td><td>Weekly</td><td><span class="pill mock">Active · Mock</span></td></tr>
    </tbody></table></div>`,
  ),
  "inbox.html": shell(
    "inbox",
    `<h1>Inbox</h1><p class="sub">Citation and competitive events</p>
    <div class="card"><table><thead><tr><th>Event</th><th>Surface</th><th>Prompt</th><th>Status</th></tr></thead>
    <tbody>
      <tr><td>[MOCK] Citation</td><td>ChatGPT</td><td>AI citation tools</td><td><span class="pill new">New</span></td></tr>
      <tr><td>[MOCK] Mention</td><td>ChatGPT</td><td>AI citation tools</td><td><span class="pill new">New</span></td></tr>
      <tr><td>[MOCK] Competitor citation</td><td>ChatGPT</td><td>AI citation tools</td><td><span class="pill new">New</span></td></tr>
    </tbody></table></div>`,
  ),
  "evidence.html": shell(
    "inbox",
    `<h1>Citation evidence</h1><p class="sub">Immutable response snapshot · cited-test.example</p>
    <div class="card" style="margin-bottom:16px"><strong>[MOCK] AI citation guide</strong>
    <p class="sub" style="margin:12px 0">https://cited-test.example/guides/ai-citations</p>
    <p>[MOCK] Cited Test Brand monitoring guide excerpt from fictional ChatGPT response.</p></div>
    <div class="card"><strong>Evidence ledger</strong><p class="sub" style="margin-top:12px">Source link matched verified domain · confidence 0.94</p></div>`,
  ),
  "competitor.html": shell(
    "inbox",
    `<h1>Competitor tracking</h1><p class="sub">competitor-labs.example cited on monitored prompt</p>
    <div class="card"><strong>[MOCK] Competitor Labs</strong>
    <p class="sub" style="margin:12px 0">https://competitor-labs.example/product</p>
    <p>Competitor cited while Northwind Analytics monitors the same prompt category.</p></div>`,
  ),
  "missed.html": shell(
    "inbox",
    `<h1>Missed opportunities</h1><p class="sub">Competitor present · verified domain absent</p>
    <div class="card"><strong>[MOCK] Missed opportunity</strong>
    <p class="sub" style="margin:12px 0">Prompt: Best AI SEO tools for startups</p>
    <p>competitor-labs.example cited. cited-test.example not present in mock response.</p></div>`,
  ),
  "notebook.html": shell(
    "notebook",
    `<h1>Notebook</h1><p class="sub">Evidence notes attached to citation events</p>
    <div class="card"><strong>[MOCK SEED] First citation note</strong>
    <p class="sub" style="margin:12px 0">Pinned · workspace visibility</p>
    <p>Verified domain appeared in a monitored ChatGPT response. Follow up with content team.</p></div>`,
  ),
  "provider.html": shell(
    "settings",
    `<h1>Provider and worker</h1><p class="sub">Self-hosted monitoring configuration</p>
    <div class="card"><table><tbody>
      <tr><th>Provider</th><td>mock</td></tr>
      <tr><th>Mock allowed</th><td>true</td></tr>
      <tr><th>Monitoring enabled</th><td>true</td></tr>
      <tr><th>Worker tick</th><td>30000 ms</td></tr>
      <tr><th>Warning</th><td><span class="pill mock">Fictional demo data only</span></td></tr>
    </tbody></table></div>`,
  ),
};

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  mkdirSync(TEMPLATE_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const manifest = { generatedAt: new Date().toISOString(), mode: "rendered", captures: [] };

  for (const spec of CAPTURES) {
    const htmlPath = join(TEMPLATE_DIR, spec.template);
    writeFileSync(htmlPath, TEMPLATES[spec.template], "utf8");
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
    await page.goto(`file://${htmlPath}`);
    await page.waitForLoadState("networkidle");
    const output = join(OUTPUT_DIR, spec.file);
    await page.screenshot({ path: output });
    await page.close();
    const sha256 = createHash("sha256").update(readFileSync(output)).digest("hex");
    manifest.captures.push({ file: spec.file, path: spec.title, output: `docs/assets/screenshots/${spec.file}`, sha256 });
    console.log(`rendered ${spec.file}`);
  }

  writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  await browser.close();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
