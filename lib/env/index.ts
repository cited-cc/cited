import { z } from "zod";

import { hydrateDatabaseUrlsFromEnv } from "@/lib/db/build-connection-url.mjs";
import { getPublicDeploymentMode } from "@/lib/deployment/public-config";
import { hydrateSecretFilesFromEnv } from "@/lib/env/secret-files.mjs";

const emptyToUndefined = (value: unknown) =>
  value === "" || value === undefined || value === null ? undefined : value;

const optionalSecret = z.preprocess(
  emptyToUndefined,
  z.string().min(1).optional(),
);

const booleanFlag = z.preprocess((value) => {
  const cleaned = emptyToUndefined(value);
  if (cleaned === undefined) return undefined;
  if (typeof cleaned === "boolean") return cleaned;
  const normalized = String(cleaned).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return cleaned;
}, z.boolean().optional());

const positiveInt = (fallback: number) =>
  z.preprocess((value) => {
    const cleaned = emptyToUndefined(value);
    if (cleaned === undefined) return fallback;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : cleaned;
  }, z.number().int().positive().default(fallback));

const nonNegativeInt = (fallback: number) =>
  z.preprocess((value) => {
    const cleaned = emptyToUndefined(value);
    if (cleaned === undefined) return fallback;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : cleaned;
  }, z.number().int().min(0).default(fallback));

const DATAFORSEO_ALLOWED_HOSTS = new Set([
  "api.dataforseo.com",
  "sandbox.dataforseo.com",
]);

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.preprocess(
    (value) => emptyToUndefined(value) ?? "http://localhost:3000",
    z.string().url(),
  ),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.preprocess(
    emptyToUndefined,
    z.string().min(1).optional(),
  ),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.preprocess(
    (value) => emptyToUndefined(value) ?? "/sign-in",
    z.string().min(1),
  ),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.preprocess(
    (value) => emptyToUndefined(value) ?? "/sign-up",
    z.string().min(1),
  ),
  NEXT_PUBLIC_FREE_SCAN_ENABLED: booleanFlag,
  NEXT_PUBLIC_LAUNCH_MODE: booleanFlag,
  NEXT_PUBLIC_PRODUCT_HUNT_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
  NEXT_PUBLIC_LAUNCH_OFFER_ENABLED: booleanFlag,
  NEXT_PUBLIC_CITED_CHATBOT_ENABLED: booleanFlag,
});

