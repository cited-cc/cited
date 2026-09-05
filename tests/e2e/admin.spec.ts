import { readFileSync } from "node:fs";
import { join } from "node:path";

import { test, expect } from "@playwright/test";

type E2EState = {
  ownerEmail: string;
  ownerPassword: string;
};

function readState(): E2EState {
  return JSON.parse(
    readFileSync(join(process.cwd(), ".cited", "e2e", "state.json"), "utf8"),
  ) as E2EState;
}

async function signIn(page: import("@playwright/test").Page) {
  const state = readState();
  await page.goto("/sign-in");
  await page.getByLabel(/email/i).fill(state.ownerEmail);
  await page.getByLabel(/^password$/i).fill(state.ownerPassword);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/\/app/, { timeout: 60_000 });
}

test.describe("administration surfaces", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("shows self-hosted provider and worker status without billing UI", async ({ page }) => {
    await page.goto("/app/settings");
    await expect(page.getByText(/billing|checkout|upgrade/i)).toHaveCount(0);

    const body = await page.locator("body").innerText();
    expect(body.toLowerCase()).not.toContain("stripe");
    expect(body.toLowerCase()).not.toContain("clerk");
  });

  test("does not expose cloud analytics or checkout routes", async ({ page }) => {
    for (const route of ["/checkout", "/app/billing"]) {
      await page.goto(route);
      expect(page.url()).not.toMatch(/checkout|billing/);
    }
  });
});
