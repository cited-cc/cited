import { execFileSync, spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { randomBytes } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const CITED_DIR = join(REPO_ROOT, ".cited");
export const SECRETS_DIR = join(CITED_DIR, "secrets");
export const CONFIG_PATH = join(CITED_DIR, "config.env");
export const BACKUP_DIR = join(CITED_DIR, "backups");
export const COMPOSE_FILE = join(REPO_ROOT, "docker-compose.yml");
export const COMPOSE_PROJECT = "cited";
export const HEALTH_TIMEOUT_MS = 180_000;

/** @type {{ name: string; bytes: number }[]} */
export const SECRET_DEFINITIONS = [
  { name: "postgres_owner_password", bytes: 32 },
  { name: "postgres_runtime_password", bytes: 32 },
  { name: "auth_secret", bytes: 48 },
  { name: "bootstrap_token", bytes: 48 },
  { name: "monitoring_cron_secret", bytes: 32 },
  { name: "slack_webhook_encryption_key", bytes: 32 },
];

export function commandExists(command) {
  const result = spawnSync("sh", ["-c", `command -v ${command}`], {
    stdio: "ignore",
  });
  return result.status === 0;
}

export function assertDockerAvailable() {
  if (!commandExists("docker")) {
    throw new Error("Docker is required but was not found on PATH.");
  }
  const compose = spawnSync("docker", ["compose", "version"], { stdio: "ignore" });
  if (compose.status !== 0) {
    throw new Error("Docker Compose v2 is required (`docker compose`).");
  }
}

export function generateSecret(bytes) {
  return randomBytes(bytes).toString("base64url");
}

export function writeSecretFile(name, bytes) {
  const path = join(SECRETS_DIR, name);
  if (existsSync(path)) {
    throw new Error(`Refusing to overwrite existing secret file: ${name}`);
  }
  writeFileSync(path, `${generateSecret(bytes)}\n`, { encoding: "utf8", mode: 0o600 });
  try {
    chmodSync(path, 0o600);
  } catch {
    // Best effort on platforms without chmod semantics.
  }
}

export function ensureConfigFile() {
  mkdirSync(CITED_DIR, { recursive: true, mode: 0o700 });
  if (!existsSync(CONFIG_PATH)) {
    const example = join(REPO_ROOT, ".env.docker.example");
    writeFileSync(CONFIG_PATH, readFileSync(example, "utf8"), { mode: 0o600 });
  }
}

export function secretsReady() {
  return SECRET_DEFINITIONS.every(({ name }) =>
    existsSync(join(SECRETS_DIR, name)),
  );
}

export function composeEnv() {
  const env = { ...process.env, COMPOSE_PROJECT_NAME: COMPOSE_PROJECT };
  if (existsSync(CONFIG_PATH)) {
    const content = readFileSync(CONFIG_PATH, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim();
      env[key] = value;
    }
  }
  return env;
}

export function runCompose(args, options = {}) {
  return spawnSync("docker", ["compose", "-f", COMPOSE_FILE, ...args], {
    cwd: REPO_ROOT,
    env: composeEnv(),
    stdio: options.stdio ?? "inherit",
    encoding: "utf8",
  });
}

export async function waitForWebHealth(timeoutMs = HEALTH_TIMEOUT_MS) {
  const env = composeEnv();
  const port = env.CITED_WEB_PORT ?? "3000";
  const url = env.NEXT_PUBLIC_APP_URL ?? `http://localhost:${port}`;
  const healthUrl = `${url.replace(/\/$/, "")}/api/health`;
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(healthUrl, { signal: AbortSignal.timeout(4000) });
      if (response.ok) {
        const payload = await response.json();
        if (payload.database === "ready" && payload.status === "ok") {
          return { url, payload };
        }
      }
    } catch {
      // Retry until timeout.
    }
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  throw new Error(`Timed out waiting for web health at ${healthUrl}.`);
}

export function assertSecretPermissions() {
  for (const { name } of SECRET_DEFINITIONS) {
    const path = join(SECRETS_DIR, name);
    if (!existsSync(path)) continue;
    if (process.platform === "win32") continue;
    const mode = statSync(path).mode & 0o777;
    if ((mode & 0o077) !== 0) {
      throw new Error(`Secret file ${name} permissions are too permissive (expected 0600).`);
    }
  }
}

export function gitHasRemote() {
  try {
    const output = execFileSync("git", ["-C", REPO_ROOT, "remote"], {
      encoding: "utf8",
    }).trim();
    return output.length > 0;
  } catch {
    return false;
  }
}