const serverEnvBaseSchema = publicEnvSchema.extend({
  CLERK_SECRET_KEY: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  CLERK_WEBHOOK_SECRET: optionalSecret,
  SUPABASE_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
  SUPABASE_ANON_KEY: optionalSecret,
  SUPABASE_SERVICE_ROLE_KEY: optionalSecret,
  STRIPE_SECRET_KEY: optionalSecret,
  STRIPE_WEBHOOK_SECRET: optionalSecret,
  STRIPE_FOUNDER_PRICE_ID: optionalSecret,
  STRIPE_GROWTH_PRICE_ID: optionalSecret,
  STRIPE_PRO_PRICE_ID: optionalSecret,
  STRIPE_PORTFOLIO_PRICE_ID: optionalSecret,
  STRIPE_PORTFOLIO_EXTRA_DOMAIN_PRICE_ID: optionalSecret,
  STRIPE_CUSTOMER_PORTAL_RETURN_URL: z.preprocess(
    emptyToUndefined,
    z.string().url().optional(),
  ),
  STRIPE_BILLING_PORTAL_CONFIGURATION_ID: optionalSecret,
  STRIPE_TAX_ENABLED: booleanFlag,
  STRIPE_MANAGED_PAYMENTS_ENABLED: booleanFlag,
  STRIPE_PROMOTION_CODES_ENABLED: booleanFlag,
  /** Canonical billing enable flag. STRIPE_BILLING_ENABLED remains accepted. */
  BILLING_ENABLED: booleanFlag,
  STRIPE_BILLING_ENABLED: booleanFlag,
  BILLING_RECONCILIATION_ENABLED: booleanFlag,
  BILLING_CRON_SECRET: optionalSecret,
  BILLING_GRACE_PERIOD_DAYS: positiveInt(7),
  BILLING_RECONCILE_BATCH_SIZE: positiveInt(25),
  BILLING_RECONCILE_STALE_HOURS: positiveInt(24),
  CHECKOUT_INTENT_TTL_MINUTES: z.preprocess((value) => {
    const cleaned = emptyToUndefined(value);
    if (cleaned === undefined) return undefined;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : cleaned;
  }, z.number().int().positive().max(180).optional()),
  RESEND_API_KEY: optionalSecret,
  RESEND_FROM_EMAIL: optionalSecret,
  RESEND_REPLY_TO_EMAIL: optionalSecret,
  RESEND_WEBHOOK_SECRET: optionalSecret,
  RESEND_INBOUND_SETUP_TOKEN: optionalSecret,
  INBOUND_MAIL_FORWARD_TO: optionalSecret,
  RESEND_INBOUND_FORWARD_FROM: optionalSecret,
  NOTIFICATIONS_ENABLED: booleanFlag,
  NOTIFICATIONS_CRON_SECRET: optionalSecret,
  NOTIFICATIONS_DISPATCH_BATCH_SIZE: positiveInt(25),
  NOTIFICATIONS_MAX_ATTEMPTS: positiveInt(5),
  NOTIFICATIONS_STALE_LOCK_MINUTES: positiveInt(15),
  NOTIFICATIONS_BASE_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
  CITED_EMAIL_PROVIDER: z.preprocess(
    emptyToUndefined,
    z.enum(["resend", "smtp", "disabled"]).optional(),
  ),
  SMTP_HOST: optionalSecret,
  SMTP_PORT: positiveInt(587),
  SMTP_USER: optionalSecret,
  SMTP_PASSWORD: optionalSecret,
  SMTP_FROM_EMAIL: optionalSecret,
  SMTP_SECURE: booleanFlag,
  CITED_JOBS_WORKER_TICK_MS: positiveInt(30_000),
  CITED_RETENTION_DRY_RUN: booleanFlag,
  CITED_RETENTION_EXPIRED_INVITATIONS_DAYS: nonNegativeInt(0),
  CITED_RETENTION_RATE_LIMIT_BUCKETS_DAYS: nonNegativeInt(7),
  CITED_RETENTION_FAILED_NOTIFICATIONS_DAYS: nonNegativeInt(0),
  SLACK_WEBHOOK_ENCRYPTION_KEY: optionalSecret,
  NOTIFICATION_UNSUBSCRIBE_TOKEN_TTL_DAYS: positiveInt(90),
  DATAFORSEO_LOGIN: optionalSecret,
  DATAFORSEO_PASSWORD: optionalSecret,
  DATAFORSEO_API_BASE_URL: z.preprocess(
    (value) => emptyToUndefined(value) ?? "https://api.dataforseo.com",
    z.string().url(),
  ),
  /** Canonical monitoring provider selection (Phase 8). */
  CITED_MONITORING_PROVIDER: z.preprocess(
    emptyToUndefined,
    z.enum(["dataforseo", "mock"]).optional(),
  ),
  /** Optional per-surface provider routing JSON object. */
  CITED_SURFACE_PROVIDER_MAP: z.preprocess(emptyToUndefined, z.string().optional()),
  /** Allow mock provider in self-hosted production when true. */
  CITED_ALLOW_MOCK_PROVIDER: booleanFlag,
  /** @deprecated Prefer CITED_MONITORING_PROVIDER */
  MONITORING_PROVIDER: z.preprocess(
    emptyToUndefined,
    z.enum(["dataforseo", "mock"]).optional(),
  ),
  MONITORING_ENABLED: booleanFlag,
  MONITORING_CRON_SECRET: optionalSecret,
  /** Optional dedicated free-scan cron secret; falls back to MONITORING_CRON_SECRET. */
  FREE_SCAN_CRON_SECRET: optionalSecret,
  /** @deprecated Prefer MONITORING_CRON_SECRET; still accepted for compatibility. */
  CRON_SECRET: optionalSecret,
  MONITORING_DISPATCH_BATCH_SIZE: positiveInt(25),
  MONITORING_PROCESS_BATCH_SIZE: positiveInt(20),
  MONITORING_DISPATCH_TIME_BUDGET_MS: positiveInt(240_000),
  MONITORING_DISPATCH_MAX_ROUNDS: positiveInt(25),
  MONITORING_MAX_ATTEMPTS: positiveInt(4),
  MONITORING_MAX_POLL_ATTEMPTS: positiveInt(12),
  MONITORING_PROVIDER_TIMEOUT_MS: positiveInt(90_000),
  MONITORING_STALE_RUN_MINUTES: positiveInt(90),
  INTERNAL_JOB_TIMEOUT_MS: positiveInt(130_000),
  STALE_LOCK_MINUTES: positiveInt(15),
  MONITORING_USAGE_SAFETY_PERCENT: z.preprocess((value) => {
    const cleaned = emptyToUndefined(value);
    if (cleaned === undefined) return 95;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : cleaned;
  }, z.number().min(1).max(100).default(95)),
  MONITORING_MAX_RAW_PAYLOAD_BYTES: positiveInt(524_288),
  MONITORING_ENABLED_SURFACES: z.preprocess(
    (value) =>
      emptyToUndefined(value) ??
      "chatgpt,gemini,perplexity,claude,google_ai_overviews,google_ai_mode",
    z.string().min(1),
  ),
  MONITORING_ALLOW_MOCK_PROVIDER: booleanFlag,
  SENTRY_DSN: optionalSecret,
  FREE_SCAN_ENABLED: booleanFlag,
  NEXT_PUBLIC_SUPPORT_EMAIL: z.preprocess(
    emptyToUndefined,
    z.string().email().optional(),
  ),
  SECURITY_CONTACT_EMAIL: z.preprocess(
    emptyToUndefined,
    z.string().email().optional(),
  ),
  PRIVACY_CONTACT_EMAIL: z.preprocess(
    emptyToUndefined,
    z.string().email().optional(),
  ),
  BILLING_CONTACT_EMAIL: z.preprocess(
    emptyToUndefined,
    z.string().email().optional(),
  ),
  LEARN_DOMAINS_ENABLED: booleanFlag,
  LEARN_DOMAINS_APP_URL: z.preprocess(
    emptyToUndefined,
    z.string().url().optional(),
  ),
  LEARN_DOMAINS_HANDOFF_SIGNING_SECRET: optionalSecret,
  /** DataFast website API key (df_...) for server-side goals and identify. */
  DATAFAST_API_KEY: optionalSecret,
  /** Vercel AI Gateway key for Cited AI chatbot (optional; OIDC also works on Vercel). */
  AI_GATEWAY_API_KEY: optionalSecret,
  /** Anthropic API key for Cited AI chatbot (sk-ant-...). */
  ANTHROPIC_API_KEY: optionalSecret,
  /** Self-hosted operational safety limits (Phase 6). */
  CITED_SELF_HOSTED_MAX_USERS: z.preprocess(emptyToUndefined, z.string().optional()),
  CITED_SELF_HOSTED_MAX_DOMAINS: z.preprocess(emptyToUndefined, z.string().optional()),
  CITED_SELF_HOSTED_MAX_MONITORS: z.preprocess(emptyToUndefined, z.string().optional()),
  CITED_SELF_HOSTED_MAX_PROMPTS: z.preprocess(emptyToUndefined, z.string().optional()),
  CITED_SELF_HOSTED_HISTORY_DAYS: z.preprocess(emptyToUndefined, z.string().optional()),
  /** Database provider (Phase 7). */
  CITED_DATABASE_PROVIDER: z.preprocess(emptyToUndefined, z.enum(["supabase", "postgres"]).optional()),
  DATABASE_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
  DATABASE_MIGRATION_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
  DATABASE_POOL_MAX: z.preprocess(emptyToUndefined, z.string().optional()),
  DATABASE_IDLE_TIMEOUT_SECONDS: z.preprocess(emptyToUndefined, z.string().optional()),
  DATABASE_CONNECT_TIMEOUT_SECONDS: z.preprocess(emptyToUndefined, z.string().optional()),
  DATABASE_SSL_MODE: z.preprocess(emptyToUndefined, z.string().optional()),
});

