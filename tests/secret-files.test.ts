import { chmodSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  hydrateSecretFilesFromEnv,
  readSecretFileContents,
  resolveSecretFromEnv,
} from "../lib/env/secret-files.mjs";

describe("secret file helpers", () => {
  it("reads secret files and trims a trailing newline", () => {
    const dir = mkdtempSync(join(tmpdir(), "cited-secret-"));
    const filePath = join(dir, "secret");
    writeFileSync(filePath, "value\n", { mode: 0o600 });
    chmodSync(filePath, 0o600);
    expect(readSecretFileContents(filePath)).toBe("value");
  });

  it("rejects ambiguous direct and file configuration", () => {
    const dir = mkdtempSync(join(tmpdir(), "cited-secret-"));
    const filePath = join(dir, "secret");
    writeFileSync(filePath, "file-value", { mode: 0o600 });
    expect(() =>
      resolveSecretFromEnv("AUTH_SECRET", {
        ...process.env,
        AUTH_SECRET: "direct",
        AUTH_SECRET_FILE: filePath,
      }),
    ).toThrow(/Ambiguous/);
  });

  it("hydrates allowlisted secret files into env", () => {
    const dir = mkdtempSync(join(tmpdir(), "cited-secret-"));
    const filePath = join(dir, "secret");
    writeFileSync(filePath, "hydrated", { mode: 0o600 });
    const env: NodeJS.ProcessEnv = { ...process.env, AUTH_SECRET_FILE: filePath };
    hydrateSecretFilesFromEnv(env);
    expect(env.AUTH_SECRET).toBe("hydrated");
    expect(env.AUTH_SECRET_FILE).toBeUndefined();
  });

  it("resolves hydrated secrets without ambiguous file pointers", () => {
    const dir = mkdtempSync(join(tmpdir(), "cited-secret-"));
    const filePath = join(dir, "secret");
    writeFileSync(filePath, "hydrated", { mode: 0o600 });
    const env: NodeJS.ProcessEnv = { ...process.env, DATABASE_PASSWORD_FILE: filePath };
    hydrateSecretFilesFromEnv(env);
    expect(resolveSecretFromEnv("DATABASE_PASSWORD", env)).toBe("hydrated");
  });
});
