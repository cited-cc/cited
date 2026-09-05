import { createAdminSupabaseClient } from "@/lib/db/admin";
import {
  renderInstantEventAlert,
  renderMonitorIssueAlert,
  renderWeeklyDigest,
  type DigestCounts,
  type DigestHighlight,
  type RenderedEmail,
} from "@/emails/templates";
import {
  buildInstantEventSlackPayload,
  buildMonitorIssueSlackPayload,
  buildWeeklyDigestSlackPayload,
} from "@/lib/notifications/slack-payloads";
import type { SlackBlockPayload } from "@/lib/notifications/providers/slack";
import {
  isInstantEventNotificationType,
  isLifecycleNotificationType,
  type InstantEventNotificationType,
  type NotificationType,
} from "@/lib/notifications/types";
import type { CitationEventType } from "@/types/product";

function formatTimestamp(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });
}

function eventTypeLabel(type: CitationEventType | string): string {
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
    default:
      return "Citation event";
  }
}

function surfaceLabel(key: string | null | undefined): string {
  switch (key) {
    case "chatgpt":
      return "ChatGPT";
    case "gemini":
      return "Gemini";
    case "google_ai_overviews":
      return "Google AI Overviews";
    case "google_ai_mode":
      return "Google AI Mode";
    case "perplexity":
      return "Perplexity";
    case "claude":
      return "Claude";
    default:
      return key || "AI surface";
  }
}

export type LoadedNotificationContent = {
  email: RenderedEmail;
  slack: SlackBlockPayload | null;
  eventId?: string;
  canceled?: boolean;
  cancelReason?: string;
};

async function loadWorkspaceName(workspaceId: string): Promise<string | null> {
  const admin = createAdminSupabaseClient();
  const { data } = await admin
    .from("workspaces")
    .select("name")
    .eq("id", workspaceId)
    .maybeSingle();
  return (data?.name as string | null) ?? null;
}

async function loadDomainOrBrand(workspaceId: string): Promise<string | null> {
  const admin = createAdminSupabaseClient();
  const { data: domain } = await admin
    .from("domains")
    .select("normalized_hostname")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (domain?.normalized_hostname) {
    return domain.normalized_hostname as string;
  }
  const { data: brand } = await admin
    .from("brands")
    .select("name")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return (brand?.name as string | null) ?? null;
}

export async function loadInstantEventContent(input: {
  workspaceId: string;
  notificationType: InstantEventNotificationType;
  eventId: string;
  manageUrl: string;
  unsubscribeUrl: string;
}): Promise<LoadedNotificationContent> {
  const admin = createAdminSupabaseClient();
  const { data: event } = await admin
    .from("citation_events")
    .select(
      "id, event_type, ai_surface, source_title, source_snippet, cited_hostname, cited_url_normalized, first_seen_at, last_seen_at, scan_run_id, monitor_configuration_id",
    )
    .eq("id", input.eventId)
    .eq("workspace_id", input.workspaceId)
    .maybeSingle();

  if (!event) {
    return {
      email: {
        subject: "Canceled",
        html: "",
        text: "",
      },
      slack: null,
      canceled: true,
      cancelReason: "source_entity_missing",
    };
  }

  let promptText: string | null = null;
  if (event.scan_run_id) {
    const { data: response } = await admin
      .from("ai_responses")
      .select("prompt_text_snapshot")
      .eq("scan_run_id", event.scan_run_id as string)
      .eq("workspace_id", input.workspaceId)
      .maybeSingle();
    promptText = (response?.prompt_text_snapshot as string | null) ?? null;
  }

  const workspaceName = await loadWorkspaceName(input.workspaceId);
  const domainOrBrand = await loadDomainOrBrand(input.workspaceId);
  const aiSurface = surfaceLabel(event.ai_surface as string);
  const typeLabel = eventTypeLabel(event.event_type as string);

  const email = renderInstantEventAlert({
    notificationType: input.notificationType,
    workspaceName,
    domainOrBrand,
    aiSurface,
    promptText,
    firstSeenAt: formatTimestamp(event.first_seen_at as string),
    observedAt: formatTimestamp(event.last_seen_at as string),
    eventTypeLabel: typeLabel,
    evidenceExcerpt: (event.source_snippet as string | null) ?? null,
    sourceDisplay:
      (event.cited_url_normalized as string | null) ??
      (event.cited_hostname as string | null),
    eventId: event.id as string,
    manageUrl: input.manageUrl,
    unsubscribeUrl: input.unsubscribeUrl,
  });

  const slack = buildInstantEventSlackPayload({
    notificationType: input.notificationType,
    aiSurface,
    eventTypeLabel: typeLabel,
    promptText,
    evidenceExcerpt: (event.source_snippet as string | null) ?? null,
    sourceDisplay:
      (event.cited_url_normalized as string | null) ??
      (event.cited_hostname as string | null),
    eventId: event.id as string,
    firstSeenLabel: formatTimestamp(event.first_seen_at as string),
  });

  return { email, slack, eventId: event.id as string };
}

