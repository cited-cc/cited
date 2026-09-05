import "server-only";

import { timingSafeEqual } from "node:crypto";

import {
  findUserByNormalizedEmail,
  normalizeEmail,
  recordAuthAuditEvent,
  resolvePrincipalFromUserId,
} from "@/lib/auth/identity";
import {
  assertPasswordLength,
  hashPassword,
  verifyPassword,
  verifyPasswordDummy,
} from "@/lib/auth/password";
import type { AuthenticatedPrincipal } from "@/lib/auth/types";
import { createAdminSupabaseClient } from "@/lib/db/admin";
import {
  assertRateLimitDurable,
  hashRateLimitFingerprint,
} from "@/lib/security/rate-limit";

const MAX_FAILED_ATTEMPTS = 8;
const LOCKOUT_MINUTES = 15;

type CredentialRow = {
  user_id: string;
  password_hash: string;
  failed_attempt_count: number;
  locked_until: string | null;
};

export class LocalAuthError extends Error {
  readonly code:
    | "INVALID_CREDENTIALS"
    | "ACCOUNT_LOCKED"
    | "ACCOUNT_DISABLED";

  constructor(
    code: "INVALID_CREDENTIALS" | "ACCOUNT_LOCKED" | "ACCOUNT_DISABLED",
    message: string,
  ) {
    super(message);
    this.name = "LocalAuthError";
    this.code = code;
  }
}

function genericInvalidCredentials(): never {
  throw new LocalAuthError(
    "INVALID_CREDENTIALS",
    "Incorrect email or password.",
  );
}

function isLocked(row: CredentialRow): boolean {
  if (!row.locked_until) {
    return false;
  }
  return new Date(row.locked_until).getTime() > Date.now();
}

async function assertLoginRateLimit(emailNormalized: string): Promise<void> {
  const key = hashRateLimitFingerprint(["local-login", emailNormalized]);
  const result = await assertRateLimitDurable({
    key,
    limit: 10,
    windowMs: 60_000,
  });
  if (!result.ok) {
    genericInvalidCredentials();
  }
}

export async function createLocalCredentials(
  userId: string,
  password: string,
): Promise<void> {
  assertPasswordLength(password);
  const passwordHash = await hashPassword(password);
  const admin = createAdminSupabaseClient();
  const { error } = await admin.from("local_credentials").insert({
    user_id: userId,
    password_hash: passwordHash,
    password_changed_at: new Date().toISOString(),
    failed_attempt_count: 0,
    locked_until: null,
  });

  if (error) {
    throw new Error(`Failed to create local credentials: ${error.message}`);
  }
}

export async function verifyLocalCredentials(input: {
  email: string;
  password: string;
}): Promise<AuthenticatedPrincipal> {
  const emailNormalized = normalizeEmail(input.email);
  await assertLoginRateLimit(emailNormalized);

  const user = await findUserByNormalizedEmail(emailNormalized);
  if (!user) {
    await verifyPasswordDummy(input.password);
    genericInvalidCredentials();
  }

  if (user.status === "disabled") {
    throw new LocalAuthError("ACCOUNT_DISABLED", "Incorrect email or password.");
  }

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("local_credentials")
    .select("user_id, password_hash, failed_attempt_count, locked_until")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load local credentials: ${error.message}`);
  }

  if (!data) {
    await verifyPasswordDummy(input.password);
    genericInvalidCredentials();
  }

  const row = data as CredentialRow;

  if (isLocked(row)) {
    throw new LocalAuthError("ACCOUNT_LOCKED", "Incorrect email or password.");
  }

  const valid = await verifyPassword(input.password, row.password_hash);
  if (!valid) {
    const failedAttempts = (row.failed_attempt_count ?? 0) + 1;
    const lockedUntil =
      failedAttempts >= MAX_FAILED_ATTEMPTS
        ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000).toISOString()
        : null;

    await admin
      .from("local_credentials")
      .update({
        failed_attempt_count: failedAttempts,
        locked_until: lockedUntil,
      })
      .eq("user_id", user.id);

    genericInvalidCredentials();
  }

  await admin
    .from("local_credentials")
    .update({
      failed_attempt_count: 0,
      locked_until: null,
    })
    .eq("user_id", user.id);

  await recordAuthAuditEvent({ userId: user.id, action: "auth.login.success" });

  const principal = await resolvePrincipalFromUserId(user.id, "local", user.id);
  if (!principal) {
    genericInvalidCredentials();
  }

  return principal;
}

export async function changeLocalPassword(input: {
  userId: string;
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  assertPasswordLength(input.newPassword);

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("local_credentials")
    .select("user_id, password_hash, failed_attempt_count, locked_until")
    .eq("user_id", input.userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load local credentials: ${error.message}`);
  }

  if (!data) {
    throw new LocalAuthError("INVALID_CREDENTIALS", "Incorrect current password.");
  }

  const row = data as CredentialRow;
  const valid = await verifyPassword(input.currentPassword, row.password_hash);
  if (!valid) {
    throw new LocalAuthError("INVALID_CREDENTIALS", "Incorrect current password.");
  }

  const passwordHash = await hashPassword(input.newPassword);
  const { error: updateError } = await admin
    .from("local_credentials")
    .update({
      password_hash: passwordHash,
      password_changed_at: new Date().toISOString(),
      failed_attempt_count: 0,
      locked_until: null,
    })
    .eq("user_id", input.userId);

  if (updateError) {
    throw new Error(`Failed to update password: ${updateError.message}`);
  }

  await recordAuthAuditEvent({
    userId: input.userId,
    action: "auth.password.changed",
  });
}

export function compareBootstrapToken(
  provided: string,
  expected: string,
): boolean {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }
  return timingSafeEqual(providedBuffer, expectedBuffer);
}
