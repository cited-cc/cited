import { describe, expect, it } from "vitest";

import {
  escapeHtml,
  formatSafeSourceDisplay,
  truncateEvidence,
  truncatePrompt,
  truncateSafe,
} from "@/lib/notifications/content-safety";
import {
  buildDigestDedupeKey,
  buildEventDedupeKey,
  buildMonitorDedupeKey,
} from "@/lib/notifications/create-event-notification";
import {
  calculateDigestPeriod,
  isValidIanaTimezone,
  normalizeDigestHour,
  normalizeDigestTimezone,
  normalizeDigestWeekday,
} from "@/lib/notifications/digest-period";
import {
  canReceiveDigestEmail,
  canReceiveInstantEmail,
  defaultUserPrefsForRole,
  isUserEmailFullyUnsubscribed,
  mapUserPrefs,
  mapWorkspacePrefs,
} from "@/lib/notifications/preferences";
import {
  roleEligibleForDigest,
  roleEligibleForInstant,
  roleEligibleForMonitor,
} from "@/lib/notifications/recipients";
import { computeNextAttemptAt } from "@/lib/notifications/claim-outbox";
import {
  decryptSecret,
  encryptSecret,
  generateSecureToken,
  hashEmail,
  hashToken,
  timingSafeEqualHex,
} from "@/lib/security/encryption";
import {
  isValidSlackWebhookUrl,
} from "@/lib/notifications/providers/slack";
import {
  instantEventSubject,
  renderInstantEventAlert,
  renderWeeklyDigest,
} from "@/emails/templates";
import { mapCitationEventToNotificationType } from "@/lib/notifications/types";
import { requireCronAuthorization } from "@/lib/security/cron";
import { redactObject } from "@/lib/security/logger";
import { unsubscribeScopeForNotificationType } from "@/lib/notifications/unsubscribe";

describe("notification preference defaults", () => {
  it("gives owners instant + digest + monitor defaults", () => {
    expect(defaultUserPrefsForRole("owner")).toEqual({
      emailAlertsEnabled: true,
      weeklyDigestEnabled: true,
      monitorIssueAlertsEnabled: true,
      productTipsEnabled: true,
    });
  });

  it("gives viewers digest-off and no instant alerts", () => {
    expect(defaultUserPrefsForRole("viewer")).toEqual({
      emailAlertsEnabled: false,
      weeklyDigestEnabled: false,
      monitorIssueAlertsEnabled: false,
      productTipsEnabled: false,
    });
  });

  it("maps workspace prefs without exposing webhook plaintext", () => {
    const mapped = mapWorkspacePrefs({
      id: "p1",
      workspace_id: "w1",
      instant_email_enabled: true,
      weekly_digest_email_enabled: true,
      slack_webhook_url_encrypted: "v1:iv:tag:cipher",
      slack_status: "connected",
      slack_enabled: true,
    });
    expect(mapped.slackWebhookConfigured).toBe(true);
    expect(mapped.slackStatus).toBe("connected");
    expect(JSON.stringify(mapped)).not.toContain("v1:iv:tag:cipher");
  });
});

describe("recipient role eligibility", () => {
  it("limits instant alerts to owner/admin", () => {
    expect(roleEligibleForInstant("owner")).toBe(true);
    expect(roleEligibleForInstant("admin")).toBe(true);
    expect(roleEligibleForInstant("member")).toBe(false);
    expect(roleEligibleForInstant("viewer")).toBe(false);
  });

  it("allows digest for members", () => {
    expect(roleEligibleForDigest("member")).toBe(true);
    expect(roleEligibleForMonitor("member")).toBe(false);
  });
});

describe("unsubscribe preference gates", () => {
  const workspace = mapWorkspacePrefs({
    id: "p1",
    workspace_id: "w1",
    instant_email_enabled: true,
    weekly_digest_email_enabled: true,
    monitor_issue_email_enabled: true,
  });

  it("blocks instant email when unsubscribed all", () => {
    const user = mapUserPrefs({
      id: "u1",
      workspace_id: "w1",
      clerk_user_id: "user_1",
      email_alerts_enabled: true,
      weekly_digest_enabled: true,
      monitor_issue_alerts_enabled: true,
      unsubscribed_all_at: new Date().toISOString(),
    });
    expect(isUserEmailFullyUnsubscribed(user)).toBe(true);
    expect(canReceiveInstantEmail(workspace, user)).toBe(false);
    expect(canReceiveDigestEmail(workspace, user)).toBe(false);
  });

  it("allows digest unsubscribe without killing instant when only digest unsub", () => {
    const user = mapUserPrefs({
      id: "u1",
      workspace_id: "w1",
      clerk_user_id: "user_1",
      email_alerts_enabled: true,
      weekly_digest_enabled: false,
      digest_unsubscribed_at: new Date().toISOString(),
      monitor_issue_alerts_enabled: true,
    });
    expect(canReceiveInstantEmail(workspace, user)).toBe(true);
    expect(canReceiveDigestEmail(workspace, user)).toBe(false);
  });
});

