/**
 * Customer-facing legal and policy content.
 *
 * INTERNAL NOTE (not rendered publicly): These pages describe actual product
 * behavior and are drafted in a protective commercial style. They are not a
 * substitute for jurisdiction-specific counsel review before material launch
 * or enterprise contracting.
 */

import { ORGANIZATION } from "@/lib/seo/site";

export const LEGAL_EFFECTIVE_DATE = "2026-07-09";
export const LEGAL_LAST_UPDATED = "2026-07-09";

export type LegalSection = {
  id: string;
  number?: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
  subsections?: {
    id: string;
    title: string;
    paragraphs: string[];
    bullets?: string[];
  }[];
};

export type LegalPageContent = {
  slug: string;
  title: string;
  description: string;
  eyebrow: string;
  intro: string;
  sections: LegalSection[];
  relatedLinks?: { href: string; label: string }[];
};

export type Subprocessor = {
  name: string;
  purpose: string;
  dataCategories: string;
  locationNote: string;
  required: boolean;
  privacyUrl: string;
};

export const SUBPROCESSORS: Subprocessor[] = [
  {
    name: "Vercel",
    purpose: "Application hosting and edge delivery",
    dataCategories:
      "Request metadata, application logs, deployment configuration",
    locationNote: "United States and Vercel edge regions",
    required: true,
    privacyUrl: "https://vercel.com/legal/privacy-policy",
  },
  {
    name: "Supabase",
    purpose: "Database and server-side storage for workspace data",
    dataCategories:
      "Workspace configuration, monitoring evidence, notification preferences, billing projection fields",
    locationNote: "Configured Supabase project region",
    required: true,
    privacyUrl: "https://supabase.com/privacy",
  },
  {
    name: "Clerk",
    purpose: "Authentication and user session management",
    dataCategories: "Account identifiers, email, authentication metadata",
    locationNote: "United States and Clerk-operated regions",
    required: true,
    privacyUrl: "https://clerk.com/legal/privacy",
  },
  {
    name: "Stripe",
    purpose: "Subscription billing and payment processing",
    dataCategories:
      "Customer and subscription references, invoices, payment method data handled by Stripe",
    locationNote: "United States and Stripe-operated regions",
    required: true,
    privacyUrl: "https://stripe.com/privacy",
  },
  {
    name: "Resend",
    purpose: "Transactional email delivery",
    dataCategories:
      "Recipient email, alert and digest content, delivery metadata",
    locationNote: "United States and Resend-operated regions",
    required: true,
    privacyUrl: "https://resend.com/legal/privacy-policy",
  },
  {
    name: "DataForSEO",
    purpose: "Monitoring data provider for configured AI surfaces (ChatGPT, Gemini, Perplexity, Claude, Google AI Overviews, Google AI Mode)",
    dataCategories:
      "Configured prompts, locations, surface identifiers, and returned monitoring payloads",
    locationNote: "Provider-operated regions",
    required: true,
    privacyUrl: "https://dataforseo.com/privacy-policy",
  },
  {
    name: "Slack",
    purpose: "Optional customer-configured workspace notifications",
    dataCategories:
      "Alert payloads sent to a customer-provided Slack incoming webhook",
    locationNote: "Customer Slack workspace region",
    required: false,
    privacyUrl: "https://slack.com/trust/privacy/privacy-policy",
  },
  {
    name: "Vercel Analytics",
    purpose: "Privacy-conscious web analytics for product and marketing pages",
    dataCategories:
      "Aggregated page-view and performance signals without prompt, note, or evidence content",
    locationNote: "United States and Vercel edge regions",
    required: false,
    privacyUrl: "https://vercel.com/legal/privacy-policy",
  },
  {
    name: "DataFast",
    purpose:
      "Privacy-conscious product analytics, conversion goals, funnels, and Stripe revenue attribution",
    dataCategories:
      "Page views, referrers, device signals, custom conversion goals, and payment attribution metadata without prompt, note, or evidence content",
    locationNote: "United States and provider regions",
    required: false,
    privacyUrl: "https://datafa.st/privacy-policy",
  },
];

export function getLegalContactEmail(
  kind: "support" | "security" | "privacy" | "billing" = "support",
): string {
  const support =
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || ORGANIZATION.email;
  if (kind === "security") {
    return process.env.SECURITY_CONTACT_EMAIL?.trim() || support;
  }
  if (kind === "privacy") {
    return process.env.PRIVACY_CONTACT_EMAIL?.trim() || support;
  }
  if (kind === "billing") {
    return process.env.BILLING_CONTACT_EMAIL?.trim() || support;
  }
  return support;
}