const serverEnvSchema = serverEnvBaseSchema.superRefine((data, ctx) => {
  const isProd = process.env.NODE_ENV === "production";
  const deploymentMode = getPublicDeploymentMode();
  const authProvider = (
    process.env.CITED_AUTH_PROVIDER?.trim().toLowerCase() ??
    (deploymentMode === "self_hosted" ? "local" : "clerk")
  );
  const isSelfHostedLocalAuth =
    deploymentMode === "self_hosted" && authProvider === "local";
  const hasDiscreteDatabaseConfig = Boolean(
    process.env.DATABASE_HOST ||
      process.env.DATABASE_NAME ||
      process.env.DATABASE_USER ||
      process.env.DATABASE_PASSWORD ||
      process.env.DATABASE_PASSWORD_FILE,
  );

  try {
    const host = new URL(data.DATAFORSEO_API_BASE_URL).hostname;
    if (isProd && !DATAFORSEO_ALLOWED_HOSTS.has(host)) {
      ctx.addIssue({
        code: "custom",
        path: ["DATAFORSEO_API_BASE_URL"],
        message:
          "Production DATAFORSEO_API_BASE_URL must be an official DataForSEO host.",
      });
    }
    if (!isProd && !DATAFORSEO_ALLOWED_HOSTS.has(host)) {
      // Allow localhost only outside production for proxy testing.
      if (host !== "localhost" && host !== "127.0.0.1") {
        ctx.addIssue({
          code: "custom",
          path: ["DATAFORSEO_API_BASE_URL"],
          message:
            "DATAFORSEO_API_BASE_URL must be an official DataForSEO host (or localhost in development).",
        });
      }
    }
  } catch {
    ctx.addIssue({
      code: "custom",
      path: ["DATAFORSEO_API_BASE_URL"],
      message: "Invalid DATAFORSEO_API_BASE_URL.",
    });
  }

  if (isProd) {
    try {
      const appUrl = new URL(data.NEXT_PUBLIC_APP_URL);
      if (deploymentMode === "cloud" && appUrl.protocol !== "https:") {
        ctx.addIssue({
          code: "custom",
          path: ["NEXT_PUBLIC_APP_URL"],
          message: "Production NEXT_PUBLIC_APP_URL must use https.",
        });
      }
      if (
        deploymentMode === "cloud" &&
        (appUrl.hostname === "localhost" || appUrl.hostname === "127.0.0.1")
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["NEXT_PUBLIC_APP_URL"],
          message: "Production NEXT_PUBLIC_APP_URL cannot be localhost.",
        });
      }
    } catch {
      ctx.addIssue({
        code: "custom",
        path: ["NEXT_PUBLIC_APP_URL"],
        message: "Invalid NEXT_PUBLIC_APP_URL.",
      });
    }

    if (!data.NEXT_PUBLIC_SUPPORT_EMAIL) {
      ctx.addIssue({
        code: "custom",
        path: ["NEXT_PUBLIC_SUPPORT_EMAIL"],
        message: "NEXT_PUBLIC_SUPPORT_EMAIL is required in production.",
      });
    }
    if (!data.SECURITY_CONTACT_EMAIL) {
      ctx.addIssue({
        code: "custom",
        path: ["SECURITY_CONTACT_EMAIL"],
        message: "SECURITY_CONTACT_EMAIL is required in production.",
      });
    }

    if (deploymentMode === "cloud" && !data.CLERK_WEBHOOK_SECRET) {
      ctx.addIssue({
        code: "custom",
        path: ["CLERK_WEBHOOK_SECRET"],
        message: "CLERK_WEBHOOK_SECRET is required in production.",
      });
    }

    if (deploymentMode === "cloud" && authProvider === "clerk") {
      if (!data.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
        ctx.addIssue({
          code: "custom",
          path: ["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"],
          message: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required in cloud production.",
        });
      }
      if (!data.CLERK_SECRET_KEY) {
        ctx.addIssue({
          code: "custom",
          path: ["CLERK_SECRET_KEY"],
          message: "CLERK_SECRET_KEY is required in cloud production.",
        });
      }
    }

    const databaseProvider =
      data.CITED_DATABASE_PROVIDER ??
      (deploymentMode === "cloud" ? "supabase" : "postgres");

    if (databaseProvider === "supabase" && !data.SUPABASE_SERVICE_ROLE_KEY) {
      ctx.addIssue({
        code: "custom",
        path: ["SUPABASE_SERVICE_ROLE_KEY"],
        message: "SUPABASE_SERVICE_ROLE_KEY is required in production when using Supabase.",
      });
    }

    if (deploymentMode === "cloud" && databaseProvider !== "supabase") {
      ctx.addIssue({
        code: "custom",
        path: ["CITED_DATABASE_PROVIDER"],
        message: "Cloud deployment mode requires CITED_DATABASE_PROVIDER=supabase.",
      });
    }

    if (databaseProvider === "supabase") {
      if (!data.SUPABASE_URL) {
        ctx.addIssue({
          code: "custom",
          path: ["SUPABASE_URL"],
          message: "SUPABASE_URL is required when CITED_DATABASE_PROVIDER=supabase.",
        });
      }
      if (!data.SUPABASE_ANON_KEY) {
        ctx.addIssue({
          code: "custom",
          path: ["SUPABASE_ANON_KEY"],
          message: "SUPABASE_ANON_KEY is required when CITED_DATABASE_PROVIDER=supabase.",
        });
      }
    }

    if (databaseProvider === "postgres" && deploymentMode === "self_hosted" && !data.DATABASE_URL) {
      if (!hasDiscreteDatabaseConfig) {
        ctx.addIssue({
          code: "custom",
          path: ["DATABASE_URL"],
          message:
            "DATABASE_URL or discrete DATABASE_HOST/USER/PASSWORD configuration is required for self-hosted PostgreSQL in production.",
        });
      }
    }

    const mockAllowed =
      isSelfHostedLocalAuth &&
      (data.CITED_ALLOW_MOCK_PROVIDER === true ||
        data.MONITORING_ALLOW_MOCK_PROVIDER === true);
    if (
      (data.CITED_MONITORING_PROVIDER === "mock" ||
        data.MONITORING_PROVIDER === "mock") &&
      !mockAllowed
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["CITED_MONITORING_PROVIDER"],
        message: "Mock monitoring provider is not allowed in production.",
      });
    }
    if (
      !isSelfHostedLocalAuth &&
      (data.CITED_ALLOW_MOCK_PROVIDER === true ||
        data.MONITORING_ALLOW_MOCK_PROVIDER === true)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["CITED_ALLOW_MOCK_PROVIDER"],
        message: "CITED_ALLOW_MOCK_PROVIDER must be false in production cloud deployments.",
      });
    }

    const selectedMonitoringProvider =
      data.CITED_MONITORING_PROVIDER ?? data.MONITORING_PROVIDER ?? "dataforseo";
    if (
      data.MONITORING_ENABLED === true &&
      selectedMonitoringProvider === "dataforseo"
    ) {
      if (!data.DATAFORSEO_LOGIN) {
        ctx.addIssue({
          code: "custom",
          path: ["DATAFORSEO_LOGIN"],
          message: "DATAFORSEO_LOGIN is required when monitoring uses DataForSEO.",
        });
      }
      if (!data.DATAFORSEO_PASSWORD) {
        ctx.addIssue({
          code: "custom",
          path: ["DATAFORSEO_PASSWORD"],
          message: "DATAFORSEO_PASSWORD is required when monitoring uses DataForSEO.",
        });
      }
      if (!data.MONITORING_CRON_SECRET && !data.CRON_SECRET) {
        ctx.addIssue({
          code: "custom",
          path: ["MONITORING_CRON_SECRET"],
          message:
            "MONITORING_CRON_SECRET is required when monitoring is enabled.",
        });
      }
    }

    const billingEnabled =
      data.BILLING_ENABLED !== false && data.STRIPE_BILLING_ENABLED !== false;
    if (billingEnabled && getPublicDeploymentMode() === "cloud") {
      const requiredBilling: Array<[keyof typeof data, string | undefined]> = [
        ["STRIPE_SECRET_KEY", data.STRIPE_SECRET_KEY],
        ["STRIPE_WEBHOOK_SECRET", data.STRIPE_WEBHOOK_SECRET],
        ["STRIPE_FOUNDER_PRICE_ID", data.STRIPE_FOUNDER_PRICE_ID],
        ["STRIPE_GROWTH_PRICE_ID", data.STRIPE_GROWTH_PRICE_ID],
        ["STRIPE_PRO_PRICE_ID", data.STRIPE_PRO_PRICE_ID],
        ["STRIPE_PORTFOLIO_PRICE_ID", data.STRIPE_PORTFOLIO_PRICE_ID],
      ];
      for (const [path, value] of requiredBilling) {
        if (!value) {
          ctx.addIssue({
            code: "custom",
            path: [path],
            message: `${String(path)} is required when billing is enabled in production.`,
          });
        }
      }
    }

    if (data.NOTIFICATIONS_ENABLED === true) {
      const emailProvider =
        data.CITED_EMAIL_PROVIDER ??
        (getPublicDeploymentMode() === "cloud" ? "resend" : "smtp");

      if (emailProvider === "resend") {
        if (!data.RESEND_API_KEY) {
          ctx.addIssue({
            code: "custom",
            path: ["RESEND_API_KEY"],
            message: "RESEND_API_KEY is required when notifications use Resend.",
          });
        }
        if (!data.RESEND_FROM_EMAIL) {
          ctx.addIssue({
            code: "custom",
            path: ["RESEND_FROM_EMAIL"],
            message:
              "RESEND_FROM_EMAIL is required when notifications use Resend.",
          });
        }
      }

      if (emailProvider === "smtp") {
        if (!data.SMTP_HOST) {
          ctx.addIssue({
            code: "custom",
            path: ["SMTP_HOST"],
            message: "SMTP_HOST is required when notifications use SMTP.",
          });
        }
        if (!data.SMTP_FROM_EMAIL) {
          ctx.addIssue({
            code: "custom",
            path: ["SMTP_FROM_EMAIL"],
            message: "SMTP_FROM_EMAIL is required when notifications use SMTP.",
          });
        }
      }

      if (
        !data.NOTIFICATIONS_CRON_SECRET &&
        !data.MONITORING_CRON_SECRET &&
        !data.CRON_SECRET
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["NOTIFICATIONS_CRON_SECRET"],
          message:
            "NOTIFICATIONS_CRON_SECRET is required when notifications are enabled.",
        });
      }
    }
  }
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedPublicEnv: PublicEnv | null = null;
let cachedServerEnv: ServerEnv | null = null;