function monitorCopy(type: string, reason?: string | null): {
  subject: string;
  headline: string;
  whatHappened: string;
  safeReason: string;
  nextAction: string;
  ctaLabel: string;
  ctaPath: string;
} {
  switch (type) {
    case "domain_verification_required":
      return {
        subject: "Domain verification is required before monitoring can run",
        headline: "Cited monitor needs attention",
        whatHappened:
          "A domain is still unverified and prevents monitoring activation.",
        safeReason: "Domain verification required",
        nextAction: "Complete DNS verification in setup.",
        ctaLabel: "Open domain setup",
        ctaPath: "/onboarding?step=2",
      };
    case "usage_safety_limit_reached":
      return {
        subject: "Monitoring safety limit reached for this billing period",
        headline: "Cited monitor needs attention",
        whatHappened:
          "Monitoring paused after reaching the configured safety threshold for this billing period.",
        safeReason: "Usage safety limit reached",
        nextAction: "Review monitors and billing period usage.",
        ctaLabel: "Open Monitors",
        ctaPath: "/app/monitors",
      };
    case "monitor_recovered":
      return {
        subject: "Cited monitor recovered",
        headline: "Monitor recovered",
        whatHappened:
          "A previously blocked monitor has returned to an active eligible state.",
        safeReason: reason || "Monitor recovered",
        nextAction: "No action required. Monitoring will continue on schedule.",
        ctaLabel: "Open Monitors",
        ctaPath: "/app/monitors",
      };
    case "monitor_repeated_failure":
    case "monitor_blocked":
    default:
      return {
        subject:
          reason === "repeated_failures"
            ? "Monitoring paused after repeated provider failures"
            : "Cited monitor needs attention",
        headline: "Cited monitor needs attention",
        whatHappened:
          "A monitor cannot run because of a blocking condition in your workspace.",
        safeReason:
          reason === "repeated_failures"
            ? "Repeated provider failures"
            : reason === "usage_safety_limit_reached"
              ? "Usage safety limit"
              : reason === "unsupported_surface"
                ? "Unsupported AI surface"
                : "Monitor blocked",
        nextAction: "Review monitor status and resolve the blocking condition.",
        ctaLabel: "Open Monitors",
        ctaPath: "/app/monitors",
      };
  }
}

export async function loadMonitorIssueContent(input: {
  workspaceId: string;
  notificationType: string;
  payloadSummary: Record<string, unknown>;
  manageUrl: string;
  unsubscribeUrl: string;
}): Promise<LoadedNotificationContent> {
  const admin = createAdminSupabaseClient();
  const workspaceName = await loadWorkspaceName(input.workspaceId);
  const reason = (input.payloadSummary.reason as string | null) ?? null;
  const copy = monitorCopy(input.notificationType, reason);

  const { count } = await admin
    .from("monitor_configurations")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", input.workspaceId)
    .eq("activation_status", "blocked");

  const email = renderMonitorIssueAlert({
    ...copy,
    affectedMonitorCount: count ?? null,
    workspaceName,
    manageUrl: input.manageUrl,
    unsubscribeUrl: input.unsubscribeUrl,
  });

  const slack = buildMonitorIssueSlackPayload({
    headline: copy.headline,
    safeReason: copy.safeReason,
    ctaLabel: copy.ctaLabel,
    ctaPath: copy.ctaPath,
  });

  return { email, slack };
}