export const TERMS_OF_SERVICE: LegalPageContent = {
  slug: "terms",
  title: "Terms of Service",
  description:
    "Terms governing access to and use of Cited, the AI citation monitoring product.",
  eyebrow: "Legal",
  intro:
    "These Terms of Service (“Terms”) form a binding agreement between you and Cited (“Cited,” “we,” “us,” or “our”) governing access to and use of the Cited software, websites, and related services available at cited.cc and any successor domains (collectively, the “Service”). By creating an account, completing checkout, clicking to accept, or otherwise accessing or using the Service, you agree to these Terms. If you do not agree, do not use the Service.",
  sections: [
    {
      id: "definitions",
      number: "1",
      title: "Definitions",
      paragraphs: [
        "“Customer Content” means prompts, domains, brand aliases, competitor lists, notebook entries, annotations, notification destinations, configuration settings, and other materials you or your Authorized Users submit to or configure in the Service.",
        "“Evidence” means monitored response snapshots, citation records, source identifiers, classification labels, occurrence history, and related monitoring outputs generated or stored by the Service from configured monitoring runs.",
        "“Authorized User” means an individual you invite or authorize to access a workspace under your account.",
        "“Order” means the plan selection, checkout, or billing portal configuration that sets your subscription tier, limits, and fees.",
        "Capitalized terms used but not defined in a section have the meanings given in these Terms or in the referenced policies.",
      ],
    },
    {
      id: "agreement-eligibility",
      number: "2",
      title: "Agreement and eligibility",
      paragraphs: [
        "You must be at least 18 years of age (or the age of majority in your jurisdiction, if higher) and able to form a binding contract under applicable law.",
        "If you use the Service on behalf of an organization, you represent and warrant that you have authority to bind that organization, and “you” refers to that organization.",
        "You may use the Service only in compliance with these Terms, the Acceptable Use Policy, the Privacy Policy, and all applicable laws and regulations.",
      ],
    },
    {
      id: "service-description",
      number: "3",
      title: "Service description and scope",
      paragraphs: [
        "Cited is software for monitoring selected prompts across supported AI surfaces (currently ChatGPT, Gemini, Perplexity, Claude, Google AI Overviews, and Google AI Mode, subject to plan entitlements and provider availability) and preserving Evidence when configured domains, brands, or competitors appear in monitored results.",
        "Cited monitors selected configured prompts only. Results may vary. Cited does not control AI-provider outputs, does not provide SEO guarantees, does not monitor every AI conversation, and relies on third-party providers for some monitoring data.",
        "The Service is a monitoring and evidence tool. It is not a substitute for legal, financial, investment, marketing, SEO, or other professional advice, and it does not create any fiduciary duty.",
      ],
    },
    {
      id: "accounts-workspaces",
      number: "4",
      title: "Accounts and workspaces",
      paragraphs: [
        "You must provide accurate, current account information and keep credentials and authentication methods secure.",
        "Workspace owners and admins manage members, domains, monitors, notifications, and billing settings within the product’s role model.",
        "You are responsible for all activity under your account and workspace, including actions by Authorized Users you invite or authorize, whether or not you authorized a particular action.",
        "You will promptly notify Cited of any unauthorized access or suspected compromise of your account.",
        "You may not share unauthorized access credentials or attempt to access another customer’s workspace or data.",
      ],
    },
    {
      id: "license",
      number: "5",
      title: "License to use the Service",
      paragraphs: [
        "Subject to these Terms and timely payment of applicable fees, Cited grants you a limited, non-exclusive, non-transferable, non-sublicensable, revocable license to access and use the Service solely for your internal business purposes during your subscription term.",
        "Except for the limited license above, Cited and its licensors retain all right, title, and interest in and to the Service, including software, interfaces, documentation, branding, and underlying technology.",
        "You may not copy, modify, distribute, sell, lease, reverse engineer, decompile, or create derivative works of the Service, except to the limited extent such restriction is prohibited by applicable law.",
      ],
    },
    {
      id: "subscription-billing",
      number: "6",
      title: "Subscription plans and billing",
      paragraphs: [
        "Paid plans are billed monthly through Stripe. Plans renew automatically until canceled in accordance with these Terms.",
        "Stripe processes payments. Cited does not store payment card numbers.",
        "Fees are stated at checkout or in the billing portal and are exclusive of applicable taxes unless expressly stated otherwise. You are responsible for taxes associated with your purchase, other than taxes based on Cited’s net income.",
        "Cancellations generally take effect at the end of the current billing period unless Stripe or product configuration indicates otherwise.",
        "Cited does not automatically delete evidence after cancellation. Monitoring stops or becomes restricted after the paid period ends, subject to plan access rules and any applicable grace period.",
        "Failed payments may result in suspension or restriction of access and monitoring until payment is successfully processed.",
        "Current plans do not include automatic overage billing. Plan limits can block additional prompts, monitors, surfaces, members, or related capacity.",
        "Plan changes and any proration are handled through Stripe according to the configured billing portal and checkout flows.",
        "Except as required by law or expressly stated in the Refund Policy, fees are non-refundable and Cited has no obligation to provide credits for unused time, features, or capacity.",
      ],
    },
    {
      id: "founder-plan",
      number: "7",
      title: "Founder plan",
      paragraphs: [
        "The Founder plan is a standard public subscription tier. Cited may modify pricing, features, or availability with notice as described in these Terms.",
        "Founder plan purchases remain subject to these Terms and the Refund Policy. A purchase does not create any right to future pricing or features beyond the current Order.",
      ],
    },
    {
      id: "limits-entitlements",
      number: "8",
      title: "Monitoring limits and entitlements",
      paragraphs: [
        "Each plan includes specific limits for domains, prompts, surfaces, members, history windows, and related features, as described in the product and pricing materials at the time of Order.",
        "Cited may enforce those limits to protect service quality, security, and plan predictability.",
        "Monitoring availability can vary by AI surface, provider support, location, schedule, and third-party capacity. Current surfaces include ChatGPT, Gemini, Perplexity, Claude, Google AI Overviews, and Google AI Mode, subject to plan entitlements. Cited may add, remove, or change supported surfaces with or without prior notice.",
      ],
    },
    {
      id: "customer-responsibilities",
      number: "9",
      title: "Customer responsibilities",
      paragraphs: [
        "You are solely responsible for Customer Content and for the prompts, domains, brands, competitors, notification destinations, and configurations you set.",
        "You represent and warrant that you have all rights, licenses, and authority necessary to submit Customer Content and to monitor the domains and brands you configure.",
        "You must use the Service lawfully and only for domains and brands you are authorized to monitor.",
        "You are responsible for independently reviewing Evidence before relying on it for any business, legal, or operational decision. Cited does not warrant that Evidence is complete, current, or suitable for any particular purpose.",
      ],
    },
    {
      id: "domain-verification",
      number: "10",
      title: "Domain verification and authorized use",
      paragraphs: [
        "Customers may only monitor domains they own, control, represent, or are otherwise authorized to monitor.",
        "Cited uses DNS TXT verification to help confirm domain control. Verification tokens are confidential to your workspace and must not be misused, published, or shared with unauthorized parties.",
        "Cited may reject, pause, suspend, or terminate domain monitoring that appears unauthorized, abusive, fraudulent, or otherwise non-compliant.",
        "You must not monitor domains for harassment, phishing, impersonation, competitive sabotage, or other abuse.",
      ],
    },
    {
      id: "prompt-variability",
      number: "11",
      title: "Prompt monitoring and AI-provider variability",
      paragraphs: [
        "AI responses can vary by provider, model, location, timing, prompt wording, account configuration, personalization, and availability. Cited stores Evidence from monitored results but does not guarantee that a result will be reproducible later.",
        "Cited does not control AI providers and does not guarantee that a domain will be cited, mentioned, recommended, ranked, or otherwise appear in any AI answer.",
        "Third-party AI providers may change outputs, APIs, terms, rate limits, or availability without notice to Cited. Such changes may affect monitoring quality or coverage.",
      ],
    },
    {
      id: "citation-evidence",
      number: "12",
      title: "Citation evidence and historical snapshots",
      paragraphs: [
        "A citation note is a durable record of what Cited observed in a configured monitoring run.",
        "Cited stores monitored response snapshots and Evidence so customers can review historical citation records, subject to plan history windows, retention practices, and access state.",
        "Evidence reflects monitored results only. It does not represent every AI conversation, every brand mention online, or a complete market survey.",
        "Cited may process, transform, classify, and store Evidence as reasonably necessary to operate, secure, and improve the Service.",
      ],
    },
    {
      id: "alerts-delivery",
      number: "13",
      title: "Alerts, digests, Slack, and delivery limitations",
      paragraphs: [
        "Email and Slack alerts depend on third-party delivery systems and on accurate customer configuration.",
        "Cited does not guarantee that every alert or digest will be delivered, opened, timely, or free from delay, filtering, or third-party failure.",
        "Customers control notification preferences and may unsubscribe from applicable email alerts. You remain responsible for destinations you configure, including Slack webhooks.",
      ],
    },
    {
      id: "customer-content-license",
      number: "14",
      title: "Customer Content and license to Cited",
      paragraphs: [
        "As between you and Cited, you retain ownership of Customer Content.",
        "You grant Cited a worldwide, non-exclusive, royalty-free license to host, store, process, transmit, display, and otherwise use Customer Content solely as necessary to provide, maintain, secure, and support the Service, to enforce these Terms, and to comply with law.",
        "Notebook entries, annotations, and similar Customer Content remain your responsibility. Do not store unlawful, infringing, defamatory, or abusive content in the Service.",
        "Private notes and annotations are intended for Authorized Users according to product visibility rules. Cited is not responsible for disclosures caused by your member invitations, role assignments, or export actions.",
      ],
    },
    {
      id: "exports",
      number: "15",
      title: "Exports",
      paragraphs: [
        "Exports are available to authorized workspace roles subject to plan history windows, rate limits, and size bounds.",
        "Exports must not be used to spam, harass, or exfiltrate another customer’s data.",
        "Exported files may omit private notes, raw provider payloads, secrets, and other sensitive fields by design. You are responsible for safeguarding exported files once downloaded.",
      ],
    },
    {
      id: "acceptable-use",
      number: "16",
      title: "Acceptable use",
      paragraphs: [
        "You must comply with the Acceptable Use Policy at /acceptable-use, which is incorporated into these Terms by reference.",
        "Cited may warn, throttle, suspend, or terminate accounts that violate these Terms or the Acceptable Use Policy, with or without prior notice when reasonably necessary to protect the Service, customers, or Cited.",
      ],
    },
    {
      id: "third-party-services",
      number: "17",
      title: "Third-party services and providers",
      paragraphs: [
        "Cited relies on third-party services for authentication, hosting, database storage, billing, email, monitoring data, analytics, and optional Slack delivery.",
        "Those providers have their own terms, privacy practices, and availability characteristics. Cited is not responsible for outages, acts, omissions, or changes outside its reasonable control, including failures of AI providers or delivery networks.",
        "Current subprocessors are listed at /subprocessors. Cited may update that list as providers change.",
        "Optional integrations you enable (including Slack webhooks) are under your control. Cited is not responsible for data once delivered to a destination you configure.",
      ],
    },
    {
      id: "data-privacy",
      number: "18",
      title: "Data and privacy",
      paragraphs: [
        "How Cited handles personal and workspace information is described in the Privacy Policy at /privacy, which is incorporated by reference.",
        "Eligible customers may request a Data Processing Addendum through /dpa. A DPA, if executed, supplements these Terms for the processing it covers.",
      ],
    },
    {
      id: "intellectual-property",
      number: "19",
      title: "Intellectual property",
      paragraphs: [
        "Cited and its software, branding, documentation, interfaces, designs, and related intellectual property remain the exclusive property of Cited and its licensors.",
        "No rights are granted by implication or estoppel except the limited license expressly stated in these Terms.",
        "You may not remove, obscure, or alter proprietary notices in the Service.",
      ],
    },
    {
      id: "feedback",
      number: "20",
      title: "Feedback",
      paragraphs: [
        "If you provide feedback, ideas, or suggestions regarding the Service, you grant Cited a perpetual, irrevocable, worldwide, royalty-free license to use, modify, and commercialize that feedback without restriction or obligation to you, including attribution.",
      ],
    },
    {
      id: "beta-features",
      number: "21",
      title: "Beta or pre-release features",
      paragraphs: [
        "Cited may offer beta, experimental, preview, or pre-release features. Those features may change, break, degrade, or be withdrawn at any time without notice and without liability.",
        "Beta features are provided “AS IS,” may have reduced support, durability, security hardening, or availability, and may be subject to additional terms presented in the product.",
      ],
    },
    {
      id: "availability-changes",
      number: "22",
      title: "Service availability and changes",
      paragraphs: [
        "Cited does not guarantee uninterrupted, timely, secure, or error-free operation of the Service.",
        "Cited may modify, suspend, or discontinue features, limits, supported surfaces, schedules, APIs, or documentation as the product evolves.",
        "Material changes to these Terms are handled under the Changes to terms section. Continued use after a material change may constitute acceptance where permitted by law.",
      ],
    },
    {
      id: "confidentiality",
      number: "23",
      title: "Confidentiality",
      paragraphs: [
        "Each party may receive non-public information from the other that is marked confidential or that a reasonable person would understand to be confidential (“Confidential Information”).",
        "The receiving party will use Confidential Information only to perform under these Terms and will protect it with at least reasonable care.",
        "Confidential Information does not include information that is or becomes public through no fault of the receiving party, was rightfully known without restriction, is independently developed, or is rightfully received from a third party without duty of confidentiality.",
        "Disclosure required by law is permitted if the receiving party gives reasonable prior notice (where legally permitted) and reasonable cooperation to seek protective treatment.",
      ],
    },
    {
      id: "disclaimers",
      number: "24",
      title: "Disclaimers",
      paragraphs: [
        "THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE.” TO THE MAXIMUM EXTENT PERMITTED BY LAW, CITED AND ITS SUPPLIERS DISCLAIM ALL WARRANTIES, WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, QUIET ENJOYMENT, ACCURACY, AND NON-INFRINGEMENT.",
        "WITHOUT LIMITING THE FOREGOING, CITED DOES NOT WARRANT THAT THE SERVICE WILL MEET YOUR REQUIREMENTS, THAT MONITORING RESULTS OR EVIDENCE WILL BE COMPLETE OR ERROR-FREE, THAT ALERTS WILL BE DELIVERED, THAT THIRD-PARTY PROVIDERS WILL REMAIN AVAILABLE, OR THAT EVIDENCE WILL REMAIN UNCHANGED OVER TIME.",
        "Cited does not guarantee monitoring results, citation outcomes, ranking improvements, alert delivery, third-party provider availability, or business results of any kind.",
        "Cited does not provide legal, financial, investment, SEO, or other professional advice. Any reliance on the Service or Evidence is at your sole risk.",
      ],
    },
    {
      id: "limitation-of-liability",
      number: "25",
      title: "Limitation of liability",
      paragraphs: [
        "TO THE MAXIMUM EXTENT PERMITTED BY LAW, CITED AND ITS AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, AND SUPPLIERS WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, OR FOR ANY LOSS OF PROFITS, REVENUE, GOODWILL, DATA, BUSINESS OPPORTUNITY, OR COST OF SUBSTITUTE SERVICES, WHETHER BASED IN CONTRACT, TORT (INCLUDING NEGLIGENCE), STRICT LIABILITY, OR OTHERWISE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES AND EVEN IF A REMEDY FAILS OF ITS ESSENTIAL PURPOSE.",
        "TO THE MAXIMUM EXTENT PERMITTED BY LAW, CITED’S TOTAL AGGREGATE LIABILITY ARISING OUT OF OR RELATED TO THE SERVICE OR THESE TERMS WILL NOT EXCEED THE AMOUNTS PAID BY YOU TO CITED FOR THE SERVICE DURING THE TWELVE (12) MONTHS IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO THE CLAIM.",
        "THE LIMITATIONS IN THIS SECTION APPLY TO THE FULLEST EXTENT PERMITTED BY LAW. SOME JURISDICTIONS DO NOT ALLOW CERTAIN LIMITATIONS. IN THOSE CASES, THE LIMITATION APPLIES TO THE MAXIMUM EXTENT PERMITTED.",
        "Nothing in these Terms excludes or limits liability that cannot be excluded or limited under applicable law, including liability for fraud or fraudulent misrepresentation where such exclusion is prohibited.",
      ],
    },
    {
      id: "indemnification",
      number: "26",
      title: "Indemnification",
      paragraphs: [
        "You will defend, indemnify, and hold harmless Cited and its affiliates, officers, directors, employees, and agents from and against any claims, demands, losses, damages, liabilities, costs, and expenses (including reasonable attorneys’ fees) arising out of or related to: (a) your Customer Content; (b) your misuse of the Service; (c) unauthorized domain monitoring or unauthorized use of brands; (d) your violation of these Terms, the Acceptable Use Policy, or applicable law; or (e) disputes among Authorized Users or between you and any third party relating to your use of the Service.",
        "Cited may assume exclusive defense and control of any matter subject to indemnification. You will reasonably cooperate. You may not settle any claim that imposes obligation on Cited or admits fault by Cited without Cited’s prior written consent.",
      ],
    },
    {
      id: "suspension-termination",
      number: "27",
      title: "Suspension and termination",
      paragraphs: [
        "Cited may suspend or terminate access immediately for unpaid invoices, abuse, security risk, legal requirements, suspected fraud, or material breach of these Terms.",
        "You may stop using the Service at any time and cancel through the billing portal or support channels described in the product.",
        "Upon termination or expiration: (a) your license ends; (b) access may be disabled; and (c) Cited may delete or retain data as described in the Privacy Policy and applicable law.",
        "Sections that by their nature should survive (including ownership, disclaimers, limitations of liability, indemnification, confidentiality, and governing law) will survive termination.",
      ],
    },
    {
      id: "cancellation",
      number: "28",
      title: "Cancellation",
      paragraphs: [
        "You may cancel a subscription at any time. Cancellation generally takes effect at the end of the current billing period.",
        "Cancellation does not automatically delete Evidence. Deletion requests are handled separately under the Privacy Policy and support processes.",
        "Refunds, if any, are governed exclusively by the Refund Policy at /refund-policy and by mandatory consumer law where applicable.",
      ],
    },
    {
      id: "export-controls",
      number: "29",
      title: "Export controls and sanctions",
      paragraphs: [
        "You may not use, export, or re-export the Service except as authorized by United States law and the laws of the jurisdiction in which the Service is accessed.",
        "You represent that you are not located in, under the control of, or a national or resident of any country or person subject to comprehensive U.S. sanctions or on any U.S. government restricted-party list.",
      ],
    },
    {
      id: "force-majeure",
      number: "30",
      title: "Force majeure",
      paragraphs: [
        "Cited is not liable for any failure or delay caused by events beyond its reasonable control, including acts of God, natural disasters, war, terrorism, labor disputes, government actions, epidemics, power or internet failures, denial-of-service attacks, or failures of third-party providers (including AI providers, hosting, payment, or communications networks).",
      ],
    },
    {
      id: "governing-law",
      number: "31",
      title: "Governing law and disputes",
      paragraphs: [
        "These Terms are governed by the laws of the State of Delaware, United States, without regard to conflict-of-law rules, except where mandatory consumer protections apply and cannot be waived.",
        "Subject to the informal dispute resolution requirement below, the state and federal courts located in the State of Delaware will have exclusive jurisdiction over disputes arising from or relating to these Terms or the Service, except where applicable law requires otherwise. You consent to personal jurisdiction and venue in those courts.",
        "Before filing a formal claim, the complaining party will contact the other party and attempt in good faith to resolve the dispute for at least thirty (30) days. Notices to Cited for this purpose must be sent to the support contact listed in these Terms.",
        "TO THE MAXIMUM EXTENT PERMITTED BY LAW, YOU AND CITED WAIVE ANY RIGHT TO PARTICIPATE IN A CLASS ACTION, CLASS ARBITRATION, OR REPRESENTATIVE PROCEEDING AGAINST THE OTHER PARTY. CLAIMS MUST BE BROUGHT ONLY IN AN INDIVIDUAL CAPACITY.",
      ],
    },
    {
      id: "general",
      number: "32",
      title: "General provisions",
      paragraphs: [
        "These Terms, together with the Acceptable Use Policy, Privacy Policy, Cookie Policy, Refund Policy, and any executed DPA or Order, constitute the entire agreement between you and Cited regarding the Service and supersede prior or contemporaneous agreements on the subject.",
        "If any provision is held unenforceable, it will be modified to the minimum extent necessary to make it enforceable, and the remaining provisions will remain in effect.",
        "Failure to enforce a provision is not a waiver. Any waiver must be in writing to be effective.",
        "You may not assign these Terms without Cited’s prior written consent. Cited may assign these Terms in connection with a merger, acquisition, corporate reorganization, or sale of assets. These Terms bind permitted successors and assigns.",
        "There are no third-party beneficiaries to these Terms except as expressly stated for indemnified parties.",
        "The parties are independent contractors. These Terms do not create a partnership, joint venture, employment, or agency relationship.",
        "Notices to you may be provided by email to your account email, through the Service, or by posting to cited.cc. Notices to Cited must be sent to the applicable contact email listed in these Terms or at /contact.",
        "Headings are for convenience only and do not affect interpretation. The words “including” and “include” mean “including without limitation.”",
      ],
    },
    {
      id: "changes-to-terms",
      number: "33",
      title: "Changes to terms",
      paragraphs: [
        "Cited may update these Terms from time to time. The effective and last-updated dates appear on this page.",
        "For material changes, Cited will provide notice by posting the updated Terms and, where required by law or where Cited elects, by email or in-product notice.",
        "Continued use of the Service after changes become effective constitutes acceptance of the updated Terms, except where additional consent is required by law. If you do not agree, you must stop using the Service and cancel your subscription.",
      ],
    },
    {
      id: "contact",
      number: "34",
      title: "Contact",
      paragraphs: [
        `Questions about these Terms: ${getLegalContactEmail("support")}.`,
        "Additional contact paths are listed at /contact.",
      ],
    },
  ],
  relatedLinks: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/acceptable-use", label: "Acceptable Use" },
    { href: "/refund-policy", label: "Refund Policy" },
    { href: "/security", label: "Security" },
  ],
};