function resolveSupabaseUrl(): string | undefined {
  return (
    emptyToUndefined(process.env.SUPABASE_URL) ??
    emptyToUndefined(process.env.NEXT_PUBLIC_SUPABASE_URL)
  ) as string | undefined;
}

/**
 * Prefer classic anon/service-role names; accept Vercel Supabase integration aliases.
 */
function resolveSupabaseAnonKey(): string | undefined {
  return (
    emptyToUndefined(process.env.SUPABASE_ANON_KEY) ??
    emptyToUndefined(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ??
    emptyToUndefined(process.env.SUPABASE_PUBLISHABLE_KEY) ??
    emptyToUndefined(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
  ) as string | undefined;
}

function resolveSupabaseServiceRoleKey(): string | undefined {
  return (
    emptyToUndefined(process.env.SUPABASE_SERVICE_ROLE_KEY) ??
    emptyToUndefined(process.env.SUPABASE_SECRET_KEY)
  ) as string | undefined;
}

export function getPublicEnv(): PublicEnv {
  if (cachedPublicEnv) {
    return cachedPublicEnv;
  }

  const parsed = publicEnvSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
    NEXT_PUBLIC_FREE_SCAN_ENABLED: process.env.NEXT_PUBLIC_FREE_SCAN_ENABLED,
    NEXT_PUBLIC_LAUNCH_MODE: process.env.NEXT_PUBLIC_LAUNCH_MODE,
    NEXT_PUBLIC_PRODUCT_HUNT_URL: process.env.NEXT_PUBLIC_PRODUCT_HUNT_URL,
    NEXT_PUBLIC_LAUNCH_OFFER_ENABLED:
      process.env.NEXT_PUBLIC_LAUNCH_OFFER_ENABLED,
    NEXT_PUBLIC_CITED_CHATBOT_ENABLED:
      process.env.NEXT_PUBLIC_CITED_CHATBOT_ENABLED,
  });

  if (!parsed.success) {
    throw new Error(
      `Invalid public environment: ${parsed.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ")}`,
    );
  }

  cachedPublicEnv = parsed.data;
  return cachedPublicEnv;
}

