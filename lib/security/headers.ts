/**
 * Production security headers and Content-Security-Policy for Cited.
 *
 * CSP notes:
 * - Clerk and Stripe require their script/frame/connect origins.
 * - Clerk bot protection (Turnstile) requires challenges.cloudflare.com
 *   in script-src and frame-src, or sign-up/sign-in captcha fails.
 * - Vercel Analytics requires va.vercel-scripts.com when installed.
 * - DataFast is same-origin via Next.js rewrites (/js/script.js, /api/events).
 * - DataForSEO, Resend, and Slack secrets never appear in client CSP needs.
 * - 'unsafe-inline' for styles is required by Next.js / Clerk styling today.
 * - 'unsafe-eval' is avoided in production.
 */

export type SecurityHeader = {
  key: string;
  value: string;
};

const CLERK_SCRIPT_ORIGINS = [
  "https://*.clerk.accounts.dev",
  "https://*.clerk.com",
  "https://clerk.cited.cc",
].join(" ");

const CLERK_CONNECT_ORIGINS = [
  "https://*.clerk.accounts.dev",
  "https://*.clerk.com",
  "https://clerk.cited.cc",
  "https://api.clerk.com",
].join(" ");

/** Cloudflare Turnstile host used by Clerk bot protection. */
const CLERK_CAPTCHA_ORIGIN = "https://challenges.cloudflare.com";

const STRIPE_ORIGINS = [
  "https://js.stripe.com",
  "https://hooks.stripe.com",
  "https://checkout.stripe.com",
  "https://billing.stripe.com",
  "https://api.stripe.com",
].join(" ");

const VERCEL_ANALYTICS = "https://va.vercel-scripts.com https://vitals.vercel-insights.com";

function buildContentSecurityPolicy(): string {
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' ${CLERK_SCRIPT_ORIGINS} ${CLERK_CAPTCHA_ORIGIN} https://js.stripe.com ${VERCEL_ANALYTICS}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src 'self' ${CLERK_CONNECT_ORIGINS} ${CLERK_CAPTCHA_ORIGIN} ${STRIPE_ORIGINS} ${VERCEL_ANALYTICS} https://*.supabase.co wss://*.supabase.co`,
    `frame-src 'self' ${CLERK_SCRIPT_ORIGINS} ${CLERK_CAPTCHA_ORIGIN} https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com https://billing.stripe.com`,
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://checkout.stripe.com https://billing.stripe.com",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ];
  return directives.join("; ");
}

export function getSecurityHeaders(options?: {
  isProduction?: boolean;
  includeHsts?: boolean;
}): SecurityHeader[] {
  const isProduction =
    options?.isProduction ?? process.env.NODE_ENV === "production";
  const includeHsts = options?.includeHsts ?? isProduction;

  const headers: SecurityHeader[] = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value:
        "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), magnetometer=(), gyroscope=(), accelerometer=()",
    },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
    { key: "Cross-Origin-Resource-Policy", value: "same-site" },
    { key: "X-DNS-Prefetch-Control", value: "off" },
    { key: "Content-Security-Policy", value: buildContentSecurityPolicy() },
  ];

  if (includeHsts) {
    // Preload omitted until all cited.cc subdomains are confirmed HTTPS-ready.
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=31536000; includeSubDomains",
    });
  }

  return headers;
}

export function getContentSecurityPolicy(): string {
  return buildContentSecurityPolicy();
}
