import { z } from "zod";

export const CONTACT_TOPICS = [
  "general",
  "billing",
  "security",
  "privacy",
  "sales",
] as const;

export type ContactTopic = (typeof CONTACT_TOPICS)[number];

export const CONTACT_TOPIC_LABELS: Record<ContactTopic, string> = {
  general: "General support",
  billing: "Billing",
  security: "Security",
  privacy: "Privacy and data requests",
  sales: "Sales and plan questions",
};

export const contactFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter your name.")
    .max(120, "Keep your name under 120 characters."),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .max(254, "Email is too long."),
  topic: z.enum(CONTACT_TOPICS, { message: "Choose a topic." }),
  message: z
    .string()
    .trim()
    .min(10, "Add a few more details so we can help.")
    .max(4000, "Keep your message under 4000 characters."),
  /** Honeypot: bots fill this; humans leave it empty. */
  companyWebsite: z.string().max(200).optional().default(""),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;

export type NormalizedContactSubmission = ContactFormInput & {
  isHoneypot: boolean;
};

export class ContactFormValidationError extends Error {
  readonly fieldErrors: Record<string, string>;

  constructor(message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = "ContactFormValidationError";
    this.fieldErrors = fieldErrors;
  }
}

export function normalizeContactSubmission(
  input: unknown,
): NormalizedContactSubmission {
  const parsed = contactFormSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    throw new ContactFormValidationError(
      "Please check the highlighted fields.",
      fieldErrors,
    );
  }

  const data = parsed.data;
  return {
    ...data,
    isHoneypot: Boolean(data.companyWebsite?.trim()),
  };
}
