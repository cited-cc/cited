import { z } from "zod";

/**
 * Shared Zod schemas for sensitive mutations.
 * Reject unknown fields on sensitive objects. Length-limit all text.
 */

const plainText = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .refine((value) => !/<[^>]+>/.test(value), {
      message: "HTML is not allowed.",
    });

export const domainInputSchema = z
  .object({
    hostname: z
      .string()
      .trim()
      .min(3)
      .max(253)
      .regex(/^[a-z0-9.-]+$/i, "Invalid domain."),
    displayName: plainText(120).optional(),
  })
  .strict();

export const brandAliasesSchema = z
  .object({
    aliases: z.array(plainText(80)).max(25),
  })
  .strict();

export const competitorDomainsSchema = z
  .object({
    competitors: z
      .array(
        z
          .string()
          .trim()
          .min(3)
          .max(253)
          .regex(/^[a-z0-9.-]+$/i, "Invalid competitor domain."),
      )
      .max(50),
  })
  .strict();

export const promptTextSchema = z
  .object({
    promptText: plainText(500),
    priority: z.enum(["low", "normal", "high"]).optional(),
  })
  .strict();

export const monitorConfigurationSchema = z
  .object({
    monitoredPromptId: z.string().uuid(),
    aiSurface: z.enum([
      "chatgpt",
      "gemini",
      "google_ai_overviews",
      "google_ai_mode",
      "perplexity",
      "claude",
    ]),
    frequency: z.enum(["daily", "weekly", "monthly"]),
    languageCode: z.string().trim().min(2).max(8),
    countryCode: z.string().trim().min(2).max(2),
    city: plainText(100).nullable().optional(),
  })
  .strict();

export const aiSurfaceSelectionSchema = z
  .object({
    aiSurface: z.enum([
      "chatgpt",
      "gemini",
      "google_ai_overviews",
      "google_ai_mode",
      "perplexity",
      "claude",
    ]),
  })
  .strict();

export const locationLanguageSchema = z
  .object({
    languageCode: z.string().trim().min(2).max(8),
    countryCode: z.string().trim().min(2).max(2),
    city: plainText(100).nullable().optional(),
  })
  .strict();

export const notificationSettingsSchema = z
  .object({
    emailEnabled: z.boolean(),
    slackEnabled: z.boolean(),
    digestEnabled: z.boolean(),
    alertOnNewCitation: z.boolean().optional(),
    alertOnRenewedCitation: z.boolean().optional(),
    alertOnMissedOpportunity: z.boolean().optional(),
  })
  .strict();

export const slackWebhookSchema = z
  .object({
    webhookUrl: z
      .string()
      .url()
      .max(500)
      .refine(
        (url) =>
          url.startsWith("https://hooks.slack.com/") ||
          url.startsWith("https://hooks.slack-gov.com/"),
        "Slack webhook URL is invalid.",
      ),
  })
  .strict();

export const notebookEntrySchema = z
  .object({
    title: plainText(200),
    body: z.string().trim().min(1).max(20_000),
    visibility: z.enum(["private", "workspace"]),
    citationEventId: z.string().uuid().optional(),
  })
  .strict();

export const annotationSchema = z
  .object({
    body: z.string().trim().min(1).max(5_000),
    visibility: z.enum(["private", "workspace"]),
    targetKind: z.enum([
      "response",
      "source",
      "occurrence",
      "event",
    ]),
  })
  .strict();

export const exportRequestSchema = z
  .object({
    format: z.enum(["csv", "json", "markdown"]),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    eventTypes: z
      .array(
        z.enum([
          "citation",
          "mention",
          "recommendation",
          "competitor_citation",
          "missed_opportunity",
        ]),
      )
      .max(5)
      .optional(),
  })
  .strict();

export const freeScanRequestSchema = z
  .object({
    email: z.string().trim().email().max(254),
    domain: z.string().trim().min(3).max(253),
    companyName: plainText(120).optional(),
    website: z.string().url().max(500).optional(),
    honeypot: z.string().max(0).optional(),
  })
  .strict();

export const chatbotLeadSchema = z
  .object({
    email: z.string().trim().email().max(254),
    name: plainText(120).optional(),
    company: plainText(120).optional(),
    message: plainText(2_000).optional(),
  })
  .strict();

export const billingActionSchema = z
  .object({
    action: z.enum([
      "checkout",
      "portal",
      "change_plan",
      "cancel",
      "reactivate",
    ]),
    planKey: z.enum(["founder", "growth", "pro", "portfolio"]).optional(),
  })
  .strict();

export const learnDomainsHandoffSchema = z
  .object({
    domainId: z.string().uuid(),
  })
  .strict();
