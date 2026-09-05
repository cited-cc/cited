import { randomBytes } from "node:crypto";
import { promises as dns } from "node:dns";

import { createAdminSupabaseClient } from "@/lib/db/admin";
import { logger } from "@/lib/security/logger";

export const DNS_TXT_PREFIX = "cited-verification=";

export type DnsTxtResolver = (hostname: string) => Promise<string[]>;

export type DnsVerificationOutcome =
  | { ok: true; status: "verified" }
  | {
      ok: false;
      status: "pending" | "failed";
      code: "not_found" | "mismatch" | "rate_limited" | "error";
      message: string;
    };

const MAX_ATTEMPTS_PER_HOUR = 10;

export function generateVerificationToken(): string {
  return randomBytes(24).toString("hex");
}

export function formatDnsTxtValue(token: string): string {
  return `${DNS_TXT_PREFIX}${token}`;
}

/**
 * Host label for the TXT record.
 * Apex domains use "@". Subdomains use the left-most labels.
 */
export function dnsTxtHostLabel(
  normalizedHostname: string,
  registrableDomain: string,
): string {
  if (normalizedHostname === registrableDomain) {
    return "@";
  }
  if (normalizedHostname.endsWith(`.${registrableDomain}`)) {
    return normalizedHostname.slice(0, -(registrableDomain.length + 1));
  }
  return "@";
}

export function flattenTxtRecords(records: string[][]): string[] {
  return records.map((parts) => parts.join(""));
}

export async function defaultDnsTxtResolver(
  hostname: string,
): Promise<string[]> {
  const records = await dns.resolveTxt(hostname);
  return flattenTxtRecords(records);
}

export function matchVerificationToken(
  txtValues: readonly string[],
  expectedToken: string,
): "match" | "mismatch" | "not_found" {
  const expected = formatDnsTxtValue(expectedToken);
  let sawCited = false;
  for (const value of txtValues) {
    const cleaned = value.replace(/^"|"$/g, "").trim();
    if (cleaned === expected) {
      return "match";
    }
    if (cleaned.startsWith(DNS_TXT_PREFIX)) {
      sawCited = true;
    }
  }
  return sawCited ? "mismatch" : "not_found";
}

async function isRateLimited(
  workspaceId: string,
  domainId: string,
): Promise<boolean> {
  const admin = createAdminSupabaseClient();
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error } = await admin
    .from("domain_verification_attempts")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .eq("domain_id", domainId)
    .gte("attempted_at", since);

  if (error) {
    throw new Error(`Failed to check verification rate limit: ${error.message}`);
  }

  return (count ?? 0) >= MAX_ATTEMPTS_PER_HOUR;
}

export async function verifyDomainDnsTxt(input: {
  workspaceId: string;
  domainId: string;
  resolver?: DnsTxtResolver;
}): Promise<DnsVerificationOutcome> {
  const admin = createAdminSupabaseClient();
  const resolver = input.resolver ?? defaultDnsTxtResolver;

  const { data: domain, error } = await admin
    .from("domains")
    .select(
      "id, workspace_id, normalized_hostname, verification_token, verification_status",
    )
    .eq("id", input.domainId)
    .eq("workspace_id", input.workspaceId)
    .maybeSingle();

  if (error || !domain) {
    return {
      ok: false,
      status: "failed",
      code: "error",
      message: "Domain could not be verified.",
    };
  }

  if (!domain.verification_token) {
    return {
      ok: false,
      status: "failed",
      code: "error",
      message: "Verification record is not ready. Regenerate and try again.",
    };
  }

  if (await isRateLimited(input.workspaceId, input.domainId)) {
    await admin.from("domain_verification_attempts").insert({
      domain_id: input.domainId,
      workspace_id: input.workspaceId,
      method: "dns_txt",
      status: "rate_limited",
      failure_code: "rate_limited",
    });
    return {
      ok: false,
      status: "pending",
      code: "rate_limited",
      message:
        "Too many verification attempts. Wait a bit, then try Verify domain again.",
    };
  }

  let txtValues: string[] = [];
  try {
    txtValues = await resolver(domain.normalized_hostname as string);
  } catch {
    await recordAttempt(input.workspaceId, input.domainId, "error", "lookup_failed");
    await admin
      .from("domains")
      .update({
        verification_status: "failed",
        last_checked_at: new Date().toISOString(),
        last_verification_error_code: "lookup_failed",
      })
      .eq("id", input.domainId)
      .eq("workspace_id", input.workspaceId);

    logger.info("DNS TXT lookup failed", {
      event: "domain.verification.lookup_failed",
      workspaceId: input.workspaceId,
    });

    return {
      ok: false,
      status: "failed",
      code: "not_found",
      message:
        "Cited could not find the TXT record yet. DNS changes can take time to propagate.",
    };
  }

  const match = matchVerificationToken(
    txtValues,
    domain.verification_token as string,
  );

  if (match === "match") {
    await recordAttempt(input.workspaceId, input.domainId, "success", null);
    await admin
      .from("domains")
      .update({
        verification_status: "verified",
        verification_method: "dns_txt",
        verified_at: new Date().toISOString(),
        last_checked_at: new Date().toISOString(),
        last_verification_error_code: null,
      })
      .eq("id", input.domainId)
      .eq("workspace_id", input.workspaceId);

    logger.info("Domain verified via DNS TXT", {
      event: "domain.verification.succeeded",
      workspaceId: input.workspaceId,
    });

    return { ok: true, status: "verified" };
  }

  const failureCode = match === "mismatch" ? "mismatch" : "not_found";
  await recordAttempt(
    input.workspaceId,
    input.domainId,
    failureCode,
    failureCode,
  );
  await admin
    .from("domains")
    .update({
      verification_status: "failed",
      verification_method: "dns_txt",
      last_checked_at: new Date().toISOString(),
      last_verification_error_code: failureCode,
    })
    .eq("id", input.domainId)
    .eq("workspace_id", input.workspaceId);

  logger.info("Domain verification mismatch or missing", {
    event: "domain.verification.failed",
    workspaceId: input.workspaceId,
    code: failureCode,
  });

  if (match === "mismatch") {
    return {
      ok: false,
      status: "failed",
      code: "mismatch",
      message:
        "A Cited verification record was found, but it does not match. Confirm the value, or regenerate the record.",
    };
  }

  return {
    ok: false,
    status: "failed",
    code: "not_found",
    message:
      "Cited could not find the TXT record yet. DNS changes can take time to propagate.",
  };
}

async function recordAttempt(
  workspaceId: string,
  domainId: string,
  status: "success" | "not_found" | "mismatch" | "rate_limited" | "error",
  failureCode: string | null,
): Promise<void> {
  const admin = createAdminSupabaseClient();
  await admin.from("domain_verification_attempts").insert({
    domain_id: domainId,
    workspace_id: workspaceId,
    method: "dns_txt",
    status,
    failure_code: failureCode,
  });
}

export async function rotateDomainVerificationToken(input: {
  workspaceId: string;
  domainId: string;
}): Promise<{ token: string; txtValue: string }> {
  const admin = createAdminSupabaseClient();
  const token = generateVerificationToken();
  const { data, error } = await admin
    .from("domains")
    .update({
      verification_token: token,
      verification_token_rotated_at: new Date().toISOString(),
      verification_status: "pending",
      verified_at: null,
      last_verification_error_code: null,
    })
    .eq("id", input.domainId)
    .eq("workspace_id", input.workspaceId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    throw new Error("Could not regenerate verification record.");
  }

  return { token, txtValue: formatDnsTxtValue(token) };
}
