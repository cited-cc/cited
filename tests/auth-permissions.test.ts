import { describe, expect, it } from "vitest";

import {
  assertRoleAllowed,
  canArchiveInboxEvents,
  canEditMonitors,
  canManageBilling,
  canManagePersonalNotifications,
  canManageWorkspaceNotifications,
  canResolveInboxEvents,
  canSaveInboxEvents,
  canTriageInboxEvents,
  canViewInbox,
  hasMinimumRole,
} from "@/lib/auth/permissions";

describe("workspace authorization helpers", () => {
  it("enforces allowed roles", () => {
    expect(assertRoleAllowed("owner", ["owner", "admin"])).toEqual({
      ok: true,
    });
    expect(assertRoleAllowed("viewer", ["owner", "admin"])).toEqual({
      ok: false,
      reason: "INSUFFICIENT_ROLE",
    });
  });

  it("ranks roles for capability checks", () => {
    expect(hasMinimumRole("admin", "member")).toBe(true);
    expect(hasMinimumRole("viewer", "member")).toBe(false);
    expect(canViewInbox("viewer")).toBe(true);
    expect(canTriageInboxEvents("viewer")).toBe(true);
    expect(canSaveInboxEvents("viewer")).toBe(true);
    expect(canArchiveInboxEvents("viewer")).toBe(false);
    expect(canResolveInboxEvents("member")).toBe(true);
    expect(canEditMonitors("viewer")).toBe(false);
    expect(canEditMonitors("member")).toBe(true);
    expect(canManageBilling("member")).toBe(false);
    expect(canManageBilling("admin")).toBe(true);
    expect(canManageWorkspaceNotifications("member")).toBe(false);
    expect(canManageWorkspaceNotifications("admin")).toBe(true);
    expect(canManagePersonalNotifications("viewer")).toBe(true);
  });
});
