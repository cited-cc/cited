import "server-only";

import { randomUUID } from "node:crypto";

import { toAuthenticatedPrincipal } from "@/lib/auth/principal";
import type {
  AuthenticatedPrincipal,
  AuthProvider,
  UserRecord,
  UserStatus,
} from "@/lib/auth/types";
import { createAdminSupabaseClient } from "@/lib/db/admin";
import type { Json } from "@/lib/db/types";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

type UserRow = {
  id: string;
  email_normalized: string | null;
  display_name: string | null;
  status: UserStatus;
};

type IdentityRow = {
  id: string;
  user_id: string;
  provider: AuthProvider;
  provider_subject: string;
};

function mapUserRow(row: UserRow): UserRecord {
  return {
    id: row.id,
    emailNormalized: row.email_normalized,
    displayName: row.display_name,
    status: row.status,
  };
}

export async function findUserById(userId: string): Promise<UserRecord | null> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("users")
    .select("id, email_normalized, display_name, status")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load user: ${error.message}`);
  }

  return data ? mapUserRow(data as UserRow) : null;
}

export async function findUserByNormalizedEmail(
  emailNormalized: string,
): Promise<UserRecord | null> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("users")
    .select("id, email_normalized, display_name, status")
    .eq("email_normalized", emailNormalized)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load user by email: ${error.message}`);
  }

  return data ? mapUserRow(data as UserRow) : null;
}

export async function findIdentityByProviderSubject(
  provider: AuthProvider,
  providerSubject: string,
): Promise<IdentityRow | null> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("auth_identities")
    .select("id, user_id, provider, provider_subject")
    .eq("provider", provider)
    .eq("provider_subject", providerSubject)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load auth identity: ${error.message}`);
  }

  return (data as IdentityRow | null) ?? null;
}

export async function createUserRecord(input: {
  emailNormalized?: string | null;
  displayName?: string | null;
  status?: UserStatus;
  id?: string;
}): Promise<UserRecord> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("users")
    .insert({
      id: input.id,
      email_normalized: input.emailNormalized ?? null,
      display_name: input.displayName ?? null,
      status: input.status ?? "active",
    })
    .select("id, email_normalized, display_name, status")
    .single();

  if (error) {
    throw new Error(`Failed to create user: ${error.message}`);
  }

  return mapUserRow(data as UserRow);
}

export async function createAuthIdentity(input: {
  userId: string;
  provider: AuthProvider;
  providerSubject: string;
  providerMetadata?: Json;
}): Promise<IdentityRow> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("auth_identities")
    .insert({
      user_id: input.userId,
      provider: input.provider,
      provider_subject: input.providerSubject,
      provider_metadata: input.providerMetadata ?? {},
    })
    .select("id, user_id, provider, provider_subject")
    .single();

  if (error) {
    throw new Error(`Failed to create auth identity: ${error.message}`);
  }

  return data as IdentityRow;
}

export async function createLocalUser(input: {
  email: string;
  displayName?: string | null;
}): Promise<AuthenticatedPrincipal> {
  const emailNormalized = normalizeEmail(input.email);
  const existing = await findUserByNormalizedEmail(emailNormalized);
  if (existing) {
    throw new Error("A user with this email already exists.");
  }

  const user = await createUserRecord({
    emailNormalized,
    displayName: input.displayName ?? null,
  });

  await createAuthIdentity({
    userId: user.id,
    provider: "local",
    providerSubject: user.id,
  });

  return toAuthenticatedPrincipal({
    user,
    provider: "local",
    providerSubject: user.id,
  });
}

export async function resolveOrCreateClerkIdentity(input: {
  clerkUserId: string;
  email?: string | null;
  displayName?: string | null;
}): Promise<AuthenticatedPrincipal> {
  const existingIdentity = await findIdentityByProviderSubject(
    "clerk",
    input.clerkUserId,
  );

  if (existingIdentity) {
    const user = await findUserById(existingIdentity.user_id);
    if (!user) {
      throw new Error("Auth identity references a missing user.");
    }
    if (user.status === "disabled") {
      throw new Error("Account is disabled.");
    }
    return toAuthenticatedPrincipal({
      user,
      provider: "clerk",
      providerSubject: input.clerkUserId,
    });
  }

  const admin = createAdminSupabaseClient();
  const emailNormalized = input.email ? normalizeEmail(input.email) : null;

  const user = await createUserRecord({
    emailNormalized,
    displayName: input.displayName ?? null,
  });

  try {
    await createAuthIdentity({
      userId: user.id,
      provider: "clerk",
      providerSubject: input.clerkUserId,
      providerMetadata: {
        linkedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    const raced = await findIdentityByProviderSubject("clerk", input.clerkUserId);
    if (raced) {
      const racedUser = await findUserById(raced.user_id);
      if (racedUser) {
        return toAuthenticatedPrincipal({
          user: racedUser,
          provider: "clerk",
          providerSubject: input.clerkUserId,
        });
      }
    }

    await admin.from("users").delete().eq("id", user.id);
    throw error;
  }

  return toAuthenticatedPrincipal({
    user,
    provider: "clerk",
    providerSubject: input.clerkUserId,
  });
}

export async function countWorkspaceOwners(): Promise<number> {
  const admin = createAdminSupabaseClient();
  const { count, error } = await admin
    .from("workspace_members")
    .select("id", { count: "exact", head: true })
    .eq("role", "owner");

  if (error) {
    throw new Error(`Failed to count workspace owners: ${error.message}`);
  }

  return count ?? 0;
}

export async function hasAnyInternalUser(): Promise<boolean> {
  const admin = createAdminSupabaseClient();
  const { count, error } = await admin
    .from("users")
    .select("id", { count: "exact", head: true });

  if (error) {
    throw new Error(`Failed to count users: ${error.message}`);
  }

  return (count ?? 0) > 0;
}

export async function recordAuthAuditEvent(input: {
  userId?: string | null;
  workspaceId?: string | null;
  action: string;
}): Promise<void> {
  const admin = createAdminSupabaseClient();
  const { error } = await admin.from("auth_audit_events").insert({
    id: randomUUID(),
    user_id: input.userId ?? null,
    workspace_id: input.workspaceId ?? null,
    action: input.action,
  });

  if (error) {
    throw new Error(`Failed to record auth audit event: ${error.message}`);
  }
}

export async function disableUserAccount(userId: string): Promise<void> {
  const admin = createAdminSupabaseClient();
  const { error } = await admin
    .from("users")
    .update({ status: "disabled" })
    .eq("id", userId);

  if (error) {
    throw new Error(`Failed to disable user: ${error.message}`);
  }

  await recordAuthAuditEvent({ userId, action: "user.disabled" });
}

export async function resolvePrincipalFromUserId(
  userId: string,
  provider: AuthProvider,
  providerSubject: string,
): Promise<AuthenticatedPrincipal | null> {
  const user = await findUserById(userId);
  if (!user || user.status === "disabled") {
    return null;
  }

  return toAuthenticatedPrincipal({ user, provider, providerSubject });
}
