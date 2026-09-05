import path from "node:path";
import { defineConfig } from "vitest/config";

import {
  BOUNDARY_TESTS,
  INTEGRATION_TESTS,
  SECURITY_TESTS,
  UNIT_TESTS,
} from "./tests/categories.mjs";

const unitTests = [...UNIT_TESTS];
const integrationTests = [...INTEGRATION_TESTS];
const securityTests = [...SECURITY_TESTS];
const boundaryTests = [...BOUNDARY_TESTS];

const sharedTestConfig = {
  environment: "node" as const,
  server: {
    deps: {
      inline: ["next-auth", "next"],
    },
  },
  teardownTimeout: 30_000,
  testTimeout: 60_000,
  hookTimeout: 60_000,
  restoreMocks: true,
  clearMocks: true,
};

const sharedResolve = {
  alias: {
    "@": path.resolve(__dirname, "."),
    "server-only": path.resolve(__dirname, "tests/mocks/server-only.ts"),
    "@/auth": path.resolve(__dirname, "tests/mocks/auth.ts"),
  },
};

export default defineConfig({
  resolve: sharedResolve,
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "lcov"],
      reportsDirectory: "./coverage",
      include: ["lib/**/*.ts", "lib/**/*.mjs"],
      exclude: [
        "**/*.d.ts",
        "**/*.test.ts",
        "**/tests/**",
        "**/node_modules/**",
        "**/.next/**",
        "**/types/**",
        "**/fixtures/**",
        "**/*.config.*",
        "next-env.d.ts",
      ],
      thresholds: {
        branches: 21,
        functions: 36,
        lines: 27,
        statements: 27,
        perFile: false,
        "lib/auth/**": {
          branches: 15,
          functions: 35,
          lines: 20,
          statements: 20,
        },
        "lib/security/**": {
          branches: 37,
          functions: 60,
          lines: 52,
          statements: 50,
        },
        "lib/monitoring/**": {
          branches: 16,
          functions: 43,
          lines: 19,
          statements: 19,
        },
      },
    },
    projects: [
      {
        resolve: sharedResolve,
        test: {
          ...sharedTestConfig,
          name: "unit",
          include: unitTests,
        },
      },
      {
        resolve: sharedResolve,
        test: {
          ...sharedTestConfig,
          name: "integration",
          include: integrationTests,
        },
      },
      {
        resolve: sharedResolve,
        test: {
          ...sharedTestConfig,
          name: "security",
          include: securityTests,
        },
      },
      {
        resolve: sharedResolve,
        test: {
          ...sharedTestConfig,
          name: "boundary",
          include: boundaryTests,
        },
      },
    ],
  },
});
