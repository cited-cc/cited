import { NextResponse } from "next/server";

import {
  normalizeContactSubmission,
  ContactFormValidationError,
} from "@/lib/contact/validation";
import { getOptionalServerEnv, isNotificationsEnabled } from "@/lib/env";
import {
  resolveEmailProviderId,
  sendNotificationEmail,
} from "@/lib/notifications/providers/registry";
import { logger } from "@/lib/security/logger";
import {
  assertRateLimitDurable,
  fingerprintFromRequest,
  RATE_LIMIT_PRESETS,
} from "@/lib/security/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const fingerprint = fingerprintFromRequest(request, "contact");
  const limited = await assertRateLimitDurable({
    key: fingerprint,
    ...RATE_LIMIT_PRESETS.contact,
  });

  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again shortly." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSeconds) },
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  try {
    const submission = normalizeContactSubmission(body);

    if (submission.isHoneypot) {
      return NextResponse.json({
        ok: true,
        message: "Thanks. We received your message and will reply by email.",
      });
    }

    const env = getOptionalServerEnv();
    const to = env.SMTP_FROM_EMAIL;
    if (!to || resolveEmailProviderId(env) === "disabled") {
      return NextResponse.json(
        {
          error:
            "Contact email is not configured on this instance. Configure SMTP settings first.",
        },
        { status: 503 },
      );
    }

    if (!isNotificationsEnabled(env)) {
      return NextResponse.json(
        {
          error: "Email delivery is disabled on this instance.",
        },
        { status: 503 },
      );
    }

    const subject = `[Cited contact] ${submission.topic}`;
    const text = [
      `Name: ${submission.name}`,
      `Email: ${submission.email}`,
      `Topic: ${submission.topic}`,
      "",
      submission.message,
    ].join("\n");

    const result = await sendNotificationEmail({
      to,
      subject,
      text,
      html: `<pre>${text.replace(/</g, "&lt;")}</pre>`,
      replyTo: submission.email,
      bypassNotificationsGate: true,
    });

    if (result.status === "sent" || result.status === "suppressed") {
      return NextResponse.json({
        ok: true,
        message: "Thanks. We received your message and will reply by email.",
      });
    }

    logger.warn("contact_form_send_failed", {
      event: "contact_form.send_failed",
      failure_code: result.code,
    });

    return NextResponse.json(
      {
        error:
          result.safeMessage ??
          "We could not send your message right now. Try again shortly.",
      },
      { status: 503 },
    );
  } catch (error) {
    if (error instanceof ContactFormValidationError) {
      return NextResponse.json(
        { error: error.message, fieldErrors: error.fieldErrors },
        { status: 400 },
      );
    }

    logger.error("contact_form_api_error", { event: "contact_form.api_error" });
    return NextResponse.json(
      {
        error: "Something went wrong. Try again shortly.",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}