export const PRIVACY_POLICY: LegalPageContent = {
  slug: "privacy",
  title: "Privacy Policy",
  description:
    "How Cited collects, uses, shares, and retains information in connection with the Service.",
  eyebrow: "Legal",
  intro:
    "This Privacy Policy describes how Cited (“Cited,” “we,” “us,” or “our”) collects, uses, discloses, and retains information in connection with cited.cc and the Cited product (the “Service”). By using the Service, you acknowledge the practices described here. This Policy should be read together with our Terms of Service and Cookie Policy.",
  sections: [
    {
      id: "introduction",
      number: "1",
      title: "Introduction and scope",
      paragraphs: [
        "Cited provides AI citation monitoring software. We preserve Evidence from the AI answers you choose to monitor.",
        "This Policy covers account holders, Authorized Users, free-scan visitors, and visitors to public pages.",
        "Depending on the context, Cited may act as a controller of account and website data, and as a processor of Customer Content and Evidence processed on behalf of a customer organization. Where a Data Processing Addendum is executed, that DPA controls for the processing it covers.",
      ],
    },
    {
      id: "information-we-collect",
      number: "2",
      title: "Information we collect",
      paragraphs: [
        "We collect information customers provide, information generated by monitoring and product use, and limited automatically collected technical information needed to operate, secure, bill, and support the Service.",
        "We do not require you to provide more personal information than is reasonably needed for the purposes described in this Policy.",
      ],
    },
    {
      id: "customer-provided",
      number: "3",
      title: "Information customers provide",
      paragraphs: [
        "Account data may include name, email, and authentication identifiers from Clerk where available.",
        "Workspace data may include workspace name, members, roles, settings, plan, and billing state.",
        "Domain data may include verified domains, DNS verification status, and brand aliases.",
        "Notification preferences, Slack connection status, Notebook notes, annotations, and support requests are also customer-provided or customer-configured.",
      ],
    },
    {
      id: "workspace-monitoring",
      number: "4",
      title: "Workspace and monitoring data",
      paragraphs: [
        "Monitoring data may include prompts, AI surfaces, locations, schedules, scan runs, citation sources, Evidence, and occurrences.",
        "Cited monitors only the prompts, surfaces, schedules, locations, and verified domains you configure.",
      ],
    },
    {
      id: "ai-response-evidence",
      number: "5",
      title: "AI response and citation evidence data",
      paragraphs: [
        "Cited stores monitored response snapshots and Evidence so customers can review historical citation records.",
        "Evidence may include prompt text, response excerpts or snapshots, source URLs, classification labels, and first-seen history from configured monitoring runs.",
        "Evidence is customer workspace data. It is not used to train public foundation models operated by Cited, because Cited does not operate such models.",
      ],
    },
    {
      id: "notebook-annotation",
      number: "6",
      title: "Notebook and annotation data",
      paragraphs: [
        "Notebook entries, revisions, visibility settings, and annotations are stored so teams can keep working context alongside citation Evidence.",
        "You control who you invite into a workspace. Cited is not responsible for member access you grant.",
      ],
    },
    {
      id: "billing-data",
      number: "7",
      title: "Billing data",
      paragraphs: [
        "Billing data includes Stripe customer and subscription references, plan, billing status, and invoice or payment records handled by Stripe.",
        "Cited does not store payment card numbers. Stripe processes card and payment-method data under Stripe’s terms and privacy policy.",
      ],
    },
    {
      id: "authentication-data",
      number: "8",
      title: "Authentication data",
      paragraphs: [
        "Clerk manages authentication sessions and related account identifiers. Cited stores the workspace membership and role mappings needed to authorize access.",
      ],
    },
    {
      id: "free-scan-data",
      number: "9",
      title: "Free scan data",
      paragraphs: [
        "Free scan requests may include domain, brand context, prompts, submitted email, terms or consent status, and a tokenized result link.",
        "Free scan submissions are rate-limited and stored as needed to deliver results, prevent abuse, communicate about the request, and improve Service reliability.",
      ],
    },
    {
      id: "automatic-collection",
      number: "10",
      title: "Automatically collected information",
      paragraphs: [
        "We may collect feature usage signals, system events, error logs, security logs, device or browser metadata, IP address, and redacted diagnostics.",
        "Logs are designed to avoid storing secrets, full prompt or response bodies, note bodies, annotation bodies, or raw provider payloads in normal operation.",
      ],
    },
    {
      id: "cookies",
      number: "11",
      title: "Cookies and similar technologies",
      paragraphs: [
        "Cited and its providers use cookies and similar technologies for authentication, security, billing sessions, and limited analytics. Details are in the Cookie Policy at /cookies.",
      ],
    },
    {
      id: "how-we-use",
      number: "12",
      title: "How we use information",
      paragraphs: [
        "We use information to:",
      ],
      bullets: [
        "Provide, operate, maintain, and secure the Service",
        "Run configured monitoring and store Evidence",
        "Deliver alerts, digests, and support communications",
        "Process billing, prevent fraud, and enforce plan limits",
        "Investigate abuse, security incidents, and Terms violations",
        "Improve reliability, performance, and product quality",
        "Comply with law and respond to lawful requests",
      ],
    },
    {
      id: "legal-bases",
      number: "13",
      title: "Legal bases (where required)",
      paragraphs: [
        "Where data-protection law requires a legal basis, we rely on one or more of the following, as applicable: performance of a contract with you; legitimate interests in operating, securing, and improving the Service (balanced against your rights); compliance with legal obligations; and consent where we request it (including certain marketing or optional cookies, if applicable).",
      ],
    },
    {
      id: "how-we-share",
      number: "14",
      title: "How we share information",
      paragraphs: [
        "We share information only as described in this Policy:",
      ],
      bullets: [
        "With service providers (subprocessors) that help us operate Cited under contractual confidentiality and security obligations",
        "With your direction, including Slack webhooks or destinations you configure",
        "With professional advisors under confidentiality obligations",
        "In connection with a merger, acquisition, financing, or sale of assets, subject to appropriate confidentiality",
        "When required by law, legal process, or governmental request",
        "To protect the rights, safety, and security of Cited, our users, or the public",
      ],
    },
    {
      id: "no-sale",
      number: "15",
      title: "No sale of personal information",
      paragraphs: [
        "We do not sell personal information. We do not sell personal contact information.",
        "We do not knowingly “share” personal information for cross-context behavioral advertising as those terms are defined under the California Consumer Privacy Act, as amended by the CPRA, in the ordinary operation of the Service.",
        "If our practices change in a way that requires additional notices or opt-outs, we will update this Policy and provide required mechanisms.",
      ],
    },
    {
      id: "third-party-providers",
      number: "16",
      title: "Third-party service providers",
      paragraphs: [
        "Current subprocessors and categories are listed at /subprocessors and may include Clerk, Supabase, Stripe, Resend, DataForSEO, Vercel, DataFast, optional Slack destinations, and analytics or observability providers when configured.",
        "Those providers process information only as needed to provide their services to Cited, subject to their own terms and our agreements with them.",
      ],
    },
    {
      id: "retention",
      number: "17",
      title: "Data retention",
      paragraphs: [
        "We retain data for as long as reasonably necessary to provide the Service, comply with legal obligations, resolve disputes, enforce agreements, and maintain security. Specific retention periods may vary by data type.",
        "Account and workspace data are generally retained while the account is active. Evidence is retained while the subscription or workspace exists, subject to plan access and history windows.",
        "Billing records may be retained as needed for legal and accounting purposes. Logs are retained for a limited operational and security period. Unsubscribe records are retained to honor opt-out requests.",
        "Deleted or canceled accounts may be retained in backups or for legal, security, and business purposes for a reasonable period, after which data is deleted or anonymized in the ordinary course of operations.",
      ],
    },
    {
      id: "export-deletion",
      number: "18",
      title: "Data export and deletion requests",
      paragraphs: [
        "Authorized users can export certain Evidence from the product subject to role and plan limits.",
        "You may request access, correction, export, or deletion by contacting privacy or support channels listed at /contact.",
        "Deletion requests are handled after identity and workspace verification. Some billing, security, and legal records may be retained where required. Cited does not currently offer one-click irreversible workspace destruction from the public product UI.",
        "If you are an Authorized User of a customer organization, we may redirect your request to the workspace owner or admin, who controls Customer Content for that workspace.",
      ],
    },
    {
      id: "us-state-rights",
      number: "19",
      title: "U.S. state privacy rights",
      paragraphs: [
        "Residents of certain U.S. states (including California, Virginia, Colorado, Connecticut, and others with similar laws) may have rights to request access, correction, deletion, portability, and information about our processing practices, subject to verification and legal exceptions.",
        "California residents may also have the right to know categories of personal information collected, sources, purposes, and disclosures, and to not be discriminated against for exercising privacy rights.",
        "To exercise applicable rights, contact the privacy email listed in this Policy. We will verify your request using information associated with your account or submission and respond within the time required by law.",
        "Authorized agents may submit requests where permitted by law, subject to verification of authority.",
      ],
    },
    {
      id: "international-transfers",
      number: "20",
      title: "International data transfers",
      paragraphs: [
        "Cited and its providers may process information in the United States and other countries where they operate.",
        "If you access the Service from another country, your information may be transferred to and processed in those locations, which may have different data-protection laws than your jurisdiction.",
        "Where required, we use appropriate transfer mechanisms available under applicable law (such as contractual safeguards with providers).",
      ],
    },
    {
      id: "security",
      number: "21",
      title: "Security",
      paragraphs: [
        "Cited uses workspace-scoped authorization, server-side secret handling, signed webhook verification, encrypted Slack webhook storage, hashed unsubscribe tokens, and related controls described at /security.",
        "No method of transmission or storage is perfectly secure. You are responsible for using strong account protections and for promptly reporting suspected issues.",
        "This Policy does not create a warranty of absolute security beyond the commitments in our Terms.",
      ],
    },
    {
      id: "your-choices",
      number: "22",
      title: "Your choices",
      paragraphs: [
        "You can update notification preferences, disconnect Slack, unsubscribe from applicable emails, export Evidence where permitted, and contact support for privacy requests.",
        "Cookie and analytics behavior is described in the Cookie Policy.",
        "You may close your account by canceling through the billing portal and requesting deletion under this Policy.",
      ],
    },
    {
      id: "children",
      number: "23",
      title: "Children’s privacy",
      paragraphs: [
        "Cited is not directed to children under 16, and we do not knowingly collect personal information from children under 16.",
        "If we learn that we have collected personal information from a child under 16, we will delete it promptly. Contact the privacy email below if you believe a child has provided information.",
      ],
    },
    {
      id: "do-not-track",
      number: "24",
      title: "Do Not Track",
      paragraphs: [
        "Some browsers offer a “Do Not Track” signal. The Service does not currently respond to Do Not Track signals in a differentiated way because there is no consistent industry standard. See the Cookie Policy for analytics practices.",
      ],
    },
    {
      id: "changes",
      number: "25",
      title: "Changes to this policy",
      paragraphs: [
        "We may update this Privacy Policy as the product or legal requirements change. The effective and last-updated dates appear on this page.",
        "Material changes will be posted on this page and, where required by law, communicated by additional notice. Continued use after the effective date constitutes acknowledgment of the updated Policy where permitted by law.",
      ],
    },
    {
      id: "contact",
      number: "26",
      title: "Contact",
      paragraphs: [
        `Privacy requests: ${getLegalContactEmail("privacy")}.`,
        `General support: ${getLegalContactEmail("support")}.`,
        "See /contact for additional channels.",
      ],
    },
  ],
  relatedLinks: [
    { href: "/cookies", label: "Cookie Policy" },
    { href: "/subprocessors", label: "Subprocessors" },
    { href: "/dpa", label: "DPA request" },
    { href: "/security", label: "Security" },
  ],
};

