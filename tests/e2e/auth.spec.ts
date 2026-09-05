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

test.describe("authentication", () => {
  test("signs in, protects session routes, and signs out", async ({ page }) => {
    const state = readState();

    await page.goto("/sign-in");
    await page.getByLabel(/email/i).fill(state.ownerEmail);
    await page.getByLabel(/^password$/i).fill(state.ownerPassword);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/\/app/, { timeout: 60_000 });

    await page.goto("/app/settings");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    await page.goto("/sign-out");
    await page.goto("/app/settings");
    await page.waitForURL(/\/sign-in/, { timeout: 30_000 });
  });

  test("rejects invalid sign-in credentials generically", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByLabel(/email/i).fill("invalid-user@example.com");
    await page.getByLabel(/^password$/i).fill("wrong-password-12");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/could not sign in|invalid/i)).toBeVisible();
  });
});
