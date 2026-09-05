export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") {
    return;
  }

  const { hydrateSecretFilesFromEnv } = await import("@/lib/env/secret-files.mjs");
  const { hydrateDatabaseUrlsFromEnv } = await import("@/lib/db/build-connection-url.mjs");

  hydrateSecretFilesFromEnv();
  hydrateDatabaseUrlsFromEnv();
}
