import { describe, expect, it } from "vitest";

import {
  assertScanTransition,
  canClaimScanPhase,
  dbStatusForPhase,
  isTerminalScanPhase,
  resolveScanPhase,
  ScanStateTransitionError,
} from "@/lib/monitoring/state-machine";
import {
  assertProviderTaskTransition,
  canPollProviderTask,
  resolveProviderTaskPhase,
} from "@/lib/monitoring/provider-task-state";

describe("scan state machine", () => {
  it("resolves queued and retry_scheduled phases", () => {
    expect(
      resolveScanPhase({
        status: "queued",
        attemptCount: 0,
      }),
    ).toBe("queued");

    expect(
      resolveScanPhase({
        status: "queued",
        attemptCount: 2,
        nextAttemptAt: new Date(Date.now() + 60_000).toISOString(),
      }),
    ).toBe("retry_scheduled");
  });

  it("resolves provider_pending from running + poll fields", () => {
    expect(
      resolveScanPhase({
        status: "running",
        providerTaskId: "task-1",
        nextPollAt: new Date().toISOString(),
      }),
    ).toBe("provider_pending");
  });

  it("blocks illegal transitions from terminal states", () => {
    expect(() => assertScanTransition("completed", "queued")).toThrow(
      ScanStateTransitionError,
    );
    expect(() => assertScanTransition("failed", "claimed")).toThrow(
      ScanStateTransitionError,
    );
  });

  it("allows claimable phases only", () => {
    expect(canClaimScanPhase("queued")).toBe(true);
    expect(canClaimScanPhase("provider_pending")).toBe(true);
    expect(canClaimScanPhase("completed")).toBe(false);
    expect(isTerminalScanPhase("failed")).toBe(true);
  });

  it("maps phases to db statuses", () => {
    expect(dbStatusForPhase("retry_scheduled")).toBe("queued");
    expect(dbStatusForPhase("provider_pending")).toBe("running");
    expect(dbStatusForPhase("failed")).toBe("failed");
  });
});

describe("provider task state machine", () => {
  it("resolves ambiguous submission state", () => {
    expect(
      resolveProviderTaskPhase({
        status: "pending",
        submissionState: "ambiguous",
      }),
    ).toBe("ambiguous");
  });

  it("allows polling only for pending-like phases", () => {
    expect(canPollProviderTask("pending")).toBe(true);
    expect(canPollProviderTask("completed")).toBe(false);
  });

  it("blocks terminal provider transitions", () => {
    expect(() =>
      assertProviderTaskTransition("completed", "pending"),
    ).toThrow();
  });
});
