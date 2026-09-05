import { lstatSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/** @typedef {import('./secret-files.types.mjs').SecretFileName} SecretFileName */

/** @type {readonly SecretFileName[]} */
export const SECRET_FILE_ALLOWLIST = Object.freeze([
  "AUTH_SECRET",
  "CITED_BOOTSTRAP_TOKEN",
  "DATABASE_PASSWORD",
  "DATABASE_MIGRATION_PASSWORD",
  "SLACK_WEBHOOK_ENCRYPTION_KEY",
  "MONITORING_CRON_SECRET",
  "NOTIFICATIONS_CRON_SECRET",
  "SMTP_PASSWORD",
]);

const MAX_SECRET_FILE_BYTES = 4096;

/**
 * @param {string} name
 * @returns {name is SecretFileName}
 */
export function isAllowedSecretFileName(name) {
  return SECRET_FILE_ALLOWLIST.includes(/** @type {SecretFileName} */ (name));
}

/**
 * @param {string} filePath
 * @param {{ allowWorldReadable?: boolean }} [options]
 */
export function readSecretFileContents(filePath, options = {}) {
  const absolutePath = resolve(filePath);

  let stats;
  try {
    stats = lstatSync(absolutePath);
  } catch {
    throw new Error("Secret file is missing or unreadable.");
  }

  if (!stats.isFile()) {
    throw new Error("Secret file path must be a regular file.");
  }

  if (stats.size > MAX_SECRET_FILE_BYTES) {
    throw new Error("Secret file exceeds the maximum allowed size.");
  }

  if (process.platform !== "win32" && !options.allowWorldReadable) {
    const mode = stats.mode & 0o777;
    if ((mode & 0o004) !== 0) {
      throw new Error("Secret file must not be world-readable.");
    }
  }

  const raw = readFileSync(absolutePath, "utf8");
  const trimmed = raw.endsWith("\n") ? raw.slice(0, -1) : raw;
  if (!trimmed) {
    throw new Error("Secret file must not be empty.");
  }
  return trimmed;
}

/**
 * Resolve a secret from direct env value or *_FILE path.
 * @param {SecretFileName} baseName
 * @param {NodeJS.ProcessEnv} [env]
 */
export function resolveSecretFromEnv(baseName, env = process.env) {
  const direct = env[baseName]?.trim();
  const fileEnvName = `${baseName}_FILE`;
  const filePath = env[fileEnvName]?.trim();

  if (direct && filePath) {
    throw new Error(
      `Ambiguous secret configuration: set either ${baseName} or ${fileEnvName}, not both.`,
    );
  }

  if (filePath) {
    return readSecretFileContents(filePath);
  }

  return direct || undefined;
}

/**
 * Hydrate allowlisted *_FILE variables into direct env values for downstream code.
 * Does not overwrite an already-set direct value unless only *_FILE is present.
 * @param {NodeJS.ProcessEnv} [env]
 */
export function hydrateSecretFilesFromEnv(env = process.env) {
  for (const baseName of SECRET_FILE_ALLOWLIST) {
    const direct = env[baseName]?.trim();
    const fileEnvName = `${baseName}_FILE`;
    const filePath = env[fileEnvName]?.trim();

    if (direct && filePath) {
      throw new Error(
        `Ambiguous secret configuration: set either ${baseName} or ${fileEnvName}, not both.`,
      );
    }

    if (!direct && filePath) {
      env[baseName] = readSecretFileContents(filePath);
    }
  }
}
