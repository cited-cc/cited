import { describe, expect, it } from "vitest";

import {
  isRecoverableBlockReason,
  pauseReasonLabel,
} from "@/lib/monitoring/status-copy";

describe("monitor status copy", () => {
  it("maps known pause reasons to user-facing copy", () => {
    expect(pauseReasonLabel("billing_inactive")).toContain("billing");
    expect(pauseReasonLabel("plan_limit")).toContain("plan change");
    expect(pauseReasonLabel("unknown_reason")).toContain("paused");
  });

  it("identifies recoverable block reasons", () => {
    expect(isRecoverableBlockReason("plan_capacity_exceeded")).toBe(true);
    expect(isRecoverableBlockReason("billing_inactive")).toBe(false);
  });
});