/**
 * Server-only environment validation.
 * Never import this module's getServerEnv from Client Components.
 */
export function getServerEnv(): ServerEnv {
  if (typeof window !== "undefined") {
    throw new Error("getServerEnv() must only be called on the server.");
  }

  if (cachedServerEnv) {
    return cachedServerEnv;
  }

  hydrateSecretFilesFromEnv();
  hydrateDatabaseUrlsFromEnv();

  const parsed = serverEnvSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
    NEXT_PUBLIC_FREE_SCAN_ENABLED: process.env.NEXT_PUBLIC_FREE_SCAN_ENABLED,
    NEXT_PUBLIC_LAUNCH_MODE: process.env.NEXT_PUBLIC_LAUNCH_MODE,
    NEXT_PUBLIC_PRODUCT_HUNT_URL: process.env.NEXT_PUBLIC_PRODUCT_HUNT_URL,
    NEXT_PUBLIC_LAUNCH_OFFER_ENABLED:
      process.env.NEXT_PUBLIC_LAUNCH_OFFER_ENABLED,
    NEXT_PUBLIC_CITED_CHATBOT_ENABLED:
      process.env.NEXT_PUBLIC_CITED_CHATBOT_ENABLED,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
    SUPABASE_URL: resolveSupabaseUrl(),
    SUPABASE_ANON_KEY: resolveSupabaseAnonKey(),
    SUPABASE_SERVICE_ROLE_KEY: resolveSupabaseServiceRoleKey(),
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_FOUNDER_PRICE_ID: process.env.STRIPE_FOUNDER_PRICE_ID,
    STRIPE_GROWTH_PRICE_ID: process.env.STRIPE_GROWTH_PRICE_ID,
    STRIPE_PRO_PRICE_ID: process.env.STRIPE_PRO_PRICE_ID,
    STRIPE_PORTFOLIO_PRICE_ID: process.env.STRIPE_PORTFOLIO_PRICE_ID,
    STRIPE_CUSTOMER_PORTAL_RETURN_URL:
      process.env.STRIPE_CUSTOMER_PORTAL_RETURN_URL,
    STRIPE_BILLING_PORTAL_CONFIGURATION_ID:
      process.env.STRIPE_BILLING_PORTAL_CONFIGURATION_ID,
    STRIPE_TAX_ENABLED: process.env.STRIPE_TAX_ENABLED,
    STRIPE_MANAGED_PAYMENTS_ENABLED:
      process.env.STRIPE_MANAGED_PAYMENTS_ENABLED,
    STRIPE_PROMOTION_CODES_ENABLED: process.env.STRIPE_PROMOTION_CODES_ENABLED,
    BILLING_ENABLED: process.env.BILLING_ENABLED,
    STRIPE_BILLING_ENABLED: process.env.STRIPE_BILLING_ENABLED,
    BILLING_RECONCILIATION_ENABLED: process.env.BILLING_RECONCILIATION_ENABLED,
    BILLING_CRON_SECRET: process.env.BILLING_CRON_SECRET,
    BILLING_GRACE_PERIOD_DAYS: process.env.BILLING_GRACE_PERIOD_DAYS,
    BILLING_RECONCILE_BATCH_SIZE: process.env.BILLING_RECONCILE_BATCH_SIZE,
    BILLING_RECONCILE_STALE_HOURS: process.env.BILLING_RECONCILE_STALE_HOURS,
    CHECKOUT_INTENT_TTL_MINUTES: process.env.CHECKOUT_INTENT_TTL_MINUTES,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    RESEND_REPLY_TO_EMAIL: process.env.RESEND_REPLY_TO_EMAIL,
    RESEND_WEBHOOK_SECRET: process.env.RESEND_WEBHOOK_SECRET,
    RESEND_INBOUND_SETUP_TOKEN: process.env.RESEND_INBOUND_SETUP_TOKEN,
    INBOUND_MAIL_FORWARD_TO: process.env.INBOUND_MAIL_FORWARD_TO,
    RESEND_INBOUND_FORWARD_FROM: process.env.RESEND_INBOUND_FORWARD_FROM,
    NOTIFICATIONS_ENABLED: process.env.NOTIFICATIONS_ENABLED,
    NOTIFICATIONS_CRON_SECRET: process.env.NOTIFICATIONS_CRON_SECRET,
    NOTIFICATIONS_DISPATCH_BATCH_SIZE:
      process.env.NOTIFICATIONS_DISPATCH_BATCH_SIZE,
    NOTIFICATIONS_MAX_ATTEMPTS: process.env.NOTIFICATIONS_MAX_ATTEMPTS,
    NOTIFICATIONS_STALE_LOCK_MINUTES:
      process.env.NOTIFICATIONS_STALE_LOCK_MINUTES,
    NOTIFICATIONS_BASE_URL: process.env.NOTIFICATIONS_BASE_URL,
    CITED_EMAIL_PROVIDER: process.env.CITED_EMAIL_PROVIDER,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
    SMTP_FROM_EMAIL: process.env.SMTP_FROM_EMAIL,
    SMTP_SECURE: process.env.SMTP_SECURE,
    CITED_JOBS_WORKER_TICK_MS: process.env.CITED_JOBS_WORKER_TICK_MS,
    CITED_RETENTION_DRY_RUN: process.env.CITED_RETENTION_DRY_RUN,
    CITED_RETENTION_EXPIRED_INVITATIONS_DAYS:
      process.env.CITED_RETENTION_EXPIRED_INVITATIONS_DAYS,
    CITED_RETENTION_RATE_LIMIT_BUCKETS_DAYS:
      process.env.CITED_RETENTION_RATE_LIMIT_BUCKETS_DAYS,
    CITED_RETENTION_FAILED_NOTIFICATIONS_DAYS:
      process.env.CITED_RETENTION_FAILED_NOTIFICATIONS_DAYS,
    SLACK_WEBHOOK_ENCRYPTION_KEY: process.env.SLACK_WEBHOOK_ENCRYPTION_KEY,
    NOTIFICATION_UNSUBSCRIBE_TOKEN_TTL_DAYS:
      process.env.NOTIFICATION_UNSUBSCRIBE_TOKEN_TTL_DAYS,
    DATAFORSEO_LOGIN: process.env.DATAFORSEO_LOGIN,
    DATAFORSEO_PASSWORD: process.env.DATAFORSEO_PASSWORD,
    DATAFORSEO_API_BASE_URL: process.env.DATAFORSEO_API_BASE_URL,
    CITED_MONITORING_PROVIDER: process.env.CITED_MONITORING_PROVIDER,
    CITED_SURFACE_PROVIDER_MAP: process.env.CITED_SURFACE_PROVIDER_MAP,
    CITED_ALLOW_MOCK_PROVIDER: process.env.CITED_ALLOW_MOCK_PROVIDER,
    MONITORING_PROVIDER: process.env.MONITORING_PROVIDER,
    MONITORING_ENABLED: process.env.MONITORING_ENABLED,
    MONITORING_CRON_SECRET: process.env.MONITORING_CRON_SECRET,
    FREE_SCAN_CRON_SECRET: process.env.FREE_SCAN_CRON_SECRET,
    CRON_SECRET: process.env.CRON_SECRET,
    MONITORING_DISPATCH_BATCH_SIZE: process.env.MONITORING_DISPATCH_BATCH_SIZE,
    MONITORING_PROCESS_BATCH_SIZE: process.env.MONITORING_PROCESS_BATCH_SIZE,
    MONITORING_DISPATCH_TIME_BUDGET_MS:
      process.env.MONITORING_DISPATCH_TIME_BUDGET_MS,
    MONITORING_DISPATCH_MAX_ROUNDS: process.env.MONITORING_DISPATCH_MAX_ROUNDS,
    MONITORING_MAX_ATTEMPTS: process.env.MONITORING_MAX_ATTEMPTS,
    MONITORING_MAX_POLL_ATTEMPTS: process.env.MONITORING_MAX_POLL_ATTEMPTS,
    MONITORING_PROVIDER_TIMEOUT_MS: process.env.MONITORING_PROVIDER_TIMEOUT_MS,
    MONITORING_STALE_RUN_MINUTES: process.env.MONITORING_STALE_RUN_MINUTES,
    INTERNAL_JOB_TIMEOUT_MS: process.env.INTERNAL_JOB_TIMEOUT_MS,
    STALE_LOCK_MINUTES: process.env.STALE_LOCK_MINUTES,
    MONITORING_USAGE_SAFETY_PERCENT: process.env.MONITORING_USAGE_SAFETY_PERCENT,
    MONITORING_MAX_RAW_PAYLOAD_BYTES:
      process.env.MONITORING_MAX_RAW_PAYLOAD_BYTES,
    MONITORING_ENABLED_SURFACES: process.env.MONITORING_ENABLED_SURFACES,
    MONITORING_ALLOW_MOCK_PROVIDER: process.env.MONITORING_ALLOW_MOCK_PROVIDER,
    SENTRY_DSN: process.env.SENTRY_DSN,
    FREE_SCAN_ENABLED: process.env.FREE_SCAN_ENABLED,
    NEXT_PUBLIC_SUPPORT_EMAIL: process.env.NEXT_PUBLIC_SUPPORT_EMAIL,
    SECURITY_CONTACT_EMAIL: process.env.SECURITY_CONTACT_EMAIL,
    PRIVACY_CONTACT_EMAIL: process.env.PRIVACY_CONTACT_EMAIL,
    BILLING_CONTACT_EMAIL: process.env.BILLING_CONTACT_EMAIL,
    LEARN_DOMAINS_ENABLED: process.env.LEARN_DOMAINS_ENABLED,
    LEARN_DOMAINS_APP_URL: process.env.LEARN_DOMAINS_APP_URL,
    LEARN_DOMAINS_HANDOFF_SIGNING_SECRET:
      process.env.LEARN_DOMAINS_HANDOFF_SIGNING_SECRET,
    DATAFAST_API_KEY: process.env.DATAFAST_API_KEY,
    AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    CITED_SELF_HOSTED_MAX_USERS: process.env.CITED_SELF_HOSTED_MAX_USERS,
    CITED_SELF_HOSTED_MAX_DOMAINS: process.env.CITED_SELF_HOSTED_MAX_DOMAINS,
    CITED_SELF_HOSTED_MAX_MONITORS: process.env.CITED_SELF_HOSTED_MAX_MONITORS,
    CITED_SELF_HOSTED_MAX_PROMPTS: process.env.CITED_SELF_HOSTED_MAX_PROMPTS,
    CITED_SELF_HOSTED_HISTORY_DAYS: process.env.CITED_SELF_HOSTED_HISTORY_DAYS,
    CITED_DATABASE_PROVIDER: process.env.CITED_DATABASE_PROVIDER,
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_MIGRATION_URL: process.env.DATABASE_MIGRATION_URL,
    DATABASE_POOL_MAX: process.env.DATABASE_POOL_MAX,
    DATABASE_IDLE_TIMEOUT_SECONDS: process.env.DATABASE_IDLE_TIMEOUT_SECONDS,
    DATABASE_CONNECT_TIMEOUT_SECONDS: process.env.DATABASE_CONNECT_TIMEOUT_SECONDS,
    DATABASE_SSL_MODE: process.env.DATABASE_SSL_MODE,
  });

  if (!parsed.success) {
    throw new Error(
      `Invalid server environment: ${parsed.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ")}`,
    );
  }

  cachedServerEnv = parsed.data;
  return cachedServerEnv;
}

