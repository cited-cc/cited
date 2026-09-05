#!/usr/bin/env node
const host = process.env.HOSTNAME ?? "127.0.0.1";
const port = process.env.PORT ?? "3000";
const timeoutMs = Number(process.env.CITED_HEALTHCHECK_TIMEOUT_MS ?? "4000");

const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), timeoutMs);

try {
  const response = await fetch(`http://${host}:${port}/api/health`, {
    signal: controller.signal,
  });
  if (!response.ok) {
    process.exit(1);
  }
  const payload = await response.json();
  if (payload.database !== "ready" || payload.status !== "ok") {
    process.exit(1);
  }
  process.exit(0);
} catch {
  process.exit(1);
} finally {
  clearTimeout(timer);
}
