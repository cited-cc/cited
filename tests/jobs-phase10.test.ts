import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  resetDeploymentCacheForTests,
  setDeploymentModeOverrideForTests,
} from "@/lib/deployment";
import { resetEnvCacheForTests } from "@/lib/env";
import {
  cronToIntervalMs,
  defineJobSchedule,
  isJobDue,
  isJobAvailableForMode,
  listJobsForMode,
} from "@/lib/jobs";

describe("background job registry", () => {
  afterEach(() => {
    resetDeploymentCacheForTests();
    setDeploymentModeOverrideForTests(null);
  });

  it("registers only self-hosted core jobs", () => {
    const selfHostedJobs = listJobsForMode("self_hosted").map(
      (job) => job.definition.id,
    );

    expect(selfHostedJobs).toContain("monitoring.dispatch");
    expect(selfHostedJobs).toContain("notifications.dispatch");
    expect(selfHostedJobs).toContain("notifications.digests");
    expect(selfHostedJobs).toHaveLength(3);
  });

  it("does not expose removed cloud-only jobs", () => {
    expect(isJobAvailableForMode("monitoring.dispatch", "self_hosted")).toBe(
      true,
    );
  });
});

describe("job schedule helpers", () => {
  it("derives five-minute intervals from */5 cron", () => {
    expect(cronToIntervalMs("*/5 * * * *")).toBe(300_000);
  });

  it("derives hourly intervals from hourly cron", () => {
    expect(cronToIntervalMs("0 * * * *")).toBe(3_600_000);
  });

  it("respects minimum spacing between worker runs", () => {
    const schedule = defineJobSchedule("*/15 * * * *");
    const now = new Date("2026-09-04T12:00:00.000Z");
    const recent = new Date("2026-09-04T11:50:00.000Z");
    expect(isJobDue(schedule, recent, now)).toBe(false);
    expect(isJobDue(schedule, null, now)).toBe(true);
  });
});

describe("email provider registry", () => {
  beforeEach(() => {
    resetEnvCacheForTests();
    resetDeploymentCacheForTests();
    setDeploymentModeOverrideForTests(null);
  });

  afterEach(() => {
    resetEnvCacheForTests();
    resetDeploymentCacheForTests();
    setDeploymentModeOverrideForTests(null);
    vi.unstubAllEnvs();
  });

  it("defaults self-hosted mode to smtp when configured", async () => {
    setDeploymentModeOverrideForTests("self_hosted");
    vi.stubEnv("CITED_DEPLOYMENT_MODE", "self_hosted");
    vi.stubEnv("SMTP_HOST", "mail.example.com");
    vi.stubEnv("SMTP_FROM_EMAIL", "Cited <alerts@example.com>");
    resetEnvCacheForTests();
    const { resolveEmailProviderId } = await import(
      "@/lib/notifications/providers/registry"
    );
    expect(resolveEmailProviderId()).toBe("smtp");
  });

  it("uses disabled provider when explicitly configured", async () => {
    vi.stubEnv("CITED_EMAIL_PROVIDER", "disabled");
    resetEnvCacheForTests();
    const { resolveEmailProviderId } = await import(
      "@/lib/notifications/providers/registry"
    );
    expect(resolveEmailProviderId()).toBe("disabled");
  });
});

describe("disabled email provider", () => {
  beforeEach(() => {
    resetEnvCacheForTests();
  });

  afterEach(() => {
    resetEnvCacheForTests();
  });

  it("suppresses routine email without contacting providers", async () => {
    const { disabledEmailProvider } = await import(
      "@/lib/notifications/providers/disabled"
    );
    const result = await disabledEmailProvider.send({
      to: "owner@example.com",
      subject: "Test",
      html: "<p>Hi</p>",
      text: "Hi",
    });
    expect(result).toEqual({
      status: "suppressed",
      reason: "email_provider_disabled",
    });
  });
});
