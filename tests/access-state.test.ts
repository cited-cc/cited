import { describe, expect, it } from "vitest";

import {
  destinationForAccessState,
  type AccessState,
} from "@/lib/auth/access-state";
import {
  resetDeploymentCacheForTests,
  setDeploymentModeOverrideForTests,
} from "@/lib/deployment";

describe("access-state destinations", () => {
  it("maps each access kind to a stable route", () => {
    resetDeploymentCacheForTests();
    setDeploymentModeOverrideForTests("self_hosted");
    process.env.NEXT_PUBLIC_CITED_DEPLOYMENT_MODE = "self_hosted";

    const cases: Array<[AccessState, string]> = [
      [{ kind: "unauthenticated" }, "/sign-in"],
      [
        { kind: "authenticated_no_workspace", userId: "user_1", memberSubject: "user_1" },
        "/setup",
      ],
      [
        {
          kind: "workspace_onboarding",
          userId: "user_1",
          memberSubject: "user_1",
          workspaceId: "ws_1",
          currentStep: 2,
          role: "owner",
          planKey: "growth",
          status: "active",
        },
        "/onboarding",
      ],
      [
        {
          kind: "workspace_active",
          userId: "user_1",
          memberSubject: "user_1",
          workspaceId: "ws_1",
          role: "owner",
          planKey: "pro",
          status: "active",
        },
        "/app",
      ],
      [
        {
          kind: "workspace_suspended",
          userId: "user_1",
          memberSubject: "user_1",
          workspaceId: "ws_1",
          role: "owner",
          planKey: "pro",
        },
        "/app?notice=suspended",
      ],
    ];

    for (const [state, expected] of cases) {
      expect(destinationForAccessState(state)).toBe(expected);
    }
  });

  it("routes self-hosted users without a workspace to bootstrap setup", () => {
    resetDeploymentCacheForTests();
    setDeploymentModeOverrideForTests("self_hosted");
    process.env.NEXT_PUBLIC_CITED_DEPLOYMENT_MODE = "self_hosted";
    expect(
      destinationForAccessState({
        kind: "authenticated_no_workspace",
        userId: "user_1",
        memberSubject: "user_1",
      }),
    ).toBe("/setup");
  });
});
