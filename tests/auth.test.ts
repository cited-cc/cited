import { describe, expect, it, beforeEach, afterEach } from "vitest";

import {
  getAuthProvider,
  resetAuthConfigCacheForTests,
  resolveAuthProvider,
} from "@/lib/auth/config";
import {
  localMembershipSubject,
  membershipLookupKeys,
} from "@/lib/auth/membership-keys";
import {
  assertPasswordLength,
  hashPassword,
  verifyPassword,
  verifyPasswordDummy,
} from "@/lib/auth/password";
import { toAuthenticatedPrincipal } from "@/lib/auth/principal";
import {
  resetDeploymentCacheForTests,
  setDeploymentModeOverrideForTests,
} from "@/lib/deployment";

describe("auth provider selection", () => {
  beforeEach(() => {
    resetAuthConfigCacheForTests();
    resetDeploymentCacheForTests();
  });

  afterEach(() => {
    resetAuthConfigCacheForTests();
    resetDeploymentCacheForTests();
  });

  it("always resolves to local auth in community edition", () => {
    setDeploymentModeOverrideForTests("self_hosted");
    expect(resolveAuthProvider()).toBe("local");
    expect(getAuthProvider()).toBe("local");
  });

  it("caches resolved provider", () => {
    setDeploymentModeOverrideForTests("self_hosted");
    expect(getAuthProvider()).toBe("local");
    expect(getAuthProvider()).toBe("local");
  });
});

describe("membership lookup keys", () => {
  it("maps clerk principals to clerk subjects", () => {
    const principal = toAuthenticatedPrincipal({
      user: {
        id: "user-uuid",
        emailNormalized: "owner@example.com",
        displayName: "Owner",
        status: "active",
      },
      provider: "clerk",
      providerSubject: "user_clerk_1",
    });

    expect(membershipLookupKeys(principal)).toEqual({
      userId: "user-uuid",
      clerkUserId: "user_clerk_1",
    });
  });

  it("maps local principals to synthetic membership subjects", () => {
    const principal = toAuthenticatedPrincipal({
      user: {
        id: "user-uuid",
        emailNormalized: "owner@example.com",
        displayName: "Owner",
        status: "active",
      },
      provider: "local",
      providerSubject: "user-uuid",
    });

    expect(membershipLookupKeys(principal)).toEqual({
      userId: "user-uuid",
      clerkUserId: localMembershipSubject("user-uuid"),
    });
  });
});

describe("local password hashing", () => {
  it("hashes and verifies passwords with unique salts", async () => {
    const password = "correct horse battery";
    const first = await hashPassword(password);
    const second = await hashPassword(password);

    expect(first).not.toBe(second);
    expect(await verifyPassword(password, first)).toBe(true);
    expect(await verifyPassword("wrong-password-value", first)).toBe(false);
  });

  it("enforces minimum password length", () => {
    expect(() => assertPasswordLength("short")).toThrow(/at least 12/);
  });

  it("fails closed on malformed hashes", async () => {
    expect(await verifyPassword("correct horse battery", "bad-hash")).toBe(false);
  });

  it("runs dummy verification without throwing", async () => {
    await expect(verifyPasswordDummy("any-password-value")).resolves.toBeUndefined();
  });
});
