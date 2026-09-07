#!/usr/bin/env node
/**
 * Upload cited-cc org avatar and cited repo social preview via GitHub settings UI.
 *
 * Usage:
 *   node scripts/github/update-branding.mjs --init-auth
 *   node scripts/github/update-branding.mjs
 */
import { existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { chromium } from "@playwright/test";

const ORG = "cited-cc";
const REPO = "cited";
const BASE_URL = "https://github.com";
const REPO_ROOT = process.cwd();
const AVATAR_PATH = join(REPO_ROOT, "docs/assets/brand/org-avatar-200.png");
const SOCIAL_PREVIEW_PATH = join(REPO_ROOT, "docs/assets/brand/social-preview.png");
const DEFAULT_STORAGE_STATE = join(
  homedir(),
  ".local/state/gh-social-preview/auth/github.json",
);

function parseArgs(argv) {
  const out = { initAuth: false, storageState: DEFAULT_STORAGE_STATE, headless: true };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--init-auth") out.initAuth = true;
    if (arg === "--headless=false") out.headless = false;
    if (arg === "--headless=true") out.headless = true;
    if (arg === "--storage-state" && argv[i + 1]) {
      out.storageState = argv[i + 1];
      i += 1;
    }
  }
  return out;
}

async function launchContext({ storageState, headless, width = 1280, height = 720 }) {
  const browser = await chromium.launch({ headless });
  const contextOptions = { viewport: { width, height } };
  if (storageState && existsSync(storageState)) {
    contextOptions.storageState = storageState;
  }
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  page.setDefaultTimeout(30_000);
  return { browser, context, page };
}

async function initAuth(storageState) {
  mkdirSync(dirname(storageState), { recursive: true });
  const { browser, context, page } = await launchContext({
    storageState: null,
    headless: false,
  });

  console.log(`Opening ${BASE_URL}/login ...`);
  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
  console.log("Log into GitHub in the opened browser window (2FA included).");

  page.setDefaultTimeout(0);
  page.setDefaultNavigationTimeout(0);
  await page.waitForFunction(() => {
    const loginMeta = document.querySelector('meta[name="user-login"]')?.content?.trim();
    if (loginMeta) return true;
    return !!document.querySelector('summary[aria-label="View profile and more"]');
  }, null, { timeout: 0, polling: 500 });

  const username = await page.evaluate(
    () => document.querySelector('meta[name="user-login"]')?.content?.trim() || "",
  );
  await context.storageState({ path: storageState });
  await browser.close();
  console.log(`Saved GitHub session for @${username}`);
}

async function assertSignedIn(page, targetUrl) {
  await page.goto(targetUrl, { waitUntil: "domcontentloaded" });
  if (page.url().includes("/login")) {
    throw new Error(
      `Not logged in. Run: node scripts/github/update-branding.mjs --init-auth`,
    );
  }
}

async function uploadOrgAvatar(page) {
  const settingsUrl = `${BASE_URL}/organizations/${ORG}/settings/profile`;
  await assertSignedIn(page, settingsUrl);

  const uploadResponsePromise = page.waitForResponse(
    (resp) => {
      const url = resp.url();
      return url.includes("/upload/policies/avatars") || url.includes("/upload/avatars");
    },
    { timeout: 30_000 },
  ).catch(() => null);

  const fileInput = page.locator('input[type="file"][accept*="image"]').first();
  await fileInput.setInputFiles(AVATAR_PATH);

  const saveButton = page.getByRole("button", { name: /save|update profile|upload new picture/i }).first();
  if (await saveButton.isVisible().catch(() => false)) {
    await saveButton.click();
  }

  const uploadResponse = await uploadResponsePromise;
  if (uploadResponse) {
    console.log(`Org avatar upload response: ${uploadResponse.status()} ${uploadResponse.url()}`);
  }
  await page.waitForTimeout(2000);
}

async function uploadRepoSocialPreview(page) {
  const settingsUrl = `${BASE_URL}/${ORG}/${REPO}/settings`;
  await assertSignedIn(page, settingsUrl);

  const editButton = page.locator("#edit-social-preview-button");
  const socialEditButton = page.locator(
    "xpath=(//h2[normalize-space()='Social preview']/following::*[(self::button or self::summary) and normalize-space(.)='Edit'][1])",
  );
  const fileInput = page.locator("input#repo-image-file-input");
  const uploadMenuItem = page.getByText(/upload an image/i).first();

  await page.locator("xpath=//h2[normalize-space()='Social preview']").first().scrollIntoViewIfNeeded();

  const uploadResponsePromise = page.waitForResponse((resp) => {
    const url = resp.url();
    return url.includes("/upload/repository-images/") || url.includes("/upload/policies/repository-images");
  }, { timeout: 30_000 });

  if (await editButton.isVisible().catch(() => false)) {
    await editButton.click();
  } else if (await socialEditButton.isVisible().catch(() => false)) {
    await socialEditButton.click();
  }

  await Promise.race([
    fileInput.waitFor({ state: "attached", timeout: 30_000 }),
    uploadMenuItem.waitFor({ state: "visible", timeout: 30_000 }),
  ]);

  if (await uploadMenuItem.isVisible().catch(() => false)) {
    await uploadMenuItem.click();
  }

  await fileInput.setInputFiles(SOCIAL_PREVIEW_PATH, { timeout: 30_000 });
  const uploadResponseUrl = await uploadResponsePromise;
  console.log(`Repo social preview upload response: ${uploadResponseUrl}`);

  await page.waitForFunction(() => {
    const id = document.querySelector(".js-repository-image-id")?.textContent?.trim();
    return !!id;
  }, null, { timeout: 30_000 });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!existsSync(AVATAR_PATH) || !existsSync(SOCIAL_PREVIEW_PATH)) {
    throw new Error("Brand assets missing. Run: node scripts/docs/render-brand-assets.mjs");
  }

  if (args.initAuth) {
    await initAuth(args.storageState);
    return;
  }

  if (!existsSync(args.storageState)) {
    throw new Error(
      `Missing GitHub session at ${args.storageState}. Run with --init-auth first.`,
    );
  }

  const { browser, page } = await launchContext({
    storageState: args.storageState,
    headless: args.headless,
  });

  try {
    await uploadOrgAvatar(page);
    await uploadRepoSocialPreview(page);
    console.log("github-branding: org avatar and repo social preview updated");
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(`github-branding: FAIL (${error instanceof Error ? error.message : String(error)})`);
  process.exit(1);
});
