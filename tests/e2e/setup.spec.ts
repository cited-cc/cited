import { readFileSync } from "node:fs";
import { join } from "node:path";

import { test, expect } from "@playwright/test";

test.describe.configure({ mode: "serial" });

type E2EState = {
  bootstrapToken: string;
  ownerEmail: string;
  ownerPassword: string;
  workspaceName: string;
};

function readState(): E2EState {
  return JSON.parse(
    readFileSync(join(process.cwd(), ".cited", "e2e", "state.json"), "utf8"),
  ) as E2EState;
}

test.describe("first run bootstrap", () => {
  test("setup page is available and rejects invalid bootstrap token", async ({ page }) => {
    await page.goto("/setup");
    await expect(page.getByRole("heading", { name: /create your workspace/i })).toBeVisible();

    await page.locator('input[name="bootstrapToken"]').fill("invalid-bootstrap-token-value");
    await page.locator('input[name="email"]').fill("owner.e2e@example.com");
    await page.locator('input[name="password"]').fill("e2e-owner-password-12");
    await page.getByRole("button", { name: /create owner workspace/i }).click();

    await expect(page.getByRole("note")).toContainText("Bootstrap authorization failed");
  });

  test("creates first owner once and closes bootstrap afterward", async ({ page }) => {
    const state = readState();

    await page.goto("/setup");
    await page.locator('input[name="bootstrapToken"]').fill(state.bootstrapToken);
    await page.locator('input[name="email"]').fill(state.ownerEmail);
    await page.locator('input[name="workspaceName"]').fill(state.workspaceName);
    await page.locator('input[name="password"]').fill(state.ownerPassword);
    await page.getByRole("button", { name: /create owner workspace/i }).click();

    await page.waitForURL(/\/(app|sign-in)/, { timeout: 60_000 });

    if (!page.url().includes("/app")) {
      await page.locator('input[name="email"]').fill(state.ownerEmail);
      await page.locator('input[name="password"]').fill(state.ownerPassword);
      await page.getByRole("button", { name: /continue/i }).click();
      await page.waitForURL(/\/app/, { timeout: 60_000 });
    }

    await page.goto("/setup");
    await expect(page).toHaveURL(/\/sign-in/);
    await expect(page.getByRole("link", { name: /complete setup/i })).toHaveCount(0);
  });
});