describe("dedupe keys", () => {
  it("builds stable event dedupe keys", () => {
    const a = buildEventDedupeKey({
      workspaceId: "w1",
      notificationType: "new_citation",
      citationEventId: "e1",
    });
    const b = buildEventDedupeKey({
      workspaceId: "w1",
      notificationType: "new_citation",
      citationEventId: "e1",
    });
    expect(a).toBe(b);
    expect(a).toBe("w1:new_citation:e1");
  });

  it("maps citation event types to notification types", () => {
    expect(mapCitationEventToNotificationType("citation")).toBe("new_citation");
    expect(mapCitationEventToNotificationType("mention")).toBe("new_mention");
    expect(mapCitationEventToNotificationType("recommendation")).toBe(
      "new_recommendation",
    );
    expect(mapCitationEventToNotificationType("competitor_citation")).toBe(
      "new_competitor_citation",
    );
    expect(mapCitationEventToNotificationType("missed_opportunity")).toBe(
      "new_missed_opportunity",
    );
  });

  it("builds monitor and digest dedupe keys", () => {
    expect(
      buildMonitorDedupeKey({
        workspaceId: "w1",
        notificationType: "monitor_blocked",
        monitorIdOrGroup: "m1",
        issueFingerprint: "repeated_failures:m1",
      }),
    ).toBe("w1:monitor_blocked:m1:repeated_failures:m1");

    expect(
      buildDigestDedupeKey({
        workspaceId: "w1",
        channel: "email",
        periodStart: "2026-01-01T00:00:00.000Z",
        periodEnd: "2026-01-08T00:00:00.000Z",
      }),
    ).toContain("weekly_digest:email:");
  });
});

describe("digest period", () => {
  it("validates timezone and normalizes defaults", () => {
    expect(isValidIanaTimezone("UTC")).toBe(true);
    expect(isValidIanaTimezone("Not/AZone")).toBe(false);
    expect(normalizeDigestTimezone("bogus")).toBe("UTC");
    expect(normalizeDigestWeekday(9)).toBe(1);
    expect(normalizeDigestHour(25)).toBe(9);
  });

  it("calculates a 7-day period ending at digest boundary", () => {
    // Monday 2026-07-06 09:30 UTC
    const now = new Date("2026-07-06T09:30:00.000Z");
    const period = calculateDigestPeriod({
      now,
      digestWeekday: 1,
      digestHour: 9,
      digestTimezone: "UTC",
    });
    expect(period.shouldSendNow).toBe(true);
    expect(period.periodEnd.getTime() - period.periodStart.getTime()).toBe(
      7 * 24 * 60 * 60 * 1000,
    );
  });
});

describe("content safety and email render", () => {
  it("escapes HTML and truncates safely", () => {
    expect(escapeHtml(`<script>alert("x")</script>`)).not.toContain("<script>");
    expect(truncateSafe("one two three four", 10).text.length).toBeLessThanOrEqual(
      11,
    );
    expect(truncatePrompt("a".repeat(500)).length).toBeLessThanOrEqual(161);
    expect(truncateEvidence("b".repeat(500)).length).toBeLessThanOrEqual(281);
  });

  it("formats source display as hostname/path only", () => {
    expect(formatSafeSourceDisplay("https://example.com/path/page")).toBe(
      "example.com/path/page",
    );
  });

  it("renders instant alert with plain text, manage + unsubscribe, no full response", () => {
    const fullResponse = "FULL_AI_RESPONSE_" + "x".repeat(2000);
    const rendered = renderInstantEventAlert({
      notificationType: "new_citation",
      workspaceName: "Acme",
      domainOrBrand: "acme.com",
      aiSurface: "ChatGPT",
      promptText: "best tools " + "y".repeat(300),
      firstSeenAt: "Jul 1, 2026",
      observedAt: "Jul 2, 2026",
      eventTypeLabel: "Citation",
      evidenceExcerpt: "short evidence",
      sourceDisplay: "https://acme.com/blog",
      eventId: "11111111-1111-1111-1111-111111111111",
      manageUrl: "https://cited.cc/app/settings/notifications",
      unsubscribeUrl: "https://cited.cc/unsubscribe/tok",
    });

    expect(rendered.subject).toContain("New citation found");
    expect(rendered.subject).not.toContain("https://");
    expect(rendered.html).toContain("Manage notifications");
    expect(rendered.html).toContain("Unsubscribe");
    expect(rendered.text).toContain("Manage notifications");
    expect(rendered.text).toContain("Unsubscribe");
    expect(rendered.html).not.toContain(fullResponse);
    expect(rendered.text).not.toContain(fullResponse);
    expect(rendered.html).toContain("Open citation note");
  });

  it("uses calm subject lines", () => {
    expect(
      instantEventSubject({
        notificationType: "new_missed_opportunity",
      }),
    ).toBe("Missed opportunity found for a monitored prompt");
  });

  it("renders empty digest quietly", () => {
    const rendered = renderWeeklyDigest({
      periodLabel: "Jul 1 - Jul 8 (UTC)",
      counts: {
        citations: 0,
        mentions: 0,
        recommendations: 0,
        missedOpportunities: 0,
        competitorCitations: 0,
        monitorIssues: 0,
        recurringObservations: 0,
      },
      highlights: [],
      isEmpty: true,
      manageUrl: "https://cited.cc/app/settings/notifications",
      unsubscribeUrl: "https://cited.cc/unsubscribe/tok",
    });
    expect(rendered.text).toContain("No new citation evidence this week");
    expect(rendered.html).toContain("No new citation evidence this week");
  });

  it("uses Learn Domains-style Cited shell with pamphlet CTA", () => {
    const rendered = renderInstantEventAlert({
      notificationType: "new_citation",
      domainOrBrand: "acme.com",
      aiSurface: "ChatGPT",
      eventTypeLabel: "Citation",
      eventId: "11111111-1111-1111-1111-111111111111",
      manageUrl: "https://cited.cc/app/settings/notifications",
      unsubscribeUrl: "https://cited.cc/unsubscribe/tok",
    });
    expect(rendered.html).toContain("#5ce1e6");
    expect(rendered.html).toContain("#15131a");
    expect(rendered.html).toContain("Cited");
    expect(rendered.html).toContain("hello@cited.cc");
    expect(rendered.html).not.toContain("—");
    expect(rendered.text).not.toContain("—");
  });
});

