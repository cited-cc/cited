import { createAdminSupabaseClient } from "@/lib/db/admin";
import type { Json } from "@/lib/db/types";
import {
  buildDigestDedupeKey,
  enqueueNotificationOutbox,
} from "@/lib/notifications/create-event-notification";
import {
  calculateDigestPeriod,
  formatDigestPeriodLabel,
  normalizeDigestTimezone,
} from "@/lib/notifications/digest-period";
import { getWorkspaceNotificationPreferences } from "@/lib/notifications/preferences";
import type { DigestCounts, DigestHighlight } from "@/emails/templates";
import { logger } from "@/lib/security/logger";
import type { CitationEventType } from "@/types/product";

export type DigestContent = {
  counts: DigestCounts;
  highlights: DigestHighlight[];
  isEmpty: boolean;
  activeMonitors: number;
  blockedMonitors: number;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  timezone: string;
};

function eventTypeLabel(type: CitationEventType): string {
  switch (type) {
    case "citation":
      return "Citation";
    case "mention":
      return "Mention";
    case "recommendation":
      return "Recommendation";
    case "competitor_citation":
      return "Competitor citation";
    case "missed_opportunity":
      return "Missed opportunity";
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

/**
 * Build digest content from real workspace events in the period.
 * Excludes private notes and private annotations entirely.
 */
export async function buildDigestContent(input: {
  workspaceId: string;
  periodStart: Date;
  periodEnd: Date;
  timezone: string;
}): Promise<DigestContent> {
  const admin = createAdminSupabaseClient();
  const startIso = input.periodStart.toISOString();
  const endIso = input.periodEnd.toISOString();

  const { data: events } = await admin
    .from("citation_events")
    .select(
      "id, event_type, ai_surface, source_title, cited_hostname, first_seen_at, last_seen_at, occurrence_count",
    )
    .eq("workspace_id", input.workspaceId)
    .gte("last_seen_at", startIso)
    .lt("last_seen_at", endIso)
    .order("last_seen_at", { ascending: false })
    .limit(200);

  const counts: DigestCounts = {
    citations: 0,
    mentions: 0,
    recommendations: 0,
    missedOpportunities: 0,
    competitorCitations: 0,
    monitorIssues: 0,
    recurringObservations: 0,
  };

  const highlights: DigestHighlight[] = [];

  for (const event of events ?? []) {
    const type = event.event_type as CitationEventType;
    switch (type) {
      case "citation":
        counts.citations += 1;
        break;
      case "mention":
        counts.mentions += 1;
        break;
      case "recommendation":
        counts.recommendations += 1;
        break;
      case "competitor_citation":
        counts.competitorCitations += 1;
        break;
      case "missed_opportunity":
        counts.missedOpportunities += 1;
        break;
      default: {
        const _exhaustive: never = type;
        void _exhaustive;
      }
    }
    if (Number(event.occurrence_count ?? 1) > 1) {
      counts.recurringObservations += 1;
    }
    if (highlights.length < 5) {
      const title =
        (event.source_title as string | null) ||
        (event.cited_hostname as string | null) ||
        eventTypeLabel(type);
      highlights.push({
        title,
        eventTypeLabel: eventTypeLabel(type),
        aiSurface: (event.ai_surface as string) || "AI",
        eventId: event.id as string,
      });
    }
  }

  const { count: activeMonitors } = await admin
    .from("monitor_configurations")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", input.workspaceId)
    .eq("activation_status", "active");

  const { count: blockedMonitors } = await admin
    .from("monitor_configurations")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", input.workspaceId)
    .eq("activation_status", "blocked");

  const { count: monitorIssueOutbox } = await admin
    .from("notification_outbox")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", input.workspaceId)
    .in("notification_type", [
      "monitor_blocked",
      "monitor_repeated_failure",
      "usage_safety_limit_reached",
      "domain_verification_required",
    ])
    .gte("created_at", startIso)
    .lt("created_at", endIso);

  counts.monitorIssues = monitorIssueOutbox ?? 0;

  const meaningful =
    counts.citations +
      counts.mentions +
      counts.recommendations +
      counts.missedOpportunities +
      counts.competitorCitations +
      counts.monitorIssues >
    0;

  return {
    counts,
    highlights,
    isEmpty: !meaningful,
    activeMonitors: activeMonitors ?? 0,
    blockedMonitors: blockedMonitors ?? 0,
    periodLabel: formatDigestPeriodLabel(
      input.periodStart,
      input.periodEnd,
      input.timezone,
    ),
    periodStart: startIso,
    periodEnd: endIso,
    timezone: input.timezone,
  };
}

export type DigestSchedulerSummary = {
  workspacesEvaluated: number;
  digestsQueued: number;
  digestsSuppressed: number;
  digestsSkipped: number;
};

/**
 * Evaluate eligible workspaces and enqueue digest outbox rows.
 */
export async function runDigestScheduler(input?: {
  batchSize?: number;
  now?: Date;
}): Promise<DigestSchedulerSummary> {
  const admin = createAdminSupabaseClient();
  const now = input?.now ?? new Date();
  const batchSize = input?.batchSize ?? 50;

  const summary: DigestSchedulerSummary = {
    workspacesEvaluated: 0,
    digestsQueued: 0,
    digestsSuppressed: 0,
    digestsSkipped: 0,
  };

  const { data: workspaces } = await admin
    .from("workspaces")
    .select("id, name, status")
    .in("status", ["active", "trialing"])
    .order("created_at", { ascending: true })
    .limit(batchSize);

  for (const workspace of workspaces ?? []) {
    summary.workspacesEvaluated += 1;
    const workspaceId = workspace.id as string;

    const prefs = await getWorkspaceNotificationPreferences(workspaceId);
    if (!prefs.weeklyDigestEmailEnabled) {
      summary.digestsSkipped += 1;
      continue;
    }

    const period = calculateDigestPeriod({
      now,
      digestWeekday: prefs.digestWeekday,
      digestHour: prefs.digestHour,
      digestTimezone: prefs.digestTimezone,
    });

    if (!period.shouldSendNow) {
      summary.digestsSkipped += 1;
      continue;
    }

    const channels: Array<"email"> = ["email"];

    const content = await buildDigestContent({
      workspaceId,
      periodStart: period.periodStart,
      periodEnd: period.periodEnd,
      timezone: period.timezone,
    });

    for (const channel of channels) {
      // Prevent duplicate digest runs.
      const { data: existingRun } = await admin
        .from("notification_digest_runs")
        .select("id, status")
        .eq("workspace_id", workspaceId)
        .eq("period_start", content.periodStart)
        .eq("period_end", content.periodEnd)
        .eq("channel", channel)
        .maybeSingle();

      if (existingRun) {
        summary.digestsSkipped += 1;
        continue;
      }

      if (content.isEmpty && !prefs.sendEmptyDigest) {
        await admin.from("notification_digest_runs").insert({
          workspace_id: workspaceId,
          period_start: content.periodStart,
          period_end: content.periodEnd,
          channel,
          status: "suppressed",
          suppressed_reason: "empty_digest_disabled",
        });
        summary.digestsSuppressed += 1;
        continue;
      }

      const dedupeKey = buildDigestDedupeKey({
        workspaceId,
        channel,
        periodStart: content.periodStart,
        periodEnd: content.periodEnd,
      });

      const enqueued = await enqueueNotificationOutbox({
        workspaceId,
        notificationType: "weekly_digest",
        sourceEntityType: "digest_period",
        sourceEntityId: `${content.periodStart}:${content.periodEnd}:${channel}`,
        dedupeKey,
        payloadSummary: {
          digestPeriodStart: content.periodStart,
          digestPeriodEnd: content.periodEnd,
        },
        priority: "low",
      });

      const { data: run } = await admin
        .from("notification_digest_runs")
        .insert({
          workspace_id: workspaceId,
          period_start: content.periodStart,
          period_end: content.periodEnd,
          channel,
          status: enqueued.created ? "queued" : "pending",
          outbox_id: enqueued.outboxId ?? null,
        })
        .select("id")
        .maybeSingle();

      // Store digest content snapshot on outbox payload_summary (safe counts only).
      if (enqueued.outboxId) {
        await admin
          .from("notification_outbox")
          .update({
            payload_summary: {
              digestPeriodStart: content.periodStart,
              digestPeriodEnd: content.periodEnd,
              counts: content.counts,
              highlightCount: content.highlights.length,
              isEmpty: content.isEmpty,
              channel,
              periodLabel: content.periodLabel,
              timezone: content.timezone,
              activeMonitors: content.activeMonitors,
              blockedMonitors: content.blockedMonitors,
              highlights: content.highlights.map((h) => ({
                eventId: h.eventId,
                eventTypeLabel: h.eventTypeLabel,
                aiSurface: h.aiSurface,
                title: h.title.slice(0, 120),
              })),
            } as Json,
          })
          .eq("id", enqueued.outboxId);
      }

      if (enqueued.created) {
        summary.digestsQueued += 1;
      } else {
        summary.digestsSkipped += 1;
      }
      void run;
    }
  }

  logger.info("Digest scheduler completed", {
    event: "notifications.digest.scheduler_completed",
    workspacesEvaluated: summary.workspacesEvaluated,
    digestsQueued: summary.digestsQueued,
    digestsSuppressed: summary.digestsSuppressed,
    digestsSkipped: summary.digestsSkipped,
  });

  return summary;
}

export { normalizeDigestTimezone };
