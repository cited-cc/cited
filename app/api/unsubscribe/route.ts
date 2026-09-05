import { NextResponse } from "next/server";

import {
  applyUnsubscribe,
  lookupUnsubscribeToken,
} from "@/lib/notifications/unsubscribe";
import {
  RATE_LIMIT_PRESETS,
  assertRateLimitDurable,
  fingerprintFromRequest,
} from "@/lib/security/rate-limit";

export const runtime = "nodejs";

/**
 * Token-authenticated unsubscribe confirmation (POST).
 * Does not reveal whether an email exists.
 */
export async function POST(request: Request) {
  const rate = await assertRateLimitDurable({
    key: fingerprintFromRequest(request, "unsubscribe"),
    ...RATE_LIMIT_PRESETS.unsubscribe,
  });
  if (!rate.ok) {
    return NextResponse.redirect(
      new URL("/unsubscribe/success?status=invalid", request.url),
      303,
    );
  }

  const form = await request.formData().catch(() => null);
  const token = String(form?.get("token") ?? "");

  const lookup = await lookupUnsubscribeToken(token);
  if (!lookup.ok) {
    return NextResponse.redirect(
      new URL("/unsubscribe/success?status=invalid", request.url),
      303,
    );
  }

  if (!lookup.usedAt) {
    await applyUnsubscribe({
      tokenId: lookup.tokenId,
      workspaceId: lookup.workspaceId,
      clerkUserId: lookup.clerkUserId,
      scope: lookup.scope,
    });
  }

  return NextResponse.redirect(
    new URL("/unsubscribe/success", request.url),
    303,
  );
}
