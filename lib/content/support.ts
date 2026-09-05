import { ORGANIZATION } from "@/lib/seo/site";

export type SupportContactConfig = {
  supportEmail: string | null;
  securityEmail: string | null;
  privacyEmail: string | null;
  billingEmail: string | null;
  billingGuidance: string;
  securityGuidance: string;
  privacyGuidance: string;
  deletionGuidance: string;
  whatToInclude: string[];
  docsLinks: { href: string; label: string }[];
};

/**
 * Resolve public support contact details.
 * Prefer env when set; fall back to organization email outside production.
 */
export function getSupportContactConfig(): SupportContactConfig {
  const supportEmail =
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() ||
    (process.env.NODE_ENV === "production" ? null : ORGANIZATION.email);
  const securityEmail =
    process.env.SECURITY_CONTACT_EMAIL?.trim() ||
    supportEmail ||
    (process.env.NODE_ENV === "production" ? null : ORGANIZATION.email);
  const privacyEmail =
    process.env.PRIVACY_CONTACT_EMAIL?.trim() ||
    supportEmail ||
    (process.env.NODE_ENV === "production" ? null : ORGANIZATION.email);
  const billingEmail =
    process.env.BILLING_CONTACT_EMAIL?.trim() ||
    supportEmail ||
    (process.env.NODE_ENV === "production" ? null : ORGANIZATION.email);

  return {
    supportEmail,
    securityEmail,
    privacyEmail,
    billingEmail,
    billingGuidance:
      "For plan changes, invoices, failed payments, or cancellation questions, include your workspace name and the billing email on the account. Owners and admins can also manage billing from the app.",
    securityGuidance:
      "For security reports, describe the issue, affected surface, and steps to reproduce. Do not include verification tokens, webhook URLs, or private customer data.",
    privacyGuidance:
      "For access, correction, export, or deletion requests, include your workspace name and the email on the account so we can verify identity.",
    deletionGuidance:
      "Cancellation does not automatically delete evidence. Workspace or account deletion requests are handled through support after identity and workspace verification. Some billing and security records may be retained where required.",
    whatToInclude: [
      "What you were trying to do",
      "The page or feature involved",
      "Approximate time of the issue",
      "Whether monitoring, alerts, billing, or domain verification is affected",
      "A support summary copied from the app help menu, if available",
    ],
    docsLinks: [
      { href: "/docs/getting-started", label: "Getting started" },
      { href: "/docs/troubleshooting", label: "Troubleshooting" },
      { href: "/docs/billing-and-limits", label: "Billing and limits" },
      { href: "/docs/domain-verification", label: "Domain verification" },
      { href: "/security", label: "Security overview" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/contact", label: "Contact" },
    ],
  };
}

export const SUPPORT_REQUEST_GUIDANCE = {
  title: "What to include",
  note: "Cited does not promise a response time. Clear details help support investigate faster.",
} as const;

export const APP_VERSION_LABEL = "1.0.0";