/** Soft validation for scripts that may run with partial local config. */
export function getOptionalServerEnv(): Partial<ServerEnv> {
  const result = serverEnvBaseSchema.partial().safeParse({
    ...process.env,
    SUPABASE_URL: resolveSupabaseUrl(),
    SUPABASE_ANON_KEY: resolveSupabaseAnonKey(),
    SUPABASE_SERVICE_ROLE_KEY: resolveSupabaseServiceRoleKey(),
  });
  return result.success ? (result.data as Partial<ServerEnv>) : {};
}

/** Resolve cron secret preferring MONITORING_CRON_SECRET. */
export function getMonitoringCronSecret(
  env: Partial<ServerEnv> | ServerEnv = getOptionalServerEnv(),
): string | undefined {
  return env.MONITORING_CRON_SECRET ?? env.CRON_SECRET;
}

export function isMonitoringEnabled(
  env: Partial<ServerEnv> | ServerEnv = getOptionalServerEnv(),
): boolean {
  return env.MONITORING_ENABLED === true;
}

/** Resolve notifications cron secret with monitoring/cron fallback. */
export function getNotificationsCronSecret(
  env: Partial<ServerEnv> | ServerEnv = getOptionalServerEnv(),
): string | undefined {
  return (
    env.NOTIFICATIONS_CRON_SECRET ??
    env.MONITORING_CRON_SECRET ??
    env.CRON_SECRET
  );
}

