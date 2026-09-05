import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.CITED_E2E_BASE_URL ?? "http://127.0.0.1:3000";
const e2eEnabled = process.env.CITED_E2E_ENABLED === "true";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 20_000 },
  reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    timezoneId: "UTC",
    locale: "en-US",
  },
  projects: [
    {
      name: "setup",
      testMatch: /setup\.spec\.ts/,
    },
    {
      name: "chromium",
      testMatch: /^(?!.*setup\.spec\.ts).*\.spec\.ts$/,
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
  ],
  globalSetup: e2eEnabled ? "./tests/e2e/global-setup.ts" : undefined,
  globalTeardown: e2eEnabled ? "./tests/e2e/global-teardown.ts" : undefined,
  webServer: e2eEnabled
    ? {
        command: "npm run e2e:server",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 240_000,
      }
    : undefined,
});
