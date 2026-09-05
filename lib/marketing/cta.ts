/**
 * Resolve where a pricing CTA should send the user.
 */

import {
  isPublicPlanKey,
  parsePublicPlanKey,
  type PublicPlanKey,
} from "@/lib/content/plans";
import { buildSignInHref, buildSignUpHref } from "@/lib/auth/redirects";

export type PlanCtaContext = {
  plan: PublicPlanKey;
  authenticated?: boolean;
};

export function getPlanCtaHref({
  plan,
  authenticated = false,
}: PlanCtaContext): string {
  if (!isPublicPlanKey(plan)) {
    return authenticated ? "/app" : "/sign-up";
  }

  return authenticated ? "/app" : buildSignUpHref({ plan });
}

export function getSignUpHref(plan?: string | null): string {
  return buildSignUpHref({ plan });
}

export function getSignInHref(returnTo?: string | null): string {
  return buildSignInHref(returnTo);
}

export function preservePlanInPath(
  path: string,
  plan?: string | null,
): string {
  const parsed = parsePublicPlanKey(plan);
  if (!parsed) return path;
  const url = new URL(path, "https://cited.cc");
  url.searchParams.set("plan", parsed);
  return `${url.pathname}${url.search}`;
}

export function readPlanIntent(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>,
): PublicPlanKey | null {
  if (searchParams instanceof URLSearchParams) {
    return parsePublicPlanKey(searchParams.get("plan"));
  }
  const raw = searchParams.plan;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return parsePublicPlanKey(value);
}

/** Managed hosting link for users who prefer not to self-host. */
export const MANAGED_HOSTING_URL = "https://cited.cc";
export const MANAGED_HOSTING_LABEL =
  "Prefer a managed deployment? Visit cited.cc.";
