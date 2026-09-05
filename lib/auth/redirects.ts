/**
 * Safe same-origin relative redirect helpers.
 * Prevents open redirects via absolute, protocol-relative, or malformed URLs.
 */

import { parseCheckoutPlanKey, isPlanKey } from "@/lib/entitlements/plan-catalog";

const DEFAULT_APP_DESTINATION = "/app";
const DEFAULT_AUTH_DESTINATION = "/sign-in";

const ALLOWED_QUERY_KEYS = new Set([
  "plan",
  "notice",
  "step",
]);

export function isSafeRelativePath(value: string | null | undefined): boolean {
  if (!value || typeof value !== "string") {
    return false;
  }

  const trimmed = value.trim();
  if (!trimmed.startsWith("/")) {
    return false;
  }
  if (trimmed.startsWith("//")) {
    return false;
  }
  if (trimmed.includes("://")) {
    return false;
  }
  if (trimmed.includes("\\")) {
    return false;
  }
  // Reject encoded protocol-relative tricks.
  if (/^\/\\/i.test(trimmed) || /^\/(%2f)/i.test(trimmed)) {
    return false;
  }
  // Reject control characters and newlines.
  if (/[\u0000-\u001f\u007f]/.test(trimmed)) {
    return false;
  }

  try {
    const parsed = new URL(trimmed, "https://cited.invalid");
    if (parsed.origin !== "https://cited.invalid") {
      return false;
    }
    if (!parsed.pathname.startsWith("/")) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Accept only safe same-origin relative paths.
 * Optionally preserve a small allowlist of query parameters.
 */
export function sanitizeReturnPath(
  value: string | null | undefined,
  fallback: string = DEFAULT_APP_DESTINATION,
): string {
  if (!isSafeRelativePath(value)) {
    return fallback.startsWith("/") && isSafeRelativePath(fallback)
      ? fallback
      : DEFAULT_APP_DESTINATION;
  }

  const trimmed = value!.trim();

  try {
    const parsed = new URL(trimmed, "https://cited.invalid");
    const params = new URLSearchParams();
    for (const [key, paramValue] of parsed.searchParams.entries()) {
      if (ALLOWED_QUERY_KEYS.has(key) && paramValue.length <= 200) {
        params.set(key, paramValue);
      }
    }
    const search = params.toString();
    const hash = ""; // Never preserve fragments from untrusted input.
    return `${parsed.pathname}${search ? `?${search}` : ""}${hash}`;
  } catch {
    return fallback;
  }
}

export function buildSignInHref(
  returnTo?: string | null,
): string {
  const safe = sanitizeReturnPath(returnTo, DEFAULT_APP_DESTINATION);
  if (safe === DEFAULT_APP_DESTINATION) {
    return DEFAULT_AUTH_DESTINATION;
  }
  return `/sign-in?redirect_url=${encodeURIComponent(safe)}`;
}

export function buildSignUpHref(options?: {
  plan?: string | null;
  returnTo?: string | null;
}): string {
  const params = new URLSearchParams();
  if (options?.plan) {
    const plan = parseCheckoutPlanKey(options.plan);
    if (plan) {
      params.set("plan", plan);
    }
  }
  if (options?.returnTo) {
    const safe = sanitizeReturnPath(options.returnTo, "/app");
    params.set("redirect_url", safe);
  }
  const query = params.toString();
  return query ? `/sign-up?${query}` : "/sign-up";
}

export function getDefaultPostAuthDestination(plan?: string | null): string {
  if (plan && isPlanKey(plan)) {
    return "/onboarding";
  }
  return DEFAULT_APP_DESTINATION;
}