export const COOKIE_POLICY: LegalPageContent = {
  slug: "cookies",
  title: "Cookie Policy",
  description:
    "How Cited and its providers use cookies and similar technologies.",
  eyebrow: "Legal",
  intro:
    "This Cookie Policy explains how Cited (“Cited,” “we,” “us,” or “our”) and its service providers use cookies and similar technologies on cited.cc and in the Service. It reflects current product behavior and should be read with the Privacy Policy. By using the Service, you acknowledge this Cookie Policy.",
  sections: [
    {
      id: "what-cookies-are",
      number: "1",
      title: "What cookies are",
      paragraphs: [
        "Cookies are small text files stored on your device. Similar technologies include local storage, session storage, pixels, and other identifiers used by browsers and authentication or analytics providers.",
        "Cookies may be “session” (deleted when you close your browser) or “persistent” (retained until they expire or you delete them).",
      ],
    },
    {
      id: "essential",
      number: "2",
      title: "Essential cookies",
      paragraphs: [
        "Essential cookies and storage are required for security, authentication, CSRF protection where applicable, load balancing, fraud prevention, and core product functionality.",
        "These are necessary to operate Cited and cannot be disabled through a product preference without breaking sign-in, checkout, or workspace access.",
      ],
    },
    {
      id: "authentication",
      number: "3",
      title: "Authentication cookies",
      paragraphs: [
        "Clerk sets authentication and session cookies to keep you signed in and protect account access. Disabling these cookies will prevent authenticated use of the Service.",
      ],
    },
    {
      id: "billing-session",
      number: "4",
      title: "Billing and session cookies",
      paragraphs: [
        "Stripe may set cookies or similar technologies during checkout and customer portal sessions to process payments securely and prevent fraud.",
      ],
    },
    {
      id: "analytics",
      number: "5",
      title: "Analytics cookies",
      paragraphs: [
        "Cited uses Vercel Analytics and DataFast for privacy-conscious page-view, conversion, and performance signals.",
        "DataFast may set first-party visitor and session cookies (proxied through cited.cc) for attribution, Journeys, and conversion goals.",
        "Marketing and product analytics helpers are designed not to send emails, domains, prompts, note bodies, or Evidence content.",
        "Cited does not currently ship a separate advertising cookie stack or third-party ad network.",
      ],
    },
    {
      id: "preferences",
      number: "6",
      title: "Preference and local-storage behavior",
      paragraphs: [
        "The product may store UI preferences locally, such as help or layout preferences, to improve the authenticated experience. These preferences are not used for advertising.",
      ],
    },
    {
      id: "third-party",
      number: "7",
      title: "Third-party cookies",
      paragraphs: [
        "Third-party providers used for authentication, billing, hosting, and analytics may set their own cookies subject to their policies.",
        "Cited does not control every cookie set by those providers. Review their privacy and cookie notices for additional detail.",
      ],
    },
    {
      id: "manage",
      number: "8",
      title: "How to manage cookies",
      paragraphs: [
        "You can control cookies through your browser settings. Blocking essential cookies may prevent sign-in, checkout, or workspace use.",
        "Cited does not currently show a non-essential cookie consent banner because analytics are limited and privacy-conscious. If that changes, this page will be updated and any required consent mechanism will be implemented.",
        "Where local law requires consent for non-essential cookies, we will obtain consent before setting those cookies.",
      ],
    },
    {
      id: "changes",
      number: "9",
      title: "Changes",
      paragraphs: [
        "We may update this Cookie Policy as our practices or providers change. The effective and last-updated dates appear on this page.",
      ],
    },
    {
      id: "contact",
      number: "10",
      title: "Contact",
      paragraphs: [
        `Questions about cookies: ${getLegalContactEmail("privacy")}.`,
      ],
    },
  ],
  relatedLinks: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/security", label: "Security" },
  ],
};

