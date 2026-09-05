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
    await expect(page.getByRole("heading", { name: /setup/i })).toBeVisible();

    await page.getByLabel("Setup token").fill("invalid-bootstrap-token-value");
    await page.getByLabel("Owner email").fill("owner.e2e@example.com");
    await page.getByLabel("Password").fill("e2e-owner-password-12");
    await page.getByRole("button", { name: /create owner workspace/i }).click();

    await expect(page.getByText(/setup could not complete|authorization failed/i)).toBeVisible();
  });

  test("creates first owner once and closes bootstrap afterward", async ({ page }) => {
    const state = readState();

    await page.goto("/setup");
    await page.getByLabel("Setup token").fill(state.bootstrapToken);
    await page.getByLabel("Owner email").fill(state.ownerEmail);
    await page.getByLabel("Workspace name").fill(state.workspaceName);
    await page.getByLabel("Password").fill(state.ownerPassword);
    await page.getByRole("button", { name: /create owner workspace/i }).click();

    await page.waitForURL(/\/app/, { timeout: 60_000 });

    await page.goto("/setup");
    await expect(page.getByText(/setup is not available|not available/i)).toBeVisible();
  });
});
