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
    await page.locator('input[name="email"]').fill(state.ownerEmail);
    await page.locator('input[name="password"]').fill(state.ownerPassword);
    await page.getByRole("button", { name: /continue/i }).click();
    await page.waitForURL(/\/app/, { timeout: 60_000 });

    await page.goto("/app/settings");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    await page.getByRole("button", { name: /account menu/i }).click();
    await page.getByRole("menuitem", { name: /sign out/i }).click();
    await page.waitForURL(/\/($|\?)/, { timeout: 30_000 });

    await page.goto("/app/settings", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/sign-in/, { timeout: 30_000 });
  });

  test("rejects invalid sign-in credentials generically", async ({ page }) => {
    await page.goto("/sign-in");
    await page.locator('input[name="email"]').fill("invalid-user@example.com");
    await page.locator('input[name="password"]').fill("wrong-password-12");
    await page.getByRole("button", { name: /continue/i }).click();
    await expect(page.getByRole("note")).toContainText(/incorrect email or password/i);
  });
});
