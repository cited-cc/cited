import "server-only";

import { findUserById } from "@/lib/auth/identity";
import { createAdminSupabaseClient } from "@/lib/db/admin";

export async function getPasswordChangedAtMs(
  userId: string,
): Promise<number | null> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("local_credentials")
    .select("password_changed_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data?.password_changed_at) {
    return null;
  }

  return new Date(data.password_changed_at as string).getTime();
}

/**
 * Returns false when the session should be invalidated (disabled user or
 * password changed after token issuance).
 */
export async function isSessionStillValid(input: {
  userId: string;
  tokenPasswordChangedAt?: number;
}): Promise<boolean> {
  const user = await findUserById(input.userId);
  if (!user || user.status === "disabled") {
    return false;
  }

  const dbChangedAt = await getPasswordChangedAtMs(input.userId);
  if (
    dbChangedAt !== null &&
    input.tokenPasswordChangedAt !== undefined &&
    dbChangedAt > input.tokenPasswordChangedAt
  ) {
    return false;
  }

  return true;
}