export const ACCEPTABLE_USE: LegalPageContent = {
  slug: "acceptable-use",
  title: "Acceptable Use Policy",
  description:
    "Prohibited uses of Cited and enforcement options for abuse or misuse.",
  eyebrow: "Legal",
  intro:
    "This Acceptable Use Policy (“AUP”) describes prohibited uses of Cited. It is incorporated into the Terms of Service and applies to all customers, Authorized Users, and visitors who access or use the Service. Capitalized terms have the meanings in the Terms unless otherwise stated.",
  sections: [
    {
      id: "prohibited",
      number: "1",
      title: "Prohibited uses",
      paragraphs: [
        "You may not, and may not permit any third party to, use Cited to:",
      ],
      bullets: [
        "Monitor domains you are not authorized to monitor",
        "Conduct phishing, impersonation, fraud, scams, or social engineering",
        "Harass, stalk, dox, threaten, or intimidate any person or organization",
        "Bypass rate limits, billing limits, authentication, or access controls",
        "Probe, scan, penetrate, or attack Cited infrastructure or other customers",
        "Upload or enter illegal, infringing, harmful, defamatory, or abusive content",
        "Attempt to extract, scrape, or expose other customers’ data or Evidence",
        "Use exports, alerts, or digests for spam or unsolicited bulk communications",
        "Abuse free scan, sign-up, trial, or referral flows",
        "Present Cited as regulated professional advice or as a guarantee of outcomes",
        "Reverse engineer the Service beyond what applicable law expressly allows",
        "Misuse Slack, webhook, email, export, unsubscribe, or verification features",
        "Interfere with or disrupt the integrity, performance, or availability of the Service",
        "Use the Service in violation of export controls, sanctions, or other applicable law",
        "Resell, sublicense, or provide the Service to third parties as a managed service without Cited’s prior written consent",
      ],
    },
    {
      id: "monitoring-rules",
      number: "2",
      title: "Monitoring and configuration rules",
      paragraphs: [
        "You must configure only domains, brands, and competitors you are authorized to monitor.",
        "You must not use verification tokens, webhook URLs, or export files to compromise security or privacy.",
        "You are responsible for the lawfulness of prompts and destinations you configure.",
      ],
    },
    {
      id: "enforcement",
      number: "3",
      title: "Enforcement",
      paragraphs: [
        "Cited may respond to violations with warnings, throttling, suspension, termination, preservation of records for security investigation, and reporting to authorities where required or appropriate.",
        "Enforcement decisions are made to protect customers, the Service, and Cited. Cited may act without prior notice when reasonably needed for security, fraud prevention, or legal reasons.",
        "Cited’s failure to enforce this AUP in a particular instance is not a waiver of any rights.",
      ],
    },
    {
      id: "reporting",
      number: "4",
      title: "Reporting abuse",
      paragraphs: [
        `Report abuse or security concerns to ${getLegalContactEmail("security")}.`,
        "Include enough detail to investigate. Do not include secrets, webhook URLs, verification tokens, or unrelated customer data in reports.",
      ],
    },
    {
      id: "updates",
      number: "5",
      title: "Updates",
      paragraphs: [
        "Cited may update this AUP from time to time. Continued use of the Service after an update constitutes acceptance of the revised AUP where permitted by law.",
      ],
    },
  ],
  relatedLinks: [
    { href: "/terms", label: "Terms of Service" },
    { href: "/security", label: "Security" },
    { href: "/contact", label: "Contact" },
  ],
};

