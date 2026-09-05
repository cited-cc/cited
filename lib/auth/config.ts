import "server-only";

import { isRuntimeProduction } from "@/lib/deployment/mode";
import type { AuthProvider } from "@/lib/auth/types";

const AUTH_SECRET_ENV = "AUTH_SECRET";
const BOOTSTRAP_TOKEN_ENV = "CITED_BOOTSTRAP_TOKEN";
const ALLOW_REGISTRATION_ENV = "CITED_ALLOW_REGISTRATION";
const SESSION_MAX_AGE_ENV = "CITED_SESSION_MAX_AGE_SECONDS";

const DEFAULT_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const MIN_AUTH_SECRET_LENGTH = 32;

/**
 * Community edition uses local authentication exclusively.
 */
export function resolveAuthProvider(): AuthProvider {
  return "local";
}

export function getAuthProvider(): AuthProvider {
  return "local";
}

export function resetAuthConfigCacheForTests(): void {
  // No-op: provider is fixed in community edition.
}

export function getAuthSecret(): string {
  const secret = process.env[AUTH_SECRET_ENV]?.trim();
  if (!secret) {
    if (isRuntimeProduction()) {
      throw new Error("AUTH_SECRET is required in production.");
    }
    return "development-auth-secret-not-for-production-use";
  }
  if (isRuntimeProduction() && secret.length < MIN_AUTH_SECRET_LENGTH) {
    throw new Error(
      `AUTH_SECRET must be at least ${MIN_AUTH_SECRET_LENGTH} characters in production.`,
    );
  }
  return secret;
}

export function getBootstrapToken(): string | undefined {
  return process.env[BOOTSTRAP_TOKEN_ENV]?.trim() || undefined;
}

export function isRegistrationAllowed(): boolean {
  const raw = process.env[ALLOW_REGISTRATION_ENV];
  if (!raw) {
    return false;
  }
  const normalized = raw.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

export function getSessionMaxAgeSeconds(): number {
  const raw = process.env[SESSION_MAX_AGE_ENV];
  if (!raw) {
    return DEFAULT_SESSION_MAX_AGE_SECONDS;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_SESSION_MAX_AGE_SECONDS;
  }
  return Math.floor(parsed);
}

export function isLocalAuthEnabled(): boolean {
  return true;
}

export function isClerkAuthEnabled(): boolean {
  return false;
}

export const isLocalAuthProvider = isLocalAuthEnabled;
export const isClerkAuthProvider = isClerkAuthEnabled;