/** Resolve billing cron secret with shared cron fallback. */
export function getBillingCronSecret(
  env: Partial<ServerEnv> | ServerEnv = getOptionalServerEnv(),
): string | undefined {
  return (
    env.BILLING_CRON_SECRET ??
    env.MONITORING_CRON_SECRET ??
    env.CRON_SECRET
  );
}

export function isBillingReconciliationEnabled(
  env: Partial<ServerEnv> | ServerEnv = getOptionalServerEnv(),
): boolean {
  if (getPublicDeploymentMode() !== "cloud") return false;
  if (env.BILLING_RECONCILIATION_ENABLED === false) return false;
  if (env.BILLING_ENABLED === false || env.STRIPE_BILLING_ENABLED === false) {
    return false;
  }
  return Boolean(env.STRIPE_SECRET_KEY);
}

export function isNotificationsEnabled(
  env: Partial<ServerEnv> | ServerEnv = getOptionalServerEnv(),
): boolean {
  return env.NOTIFICATIONS_ENABLED === true;
}

export function getNotificationsBaseUrl(
  env: Partial<ServerEnv> | ServerEnv = getOptionalServerEnv(),
): string {
  return (
    env.NOTIFICATIONS_BASE_URL ??
    env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export function resetEnvCacheForTests(): void {
  cachedPublicEnv = null;
  cachedServerEnv = null;
}