export const REFUND_POLICY: LegalPageContent = {
  slug: "refund-policy",
  title: "Refund Policy",
  description:
    "How Cited handles subscription billing, cancellation, and refund requests.",
  eyebrow: "Legal",
  intro:
    "This Refund Policy explains how monthly subscriptions, cancellations, and refund requests work for Cited. It forms part of your agreement with Cited together with the Terms of Service. Except where mandatory law requires otherwise, all fees are non-refundable.",
  sections: [
    {
      id: "billing",
      number: "1",
      title: "Monthly billing",
      paragraphs: [
        "Cited subscriptions are billed monthly through Stripe. Customers can cancel anytime, and cancellation generally takes effect at the end of the current billing period.",
        "Payments already made are non-refundable except where required by law or where Cited, in its sole discretion, determines a refund or credit is appropriate.",
        "Cited has no obligation to refund unused time, unused capacity, or unused features within a billing period.",
      ],
    },
    {
      id: "no-automatic-refunds",
      number: "2",
      title: "No automatic refunds for unused time",
      paragraphs: [
        "Cited does not automatically refund unused time in a billing period unless required by law or granted by support in writing.",
        "Current plans do not charge automatic overage fees. Plan limits may block additional usage instead of generating overage charges.",
      ],
    },
    {
      id: "discretionary-exceptions",
      number: "3",
      title: "Discretionary exceptions",
      paragraphs: [
        "Cited may, in its sole discretion, issue a refund or credit for duplicate charges, clear billing errors attributable to Cited, or other exceptional circumstances.",
        "Any discretionary refund does not create a precedent or obligation to issue future refunds.",
      ],
    },
    {
      id: "duplicate-billing",
      number: "4",
      title: "Duplicate billing and support requests",
      paragraphs: [
        `If you believe you were billed in error, contact ${getLegalContactEmail("billing")} within thirty (30) days of the charge with your workspace name, billing email, approximate charge date, and Stripe receipt or invoice identifier if available.`,
        "Cited will review Stripe records and respond through support channels. Failure to provide sufficient information may delay or prevent resolution.",
      ],
    },
    {
      id: "failed-payments",
      number: "5",
      title: "Failed payments",
      paragraphs: [
        "Failed payments are handled through Stripe. Access and monitoring may be restricted while payment issues remain unresolved.",
        "You remain responsible for amounts due for the period before cancellation takes effect.",
      ],
    },
    {
      id: "plan-changes",
      number: "6",
      title: "Plan changes and proration",
      paragraphs: [
        "Plan changes and any proration are handled by Stripe according to the configured customer portal and checkout flows.",
        "Unless Stripe configuration or mandatory law provides otherwise, downgrades take effect at the next renewal and do not generate mid-cycle cash refunds.",
      ],
    },
    {
      id: "founder",
      number: "7",
      title: "Founder plan",
      paragraphs: [
        "Founder plan purchases follow this Refund Policy.",
        "Later changes to Founder plan pricing or features do not entitle purchasers to refunds beyond this Policy.",
      ],
    },
    {
      id: "chargebacks",
      number: "8",
      title: "Chargebacks",
      paragraphs: [
        "If you initiate a chargeback or payment dispute, Cited may suspend access pending resolution and may contest the dispute with supporting billing records.",
        "Please contact billing support before initiating a chargeback so we can attempt to resolve the issue directly.",
      ],
    },
    {
      id: "contact",
      number: "9",
      title: "Contact",
      paragraphs: [
        `Billing questions: ${getLegalContactEmail("billing")}.`,
        "Owners and admins can also manage billing from the app billing portal.",
      ],
    },
  ],
  relatedLinks: [
    { href: "/terms", label: "Terms of Service" },
    { href: "/docs/billing-and-limits", label: "Billing docs" },
    { href: "/contact", label: "Contact" },
  ],
};

