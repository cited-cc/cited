import { describe, expect, it } from "vitest";

import {
  ContactFormValidationError,
  normalizeContactSubmission,
} from "@/lib/contact/validation";

describe("contact form validation", () => {
  it("accepts a valid submission", () => {
    const result = normalizeContactSubmission({
      name: "Alex Daniels",
      email: "alex@example.com",
      topic: "billing",
      message: "I need help with a failed payment on my workspace.",
      companyWebsite: "",
    });

    expect(result.isHoneypot).toBe(false);
    expect(result.name).toBe("Alex Daniels");
    expect(result.topic).toBe("billing");
  });

  it("returns field errors for invalid input", () => {
    expect(() =>
      normalizeContactSubmission({
        name: "",
        email: "not-an-email",
        topic: "general",
        message: "short",
      }),
    ).toThrow(ContactFormValidationError);
  });

  it("treats honeypot submissions as bots", () => {
    const result = normalizeContactSubmission({
      name: "Bot",
      email: "bot@example.com",
      topic: "general",
      message: "This is definitely spam content here.",
      companyWebsite: "https://spam.example",
    });

    expect(result.isHoneypot).toBe(true);
  });
});
