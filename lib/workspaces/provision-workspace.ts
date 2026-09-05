import type { PlanKey } from "@/types/product";

const RESERVED_SLUGS = new Set([
  "app",
  "api",
  "admin",
  "billing",
  "checkout",
  "docs",
  "onboarding",
  "pricing",
  "scan",
  "security",
  "sign-in",
  "sign-up",
  "forgot-password",
  "www",
  "cited",
]);

export function slugifyWorkspaceName(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  if (!base || RESERVED_SLUGS.has(base)) {
    return "workspace";
  }
  return base;
}

export function validateWorkspaceName(name: string): string {
  const trimmed = name.trim().replace(/\s+/g, " ");
  if (trimmed.length < 2) {
    throw new Error("Workspace name must be at least 2 characters.");
  }
  if (trimmed.length > 80) {
    throw new Error("Workspace name must be 80 characters or fewer.");
  }
  if (/[<>{}]/.test(trimmed)) {
    throw new Error("Workspace name contains unsupported characters.");
  }
  return trimmed;
}

export type SelfHostedPlanKey = PlanKey;