export const SECURITY_PAGE_CONTENT: LegalPageContent = {
  slug: "security",
  title: "Security",
  description:
    "How Cited protects workspace data, authentication, billing, exports, and monitoring evidence.",
  eyebrow: "Security",
  intro:
    "Cited is built to preserve Evidence from the AI answers you choose to monitor, with workspace isolation and server-side secret handling as defaults. This page describes architectural foundations that are true for the product today. It does not claim formal compliance certifications.",
  sections: [
    {
      id: "overview",
      number: "1",
      title: "Security overview",
      paragraphs: [
        "Cited uses Clerk authentication, workspace-scoped authorization, deny-by-default database access patterns, signed webhook verification, rate limiting on sensitive actions, and redacted logging.",
        "Security controls are designed to reduce risk. They do not eliminate all risk, and this page is not a warranty, guarantee, or service-level commitment.",
      ],
    },
    {
      id: "workspace-isolation",
      number: "2",
      title: "Workspace isolation",
      paragraphs: [
        "Product data is organized by workspace. Trusted server paths check membership and role before reading or writing tenant data.",
        "Cross-workspace resource IDs return generic not-found outcomes rather than confirming existence.",
      ],
    },
    {
      id: "authentication",
      number: "3",
      title: "Authentication",
      paragraphs: [
        "Sign-in and session security are handled by Clerk. Protected app, onboarding, checkout, billing, export, and integration routes require authentication.",
        "You are responsible for protecting credentials and for promptly revoking access for former Authorized Users.",
      ],
    },
    {
      id: "billing-security",
      number: "4",
      title: "Billing security",
      paragraphs: [
        "Stripe hosts payment processing. Cited does not store card numbers.",
        "Stripe webhooks verify signatures before processing. Client-supplied price IDs are not trusted for granting access.",
      ],
    },
    {
      id: "domain-verification",
      number: "5",
      title: "Domain verification",
      paragraphs: [
        "DNS TXT verification helps confirm domain control before monitoring. Verification attempts are rate-limited, and tokens are not exposed to unauthorized roles.",
      ],
    },
    {
      id: "provider-credentials",
      number: "6",
      title: "Provider credential handling",
      paragraphs: [
        "DataForSEO, Resend, Stripe, Clerk, Supabase service-role, and related credentials stay on the server. They are never shipped to the browser.",
      ],
    },
    {
      id: "slack-webhooks",
      number: "7",
      title: "Slack webhook handling",
      paragraphs: [
        "Customer Slack incoming webhook URLs are encrypted server-side and are not returned to the browser after save.",
        "You are responsible for the security of destinations you configure and for rotating webhooks if compromised.",
      ],
    },
    {
      id: "email-unsubscribe",
      number: "8",
      title: "Email and unsubscribe security",
      paragraphs: [
        "Unsubscribe tokens are hashed. Invalid or expired tokens receive generic responses. Raw tokens are not logged.",
      ],
    },
    {
      id: "export-security",
      number: "9",
      title: "Export security",
      paragraphs: [
        "Exports require authentication, workspace membership, role checks, history-window enforcement, rate limits, no-store caching headers, and CSV formula-injection protection.",
        "Exports omit secrets, Slack webhook URLs, verification tokens, unsubscribe tokens, Stripe IDs, and raw provider payloads.",
        "Once an export leaves Cited, you are responsible for safeguarding the downloaded file.",
      ],
    },
    {
      id: "storage-backups",
      number: "10",
      title: "Data storage and backups",
      paragraphs: [
        "Workspace data is stored in Supabase with deny-by-default row-level security posture and server-side service-role access after authorization checks.",
        "Backup and recovery practices follow the configured hosting and database providers. Cited does not independently guarantee recovery time objectives on this page.",
      ],
    },
    {
      id: "logging-redaction",
      number: "11",
      title: "Logging and redaction",
      paragraphs: [
        "Structured logs redact secrets, tokens, webhook values, prompt text, response text, note bodies, annotation bodies, source URLs, and raw provider payloads in normal operation.",
      ],
    },
    {
      id: "customer-responsibilities",
      number: "12",
      title: "Customer security responsibilities",
      paragraphs: [
        "Customers are responsible for: managing Authorized User access; protecting devices and credentials; configuring only authorized domains; securing Slack and email destinations; and reviewing exports before sharing them outside the workspace.",
      ],
    },
    {
      id: "security-contact",
      number: "13",
      title: "Security contact",
      paragraphs: [
        `Report security issues to ${getLegalContactEmail("security")}.`,
        "Include the affected surface and reproduction steps. Do not include verification tokens, webhook URLs, or private customer data.",
      ],
    },
    {
      id: "responsible-disclosure",
      number: "14",
      title: "Responsible disclosure",
      paragraphs: [
        "Please report suspected vulnerabilities privately and give Cited a reasonable opportunity to investigate before public disclosure.",
        "Cited does not currently operate a paid bug bounty program.",
        "Good-faith research that complies with this page and applicable law is appreciated. Do not access other customers’ data, destroy data, or degrade Service availability.",
      ],
    },
    {
      id: "limitations",
      number: "15",
      title: "Current limitations",
      paragraphs: [
        "This page does not claim SOC 2, ISO, HIPAA, or PCI certification beyond Stripe-handled payments. It also does not claim penetration testing, zero-trust architecture, end-to-end encryption, or guaranteed uptime.",
        "Security is an ongoing practice. Controls evolve with the product. Statements on this page describe current design intent and may change.",
      ],
    },
  ],
  relatedLinks: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/subprocessors", label: "Subprocessors" },
    { href: "/contact", label: "Contact" },
    { href: "/status", label: "Status" },
  ],
};