describe("lifecycle unsubscribe scopes", () => {
  it("scopes lifecycle unsubscribes to product tips", () => {
    expect(unsubscribeScopeForNotificationType("welcome_day_0")).toBe(
      "product_tips",
    );
    expect(unsubscribeScopeForNotificationType("learn_domains_day_21")).toBe(
      "product_tips",
    );
  });
});

describe("encryption and tokens", () => {
  const key = "a".repeat(64);

  it("encrypts and decrypts secrets", () => {
    const encrypted = encryptSecret(
      "https://hooks.slack.com/services/T00/B00/XXX",
      key,
    );
    expect(encrypted.startsWith("v1:")).toBe(true);
    expect(decryptSecret(encrypted, key)).toBe(
      "https://hooks.slack.com/services/T00/B00/XXX",
    );
  });

  it("hashes tokens and emails; never stores raw", () => {
    const raw = generateSecureToken();
    const hashed = hashToken(raw);
    expect(hashed).not.toBe(raw);
    expect(hashed).toHaveLength(64);
    expect(hashEmail("Ada@Example.com")).toBe(hashEmail("ada@example.com"));
    expect(timingSafeEqualHex(hashed, hashed)).toBe(true);
    expect(timingSafeEqualHex(hashed, hashToken("other"))).toBe(false);
  });

  it("validates slack webhook URLs strictly", () => {
    expect(
      isValidSlackWebhookUrl(
        "https://hooks.slack.com/services/T00/B00/XXXX",
      ),
    ).toBe(true);
    expect(isValidSlackWebhookUrl("http://hooks.slack.com/services/T00/B00/X")).toBe(
      false,
    );
    expect(isValidSlackWebhookUrl("https://evil.example/services/T00/B00/X")).toBe(
      false,
    );
  });
});

describe("retry backoff and cron auth", () => {
  it("computes increasing backoff", () => {
    const a = computeNextAttemptAt({ attemptCount: 1 }).getTime();
    const b = computeNextAttemptAt({ attemptCount: 4 }).getTime();
    expect(b).toBeGreaterThan(a);
  });

  it("respects retry-after seconds", () => {
    const next = computeNextAttemptAt({
      attemptCount: 1,
      retryAfterSeconds: 120,
    });
    expect(next.getTime()).toBeGreaterThan(Date.now() + 100_000);
  });

  it("requires cron secret with timing-safe compare", () => {
    expect(requireCronAuthorization("Bearer secret", "secret")).toBe(true);
    expect(requireCronAuthorization("Bearer wrong", "secret")).toBe(false);
    expect(requireCronAuthorization("Bearer secret", undefined)).toBe(false);
  });
});

describe("unsubscribe scopes and log redaction", () => {
  it("maps notification types to unsubscribe scopes", () => {
    expect(unsubscribeScopeForNotificationType("weekly_digest")).toBe(
      "weekly_digest",
    );
    expect(unsubscribeScopeForNotificationType("monitor_blocked")).toBe(
      "monitor_issues",
    );
    expect(unsubscribeScopeForNotificationType("new_citation")).toBe(
      "instant_alerts",
    );
  });

  it("redacts webhook/token/prompt/response from logs", () => {
    const redacted = redactObject({
      event: "notifications.test",
      webhook_url: "https://hooks.slack.com/services/T/B/X",
      token: "raw-token",
      promptText: "secret prompt",
      response_text: "secret response",
      outbox_id: "ok-to-keep",
    });
    expect(redacted.webhook_url).toBe("[REDACTED]");
    expect(redacted.token).toBe("[REDACTED]");
    expect(redacted.promptText).toBe("[REDACTED]");
    expect(redacted.response_text).toBe("[REDACTED]");
    expect(redacted.outbox_id).toBe("ok-to-keep");
  });
});