export async function loadDigestContent(input: {
  workspaceId: string;
  payloadSummary: Record<string, unknown>;
  manageUrl: string;
  unsubscribeUrl: string;
}): Promise<LoadedNotificationContent> {
  const workspaceName = await loadWorkspaceName(input.workspaceId);
  const counts = (input.payloadSummary.counts as DigestCounts) ?? {
    citations: 0,
    mentions: 0,
    recommendations: 0,
    missedOpportunities: 0,
    competitorCitations: 0,
    monitorIssues: 0,
    recurringObservations: 0,
  };
  const highlights =
    (input.payloadSummary.highlights as DigestHighlight[]) ?? [];
  const isEmpty = Boolean(input.payloadSummary.isEmpty);
  const periodLabel =
    (input.payloadSummary.periodLabel as string) || "This week";

  const email = renderWeeklyDigest({
    workspaceName,
    periodLabel,
    counts,
    highlights,
    isEmpty,
    activeMonitors: input.payloadSummary.activeMonitors as number | undefined,
    blockedMonitors: input.payloadSummary.blockedMonitors as
      | number
      | undefined,
    manageUrl: input.manageUrl,
    unsubscribeUrl: input.unsubscribeUrl,
  });

  const slack = buildWeeklyDigestSlackPayload({
    counts,
    highlights,
    isEmpty,
  });

  return { email, slack };
}

export async function loadFreeScanContent(input: {
  requestId: string;
  manageUrl: string;
  unsubscribeUrl: string;
}): Promise<LoadedNotificationContent & { recipientEmail?: string }> {
  void input;
  return {
    email: { subject: "", html: "", text: "" },
    slack: null,
    canceled: true,
    cancelReason: "free_scan_unavailable",
  };
}

export async function loadNotificationContent(input: {
  workspaceId: string;
  notificationType: NotificationType | string;
  sourceEntityType: string;
  sourceEntityId: string;
  payloadSummary: Record<string, unknown>;
  manageUrl: string;
  unsubscribeUrl: string;
}): Promise<LoadedNotificationContent & { recipientEmail?: string }> {
  const type = input.notificationType;

  if (isInstantEventNotificationType(type)) {
    return loadInstantEventContent({
      workspaceId: input.workspaceId,
      notificationType: type,
      eventId: input.sourceEntityId,
      manageUrl: input.manageUrl,
      unsubscribeUrl: input.unsubscribeUrl,
    });
  }

  if (
    type === "monitor_blocked" ||
    type === "monitor_recovered" ||
    type === "monitor_repeated_failure" ||
    type === "usage_safety_limit_reached" ||
    type === "domain_verification_required"
  ) {
    return loadMonitorIssueContent({
      workspaceId: input.workspaceId,
      notificationType: type,
      payloadSummary: input.payloadSummary,
      manageUrl: input.manageUrl,
      unsubscribeUrl: input.unsubscribeUrl,
    });
  }

  if (type === "weekly_digest") {
    return loadDigestContent({
      workspaceId: input.workspaceId,
      payloadSummary: input.payloadSummary,
      manageUrl: input.manageUrl,
      unsubscribeUrl: input.unsubscribeUrl,
    });
  }

  if (type === "free_scan_result") {
    return loadFreeScanContent({
      requestId: input.sourceEntityId,
      manageUrl: input.manageUrl,
      unsubscribeUrl: input.unsubscribeUrl,
    });
  }

  if (isLifecycleNotificationType(type)) {
    return {
      email: { subject: "", html: "", text: "" },
      slack: null,
      canceled: true,
      cancelReason: "lifecycle_unavailable",
    };
  }

  // Legacy Phase 5 type
  if (type === "new_citation_event") {
    return loadInstantEventContent({
      workspaceId: input.workspaceId,
      notificationType: "new_citation",
      eventId: input.sourceEntityId,
      manageUrl: input.manageUrl,
      unsubscribeUrl: input.unsubscribeUrl,
    });
  }

  return {
    email: { subject: "", html: "", text: "" },
    slack: null,
    canceled: true,
    cancelReason: "unknown_notification_type",
  };
}