export const DPA_PAGE: LegalPageContent = {
  slug: "dpa",
  title: "Data Processing Addendum",
  description:
    "How eligible customers can request a Data Processing Addendum from Cited.",
  eyebrow: "Legal",
  intro:
    "Cited can provide a Data Processing Addendum (“DPA”) for eligible customers upon request. This page explains how to request one. It is not an automatically accepted signed DPA, not a clickwrap agreement, and does not claim formal compliance certifications.",
  sections: [
    {
      id: "request",
      number: "1",
      title: "How to request a DPA",
      paragraphs: [
        `Email ${getLegalContactEmail("privacy")} with the subject line “DPA request” and include:`,
      ],
      bullets: [
        "Workspace name",
        "Company legal name",
        "Billing email",
        "Primary contact name and title",
        "Any required vendor security questionnaire deadline",
        "Whether you require specific transfer clauses or governing-law preferences",
      ],
    },
    {
      id: "eligibility",
      number: "2",
      title: "Eligibility and process",
      paragraphs: [
        "Cited reviews DPA requests in light of plan, use case, and processing volume. Submission of a request does not create an obligation to execute a DPA on any particular form or timeline.",
        "Cited may propose its standard DPA or negotiate in good faith where commercially reasonable. Cited is not obligated to accept customer paper that conflicts with Cited’s security model or product architecture.",
      ],
    },
    {
      id: "current-practices",
      number: "3",
      title: "Current processing practices",
      paragraphs: [
        "Until a DPA is issued and executed for your account, the Privacy Policy and Subprocessors page describe current processing practices.",
        "Cited processes Customer Content to provide monitoring, Evidence storage, alerts, billing, and support as described in those pages.",
        "Subprocessors may change. Material subprocessor changes are reflected on /subprocessors.",
      ],
    },
    {
      id: "no-fake-claims",
      number: "4",
      title: "What this page is not",
      paragraphs: [
        "This page is not a signed contract, not a self-serve clickwrap DPA, and not a claim of SOC 2, ISO, HIPAA, or similar certification.",
        "Nothing on this page modifies the Terms of Service unless and until a DPA is fully executed by authorized representatives of both parties.",
      ],
    },
  ],
  relatedLinks: [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/subprocessors", label: "Subprocessors" },
    { href: "/contact", label: "Contact" },
  ],
};

export const CONTACT_PAGE: LegalPageContent = {
  slug: "contact",
  title: "Contact",
  description:
    "How to reach Cited for support, billing, security, privacy, and plan questions.",
  eyebrow: "Company",
  intro:
    "Use the channels below for support, billing, security, privacy, and plan questions. Cited does not promise a response time or guaranteed resolution. Clear, complete details help investigation move faster. Do not include secrets, webhook URLs, or verification tokens in ordinary support mail.",
  sections: [
    {
      id: "general-support",
      number: "1",
      title: "General support",
      paragraphs: [
        `Email ${getLegalContactEmail("support")} with what you were trying to do, the page or feature involved, and approximate timing.`,
      ],
    },
    {
      id: "billing-support",
      number: "2",
      title: "Billing support",
      paragraphs: [
        `For invoices, failed payments, cancellations, or plan questions, email ${getLegalContactEmail("billing")} and include your workspace name and billing email.`,
        "Owners and admins can also manage billing from the app. Refund requests are governed by the Refund Policy.",
      ],
    },
    {
      id: "security-contact",
      number: "3",
      title: "Security contact",
      paragraphs: [
        `Security reports: ${getLegalContactEmail("security")}.`,
        "Describe the issue, affected surface, and steps to reproduce. Do not include verification tokens, webhook URLs, or private customer data.",
      ],
    },
    {
      id: "privacy-requests",
      number: "4",
      title: "Privacy and data requests",
      paragraphs: [
        `Privacy, access, correction, export, or deletion requests: ${getLegalContactEmail("privacy")}.`,
        "Include your workspace name and the email on the account so we can verify the request. We may decline or limit requests as permitted by law (for example, where fulfilling the request would compromise security or another person’s rights).",
      ],
    },
    {
      id: "legal-notices",
      number: "5",
      title: "Legal notices",
      paragraphs: [
        `Formal legal notices under the Terms of Service may be sent to ${getLegalContactEmail("support")} with the subject line “Legal notice,” and will be deemed received when actually received by Cited.`,
      ],
    },
    {
      id: "sales-plans",
      number: "6",
      title: "Sales and plan questions",
      paragraphs: [
        `For plan fit questions before checkout, email ${getLegalContactEmail("support")} with your approximate monitoring needs.`,
        "Public plan details are on /pricing. Plan descriptions on marketing pages are informational and do not modify the Terms unless expressly incorporated in an Order.",
      ],
    },
    {
      id: "what-to-include",
      number: "7",
      title: "What to include",
      paragraphs: ["Helpful details usually include:"],
      bullets: [
        "What you were trying to do",
        "The page or feature involved",
        "Approximate time of the issue",
        "Whether monitoring, alerts, billing, or domain verification is affected",
        "A support summary copied from the app help menu, if available",
      ],
    },
  ],
  relatedLinks: [
    { href: "/docs/troubleshooting", label: "Troubleshooting" },
    { href: "/docs/billing-and-limits", label: "Billing and limits" },
    { href: "/security", label: "Security" },
    { href: "/status", label: "Status" },
    { href: "/dpa", label: "DPA request" },
  ],
};

export const STATUS_PAGE: LegalPageContent = {
  slug: "status",
  title: "Status",
  description:
    "Cited status guidance for availability questions. No automated uptime claims are published here.",
  eyebrow: "Status",
  intro:
    "No public incident is currently posted on this page. Cited does not publish automated uptime claims here and does not offer a public service-level agreement on this page. If you are experiencing issues, contact support and include what you were trying to do.",
  sections: [
    {
      id: "systems",
      number: "1",
      title: "Critical product systems",
      paragraphs: [
        "These systems are part of normal Cited operation. This list is informational and is not a live health feed, warranty, or uptime commitment.",
      ],
      bullets: [
        "Web app",
        "Monitoring engine",
        "Email notifications",
        "Slack notifications",
        "Billing",
      ],
    },
    {
      id: "third-parties",
      number: "2",
      title: "Third-party dependencies",
      paragraphs: [
        "Cited depends on third-party providers for hosting, authentication, billing, email, monitoring data, and optional Slack delivery. Degradation of those providers can affect the Service even when Cited’s application layer is functioning.",
      ],
    },
    {
      id: "help",
      number: "3",
      title: "If something looks wrong",
      paragraphs: [
        "Check troubleshooting docs, confirm your workspace billing and notification settings, and contact support with timing and feature details.",
        "Reported issues do not, by themselves, entitle customers to refunds, credits, or damages beyond the Terms of Service and Refund Policy.",
      ],
    },
  ],
  relatedLinks: [
    { href: "/docs/troubleshooting", label: "Troubleshooting" },
    { href: "/contact", label: "Contact" },
    { href: "/security", label: "Security" },
  ],
};

export const LEGAL_PAGES = {
  terms: TERMS_OF_SERVICE,
  privacy: PRIVACY_POLICY,
  cookies: COOKIE_POLICY,
  "acceptable-use": ACCEPTABLE_USE,
  "refund-policy": REFUND_POLICY,
  security: SECURITY_PAGE_CONTENT,
  dpa: DPA_PAGE,
  contact: CONTACT_PAGE,
  status: STATUS_PAGE,
} as const;

export type LegalPageSlug = keyof typeof LEGAL_PAGES;

export function getLegalPage(slug: LegalPageSlug): LegalPageContent {
  return LEGAL_PAGES[slug];
}

/** Forbidden public phrases for automated claim audits. */
export const FORBIDDEN_PUBLIC_CLAIM_PATTERNS = [
  /product\s*hunt/i,
  /soc\s*2\s*certified/i,
  /iso\s*27001\s*certified/i,
  /hipaa\s*compliant/i,
  /cannot be sued/i,
  /attorney[- ]reviewed/i,
  /lawyer[- ]approved/i,
  /sees every AI conversation/i,
  /monitors private AI chats/i,
  /guarantees? more AI citations/i,
  /guarantees? ranking/i,
  /all systems operational/i,
  /military[- ]grade/i,
  /zero[- ]trust architecture/i,
] as const;
