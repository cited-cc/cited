#!/usr/bin/env node
/**
 * Render brand PNG assets from local HTML templates using Playwright.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "@playwright/test";

const REPO_ROOT = process.cwd();
const BRAND_DIR = join(REPO_ROOT, "docs/assets/brand");
const TEMPLATE_DIR = join(REPO_ROOT, "scripts/docs/brand-templates");

async function renderHtmlTemplate(browser, htmlPath, outputPath, viewport, deviceScaleFactor = 1) {
  const page = await browser.newPage({ viewport, deviceScaleFactor });
  await page.goto(`file://${htmlPath}`);
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: outputPath });
  await page.close();
}

async function main() {
  mkdirSync(BRAND_DIR, { recursive: true });
  mkdirSync(TEMPLATE_DIR, { recursive: true });

  const socialHtml = join(TEMPLATE_DIR, "social-preview.html");
  writeFileSync(
    socialHtml,
    `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1280px; height: 640px;
    background: #fbf7f0;
    font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
    color: #15131a;
    display: flex;
    align-items: center;
    padding: 64px 80px;
    gap: 48px;
  }
  .mark {
    width: 120px; height: 120px; border-radius: 28px;
    background: #1e1b25; position: relative; flex-shrink: 0;
    border: 1px solid rgba(251,247,240,0.22);
  }
  .mark::after {
    content: ""; position: absolute; left: 38px; top: 46px;
    width: 44px; height: 10px; border-radius: 5px; background: #5ce1e6;
  }
  h1 { font-size: 56px; letter-spacing: -0.03em; margin-bottom: 16px; }
  p { font-size: 28px; color: #524e5c; max-width: 760px; line-height: 1.35; }
  .tag {
    margin-top: 28px; display: inline-block; padding: 8px 16px;
    border: 1px solid #e7e0d4; border-radius: 999px; font-size: 18px; color: #524e5c;
  }
</style>
</head>
<body>
  <div class="mark" aria-hidden="true"></div>
  <div>
    <h1>Cited</h1>
    <p>Open-source citation monitoring for the AI answers that matter.</p>
    <span class="tag">Self-hosted · AGPL-3.0</span>
  </div>
</body>
</html>`,
    "utf8",
  );

  const heroHtml = join(TEMPLATE_DIR, "readme-hero.html");
  writeFileSync(
    heroHtml,
    `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1440px; height: 760px;
    background: linear-gradient(180deg, #fbf7f0 0%, #f3ede3 100%);
    font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
    color: #15131a;
    padding: 48px;
  }
  .shell {
    height: 100%; border: 1px solid #e7e0d4; border-radius: 16px;
    background: #fff; overflow: hidden; display: grid; grid-template-rows: 56px 1fr;
  }
  .top { background: #15131a; color: #fbf7f0; display: flex; align-items: center; padding: 0 24px; gap: 12px; }
  .dot { width: 10px; height: 10px; border-radius: 50%; background: #5ce1e6; }
  .content { padding: 32px; display: grid; grid-template-columns: 220px 1fr; gap: 24px; }
  .nav { display: flex; flex-direction: column; gap: 8px; }
  .nav div { padding: 10px 12px; border-radius: 8px; color: #524e5c; }
  .nav .active { background: #fbf7f0; color: #15131a; font-weight: 600; }
  .panel { border: 1px solid #e7e0d4; border-radius: 12px; padding: 24px; }
  h2 { font-size: 28px; margin-bottom: 8px; }
  .sub { color: #524e5c; margin-bottom: 24px; }
  .cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .card { border: 1px solid #e7e0d4; border-radius: 12px; padding: 16px; }
  .card strong { display: block; margin-bottom: 6px; }
  .pill { display: inline-block; margin-top: 8px; padding: 4px 10px; border-radius: 999px; background: rgba(92,225,230,0.18); color: #0a3d40; font-size: 13px; }
</style>
</head>
<body>
  <div class="shell">
    <div class="top"><span class="dot"></span><span>Cited · Fictional demo workspace</span></div>
    <div class="content">
      <div class="nav">
        <div class="active">Dashboard</div>
        <div>Monitors</div>
        <div>Inbox</div>
        <div>Notebook</div>
      </div>
      <div class="panel">
        <h2>Citation activity</h2>
        <p class="sub">Mock provider · cited-test.example</p>
        <div class="cards">
          <div class="card"><strong>New citation</strong><span>ChatGPT · AI citation tools</span><span class="pill">Evidence captured</span></div>
          <div class="card"><strong>Competitor cited</strong><span>competitor-labs.example</span><span class="pill">Tracked</span></div>
          <div class="card"><strong>Missed opportunity</strong><span>Related prompt</span><span class="pill">Review</span></div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`,
    "utf8",
  );

  const ogHtml = join(TEMPLATE_DIR, "og-docs.html");
  writeFileSync(
    ogHtml,
    `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<style>
  body { width: 1200px; height: 630px; margin: 0; background: #15131a; color: #fbf7f0;
    font-family: ui-sans-serif, system-ui, sans-serif; display: flex; flex-direction: column; justify-content: center; padding: 72px; }
  h1 { font-size: 64px; margin: 0 0 16px; letter-spacing: -0.03em; }
  p { font-size: 28px; color: rgba(251,247,240,0.78); max-width: 820px; line-height: 1.35; margin: 0; }
  .accent { color: #5ce1e6; }
</style>
</head>
<body>
  <h1>Cited <span class="accent">Docs</span></h1>
  <p>Self-hosting, monitoring, providers, security, and operations for the open-source citation monitoring platform.</p>
</body>
</html>`,
    "utf8",
  );

  const browser = await chromium.launch({ headless: true });
  await renderHtmlTemplate(browser, socialHtml, join(BRAND_DIR, "social-preview.png"), {
    width: 1280,
    height: 640,
  });
  await renderHtmlTemplate(browser, heroHtml, join(BRAND_DIR, "readme-hero.png"), {
    width: 1440,
    height: 760,
  });
  await renderHtmlTemplate(browser, ogHtml, join(BRAND_DIR, "og-docs.png"), {
    width: 1200,
    height: 630,
  });
  await browser.close();
  console.log("brand assets rendered");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
