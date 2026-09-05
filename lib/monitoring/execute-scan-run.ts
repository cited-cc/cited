import { randomUUID } from "node:crypto";

import { canRunMonitoringForWorkspace } from "@/lib/entitlements/resolve";
import { createAdminSupabaseClient } from "@/lib/db/admin";
import { getOptionalServerEnv, isMonitoringEnabled } from "@/lib/env";
import { loadConfigSnapshot } from "@/lib/monitoring/config-snapshot";
import { persistNormalizedResult } from "@/lib/monitoring/persist-result";
import { createMonitoringProviderForSurface } from "@/lib/monitoring/factory";
import { loadCompetitorsForScan } from "@/lib/monitoring/load-competitors";
import { resolveMonitoringOperationalLimits } from "@/lib/monitoring/limits";
import { emitMonitoringEvent } from "@/lib/monitoring/observability";
import {
  buildExternalRequestKey,
  transitionScanRun,
} from "@/lib/monitoring/scan-transitions";
import { NORMALIZATION_VERSION } from "@/lib/providers/types";
import {
  calculateNextRunAt,
  computeBackoffSeconds,
} from "@/lib/monitoring/schedule";
import {
  getMonitoringSafetyLimits,
  isAiSurfaceEnabled,
} from "@/lib/monitoring/surfaces";
import {
  blockMonitorsForUsageLimit,
  evaluateWorkspaceUsageSafety,
  recordUsageEvent,
  resolveBillingPeriod,
} from "@/lib/monitoring/usage";
import type {
  NormalizedScanRequest,
  ScanRunType,
} from "@/lib/monitoring/types";
import type { Json, Tables } from "@/lib/db/types";
import type { AiSurfaceKey, MonitoringFrequency, PlanKey } from "@/types/product";
import { createMonitorIssueNotification } from "@/lib/notifications/create-event-notification";
import { logger } from "@/lib/security/logger";

type ScanRun = Tables<"scan_runs">;

export type ExecuteScanOutcome =
  | "completed"
  | "pending"
  | "failed"
  | "skipped"
  | "retried";

async function loadEligibility(scanRun: ScanRun): Promise<{
  ok: boolean;
  reason?: string;
  category?: string;
  request?: NormalizedScanRequest;
  context?: {
    domainId: string;
    brandId: string | null;
    verifiedHostname: string;
    approvedAliases: string[];
    brandNames: string[];
    competitorHostnames: string[];
    competitorBrandNames: string[];
    planKey: PlanKey;
    period: ReturnType<typeof resolveBillingPeriod>;
    frequency: MonitoringFrequency;
  };
}> {
  const admin = createAdminSupabaseClient();
  const env = getOptionalServerEnv();

  if (!isMonitoringEnabled(env)) {
    return {
      ok: false,
      reason: "monitoring_disabled",
      category: "monitoring_disabled",
    };
  }

  const { data: workspace } = await admin
    .from("workspaces")
    .select(
      "id, plan_key, status, billing_status, cancel_at_period_end, current_period_start, current_period_end, billing_grace_until, onboarding_completed_at",
    )
    .eq("id", scanRun.workspace_id)
    .maybeSingle();

  if (!workspace) {
    return {
      ok: false,
      reason: "billing_inactive",
      category: "billing_inactive",
    };
  }

  if (
    !canRunMonitoringForWorkspace({
      workspaceId: workspace.id as string,
      planKey: workspace.plan_key as PlanKey,
      status: workspace.status as
        | "active"
        | "trialing"
        | "past_due"
        | "canceled"
        | "suspended",
      billingStatus: workspace.billing_status as
        | "active"
        | "trialing"
        | "past_due"
        | "unpaid"
        | "canceled"
        | "incomplete"
        | "incomplete_expired"
        | "paused"
        | "suspended"
        | "unknown"
        | null,
      cancelAtPeriodEnd: Boolean(workspace.cancel_at_period_end),
      currentPeriodEnd: workspace.current_period_end as string | null,
      billingGraceUntil: workspace.billing_grace_until as string | null,
    })
  ) {
    return {
      ok: false,
      reason: "billing_inactive",
      category: "billing_inactive",
    };
  }

  const { data: config } = await admin
    .from("monitor_configurations")
    .select(
      "id, activation_status, enabled, ai_surface, country_code, city, locale, scan_frequency, monitored_prompt_id, failure_streak",
    )
    .eq("id", scanRun.monitor_configuration_id)
    .eq("workspace_id", scanRun.workspace_id)
    .maybeSingle();

  if (!config || !config.enabled || config.activation_status !== "active") {
    return {
      ok: false,
      reason: "monitor_not_eligible",
      category: "monitor_not_eligible",
    };
  }

  const surface = config.ai_surface as AiSurfaceKey;
  if (!isAiSurfaceEnabled(surface)) {
    return {
      ok: false,
      reason: "unsupported_surface",
      category: "unsupported_surface",
    };
  }

  const { data: prompt } = await admin
    .from("monitored_prompts")
    .select(
      "id, prompt_text, domain_id, language_code, country_code, city, active",
    )
    .eq("id", config.monitored_prompt_id as string)
    .eq("workspace_id", scanRun.workspace_id)
    .maybeSingle();

  if (!prompt || prompt.active === false) {
    return {
      ok: false,
      reason: "monitor_not_eligible",
      category: "monitor_not_eligible",
    };
  }

  const { data: domain } = await admin
    .from("domains")
    .select("id, normalized_hostname, verification_status")
    .eq("id", prompt.domain_id as string)
    .eq("workspace_id", scanRun.workspace_id)
    .maybeSingle();

  if (!domain || domain.verification_status !== "verified") {
    return {
      ok: false,
      reason: "domain_unverified",
      category: "domain_unverified",
    };
  }

  const usage = await evaluateWorkspaceUsageSafety({
    workspaceId: scanRun.workspace_id,
    planKey: workspace.plan_key as PlanKey,
    currentPeriodStart: workspace.current_period_start,
    currentPeriodEnd: workspace.current_period_end,
  });
  if (usage.exceeded) {
    await blockMonitorsForUsageLimit({ workspaceId: scanRun.workspace_id });
    return {
      ok: false,
      reason: "usage_limit_reached",
      category: "usage_limit_reached",
    };
  }

  const { data: aliases } = await admin
    .from("domain_aliases")
    .select("normalized_hostname")
    .eq("domain_id", domain.id as string);

  const { data: brands } = await admin
    .from("brands")
    .select("id, name, alternate_names")
    .eq("workspace_id", scanRun.workspace_id);

  const brandNames: string[] = [];
  let brandId: string | null = null;
  for (const brand of brands ?? []) {
    if (!brandId) brandId = brand.id as string;
    brandNames.push(brand.name as string);
    for (const alt of (brand.alternate_names as string[] | null) ?? []) {
      brandNames.push(alt);
    }
  }

  const approvedAliases = (aliases ?? []).map(
    (a) => a.normalized_hostname as string,
  );
  const verifiedHostname = domain.normalized_hostname as string;

  let competitorHostnames: string[] = [];
  let competitorBrandNames: string[] = [];

  if (scanRun.config_snapshot_id) {
    const snapshot = await loadConfigSnapshot(
      scanRun.config_snapshot_id as string,
      scanRun.workspace_id as string,
    );
    if (snapshot) {
      competitorHostnames = snapshot.configuration.competitorHostnames;
      competitorBrandNames = snapshot.configuration.competitorBrandNames;
    }
  }

  if (competitorHostnames.length === 0) {
    const loaded = await loadCompetitorsForScan({
      workspaceId: scanRun.workspace_id as string,
      domainId: domain.id as string,
      monitorConfigurationId: config.id as string,
      verifiedHostname,
      approvedAliases,
      workspaceEntitlements: {
        workspaceId: workspace.id as string,
        planKey: workspace.plan_key as PlanKey,
        status: workspace.status as
          | "active"
          | "trialing"
          | "past_due"
          | "canceled"
          | "suspended",
        billingStatus: workspace.billing_status as
          | "active"
          | "trialing"
          | "past_due"
          | "unpaid"
          | "canceled"
          | "incomplete"
          | "incomplete_expired"
          | "paused"
          | "suspended"
          | "unknown"
          | null,
        cancelAtPeriodEnd: Boolean(workspace.cancel_at_period_end),
        currentPeriodEnd: workspace.current_period_end as string | null,
        billingGraceUntil: workspace.billing_grace_until as string | null,
      },
    });
    competitorHostnames = loaded.hostnames;
    competitorBrandNames = loaded.brandNames;
  }

  const languageCode =
    (prompt.language_code as string | null)?.toLowerCase() ||
    (config.locale as string | null)?.split("-")[0]?.toLowerCase() ||
    "en";
  const countryCode =
    (config.country_code as string | null)?.toUpperCase() ||
    (prompt.country_code as string | null)?.toUpperCase() ||
    "US";
  const city =
    (config.city as string | null) || (prompt.city as string | null) || null;

  const correlationId =
    (scanRun.correlation_id as string | null) ||
    (scanRun.idempotency_key as string | null) ||
    randomUUID();

  const request: NormalizedScanRequest = {
    scanRunId: scanRun.id as string,
    workspaceId: scanRun.workspace_id as string,
    domainId: domain.id as string,
    monitoredPromptId: prompt.id as string,
    monitorConfigurationId: config.id as string,
    prompt: prompt.prompt_text as string,
    aiSurface: surface,
    languageCode,
    countryCode,
    city,
    scheduledFor: new Date(scanRun.scheduled_for as string),
    runType: (scanRun.run_type as ScanRunType) || "recurring",
    correlationId,
  };

  return {
    ok: true,
    request,
    context: {
      domainId: domain.id as string,
      brandId,
      verifiedHostname,
      approvedAliases,
      brandNames,
      competitorHostnames,
      competitorBrandNames,
      planKey: workspace.plan_key as PlanKey,
      period: usage.period,
      frequency:
        (config.scan_frequency as MonitoringFrequency) || "twice_weekly",
    },
  };
}

async function markRunFailed(input: {
  scanRun: ScanRun;
  category: string;
  safeMessage: string;
  retryable: boolean;
  providerStatusCode?: number | null;
}): Promise<"failed" | "retried"> {
  const admin = createAdminSupabaseClient();
  const operationalLimits = resolveMonitoringOperationalLimits();
  const maxAttempts = operationalLimits.maxScanAttempts;
  const attemptCount = Number(input.scanRun.attempt_count ?? 1);

  if (input.retryable && attemptCount < maxAttempts) {
    const delay = computeBackoffSeconds(attemptCount);
    const nextAttempt = new Date(Date.now() + delay * 1000);
    await admin
      .from("scan_runs")
      .update({
        status: "queued",
        phase: "retry_scheduled",
        next_attempt_at: nextAttempt.toISOString(),
        claimed_at: null,
        claimed_by: null,
        lease_expires_at: null,
        next_poll_at: null,
        provider_error_category: input.category,
        provider_status_code: input.providerStatusCode ?? null,
        failure_code: input.category,
        failure_message: input.safeMessage,
        last_transition_at: new Date().toISOString(),
        last_transition_reason: "retry_scheduled",
      })
      .eq("id", input.scanRun.id as string);

    emitMonitoringEvent({
      event: "monitoring.scan.retry_scheduled",
      scanRunId: input.scanRun.id as string,
      workspaceId: input.scanRun.workspace_id as string,
      monitorConfigurationId: input.scanRun.monitor_configuration_id as string,
      attemptNumber: attemptCount,
      errorCode: input.category,
      correlationId: input.scanRun.correlation_id ?? undefined,
    });

    await admin.from("monitoring_audit_events").insert({
      workspace_id: input.scanRun.workspace_id,
      monitor_configuration_id: input.scanRun.monitor_configuration_id,
      scan_run_id: input.scanRun.id,
      event_name: "scan_retried",
      safe_metadata: {
        attemptCount,
        delaySeconds: delay,
        category: input.category,
      },
    });
    return "retried";
  }

  await admin
    .from("scan_runs")
    .update({
      status: "failed",
      phase: "failed",
      completed_at: new Date().toISOString(),
      claimed_at: null,
      claimed_by: null,
      lease_expires_at: null,
      next_poll_at: null,
      provider_error_category: input.category,
      provider_status_code: input.providerStatusCode ?? null,
      failure_code: input.category,
      failure_message: input.safeMessage,
      last_transition_at: new Date().toISOString(),
      last_transition_reason: "permanent_failure",
    })
    .eq("id", input.scanRun.id as string);

  emitMonitoringEvent({
    event: "monitoring.scan.failed",
    scanRunId: input.scanRun.id as string,
    workspaceId: input.scanRun.workspace_id as string,
    monitorConfigurationId: input.scanRun.monitor_configuration_id as string,
    errorCode: input.category,
    correlationId: input.scanRun.correlation_id ?? undefined,
  });

  const { data: config } = await admin
    .from("monitor_configurations")
    .select("failure_streak")
    .eq("id", input.scanRun.monitor_configuration_id)
    .maybeSingle();

  const streak = Number(config?.failure_streak ?? 0) + 1;
  const { data: workspace } = await admin
    .from("workspaces")
    .select("plan_key")
    .eq("id", input.scanRun.workspace_id)
    .maybeSingle();
  const limits = getMonitoringSafetyLimits(
    (workspace?.plan_key as PlanKey) || "founder",
  );

  const shouldBlock = streak >= limits.maxConsecutiveFailuresBeforeBlock;
  await admin
    .from("monitor_configurations")
    .update({
      failure_streak: streak,
      last_failure_at: new Date().toISOString(),
      ...(shouldBlock
        ? {
            activation_status: "blocked",
            pause_reason: "repeated_failures",
            paused_at: new Date().toISOString(),
          }
        : {}),
    })
    .eq("id", input.scanRun.monitor_configuration_id);

  await admin.from("monitoring_audit_events").insert({
    workspace_id: input.scanRun.workspace_id,
    monitor_configuration_id: input.scanRun.monitor_configuration_id,
    scan_run_id: input.scanRun.id,
    event_name: shouldBlock ? "monitor_blocked" : "scan_failed",
    safe_metadata: { category: input.category, streak },
  });

  if (shouldBlock) {
    await createMonitorIssueNotification({
      workspaceId: input.scanRun.workspace_id as string,
      notificationType: "monitor_blocked",
      monitorIdOrGroup: input.scanRun.monitor_configuration_id as string,
      issueFingerprint: `repeated_failures:${input.scanRun.monitor_configuration_id}`,
      reason: "repeated_failures",
      priority: "high",
    });
  }

  return "failed";
}

async function advanceMonitorSchedule(input: {
  monitorConfigurationId: string;
  workspaceId: string;
  frequency: MonitoringFrequency;
  now: Date;
}): Promise<void> {
  const admin = createAdminSupabaseClient();
  const nextRunAt = calculateNextRunAt({
    monitorConfigurationId: input.monitorConfigurationId,
    cadence: input.frequency === "manual" ? "twice_weekly" : input.frequency,
    from: input.now,
  });
  await admin
    .from("monitor_configurations")
    .update({
      last_run_at: input.now.toISOString(),
      last_successful_run_at: input.now.toISOString(),
      next_run_at: nextRunAt.toISOString(),
      failure_streak: 0,
    })
    .eq("id", input.monitorConfigurationId)
    .eq("workspace_id", input.workspaceId);
}

/**
 * Execute a claimed scan run: submit or poll provider, persist evidence.
 */
export async function executeScanRun(
  scanRun: ScanRun,
): Promise<ExecuteScanOutcome> {
  const admin = createAdminSupabaseClient();
  const operationalLimits = resolveMonitoringOperationalLimits();
  const started = Date.now();

  if (scanRun.status === "completed" || scanRun.completed_at) {
    return "skipped";
  }

  const eligibility = await loadEligibility(scanRun);
  if (!eligibility.ok || !eligibility.request || !eligibility.context) {
    await markRunFailed({
      scanRun,
      category: eligibility.category ?? "monitor_not_eligible",
      safeMessage: "This monitor is not eligible to run.",
      retryable: false,
    });
    return "failed";
  }

  const { request, context } = eligibility;

  if (scanRun.next_poll_at && scanRun.provider_task_id) {
    const maxPolls = operationalLimits.maxPollAttempts;
    const pollAttempts = Number(scanRun.poll_attempt_count ?? 0) + 1;
    if (pollAttempts > maxPolls) {
      await markRunFailed({
        scanRun,
        category: "max_poll_attempts",
        safeMessage:
          "Cited stopped waiting for a provider result after too many polls.",
        retryable: false,
      });
      return "failed";
    }

    const provider = createMonitoringProviderForSurface(request);
    if (!provider.pollTask) {
      await markRunFailed({
        scanRun,
        category: "provider_validation_error",
        safeMessage: "This provider path does not support polling.",
        retryable: false,
      });
      return "failed";
    }

    const polled = await provider.pollTask({
      providerTaskId: scanRun.provider_task_id as string,
      request,
    });

    await admin
      .from("scan_runs")
      .update({ poll_attempt_count: pollAttempts })
      .eq("id", scanRun.id as string);

    await admin.from("monitoring_audit_events").insert({
      workspace_id: scanRun.workspace_id,
      monitor_configuration_id: scanRun.monitor_configuration_id,
      scan_run_id: scanRun.id,
      event_name: "provider_polled",
      safe_metadata: { pollAttempts, status: polled.status },
    });

    if (polled.status === "pending") {
      await transitionScanRun({
        scanRun,
        toPhase: "provider_pending",
        reason: "provider_pending",
        expectedStatus: "running",
        patch: {
          next_poll_at: new Date(
            Date.now() + polled.pollAfterSeconds * 1000,
          ).toISOString(),
          claimed_at: null,
          claimed_by: null,
          lease_expires_at: null,
        },
      });
      emitMonitoringEvent({
        event: "monitoring.provider.pending",
        scanRunId: request.scanRunId,
        workspaceId: request.workspaceId,
        monitorConfigurationId: request.monitorConfigurationId,
        aiSurface: request.aiSurface,
        attemptNumber: pollAttempts,
        correlationId: request.correlationId,
      });
      return "pending";
    }

    if (polled.status === "failed") {
      return markRunFailed({
        scanRun,
        category: String(polled.code),
        safeMessage: polled.safeMessage,
        retryable: polled.retryable,
        providerStatusCode: polled.providerStatusCode,
      });
    }

    await persistNormalizedResult({
      workspaceId: request.workspaceId,
      scanRunId: request.scanRunId,
      monitorConfigurationId: request.monitorConfigurationId,
      domainId: context.domainId,
      brandId: context.brandId,
      aiSurface: request.aiSurface,
      runType: request.runType,
      verifiedHostname: context.verifiedHostname,
      approvedAliases: context.approvedAliases,
      brandNames: context.brandNames,
      competitorHostnames: context.competitorHostnames,
      result: polled.result,
      period: context.period,
      correlationId: request.correlationId,
    });
    await advanceMonitorSchedule({
      monitorConfigurationId: request.monitorConfigurationId,
      workspaceId: request.workspaceId,
      frequency: context.frequency,
      now: new Date(),
    });
    return "completed";
  }

  const { data: existingTask } = await admin
    .from("provider_tasks")
    .select("id, provider_task_id, status")
    .eq("scan_run_id", scanRun.id as string)
    .maybeSingle();

  if (existingTask?.provider_task_id && existingTask.status === "pending") {
    await admin
      .from("scan_runs")
      .update({
        provider_task_id: existingTask.provider_task_id,
        next_poll_at: new Date(Date.now() + 15_000).toISOString(),
        claimed_at: null,
        claimed_by: null,
        lease_expires_at: null,
      })
      .eq("id", scanRun.id as string);
    return "pending";
  }

  if (existingTask?.status === "completed") {
    return "skipped";
  }

  const provider = createMonitoringProviderForSurface(request);
  const externalRequestKey = buildExternalRequestKey({
    scanRunId: request.scanRunId,
    attemptCount: Number(scanRun.attempt_count ?? 0),
  });

  await admin.from("provider_tasks").upsert(
    {
      scan_run_id: request.scanRunId,
      workspace_id: request.workspaceId,
      provider: provider.metadata.id,
      provider_task_id: externalRequestKey,
      status: "submitted",
      submission_state: "intent",
      external_request_key: externalRequestKey,
      submission_intent_at: new Date().toISOString(),
      adapter_version: provider.metadata.adapterVersion,
      normalization_version: NORMALIZATION_VERSION,
      attempt_count: Number(scanRun.attempt_count ?? 0),
      metadata: { externalRequestKey },
    },
    { onConflict: "scan_run_id" },
  );

  await transitionScanRun({
    scanRun,
    toPhase: "submitting",
    reason: "provider_submitted",
    expectedStatus: "running",
  });

  const submitted = await provider.submitScan(request);

  await recordUsageEvent({
    workspaceId: request.workspaceId,
    scanRunId: request.scanRunId,
    metricKey: "provider_task_submitted",
    quantity: 1,
    period: context.period,
  });

  emitMonitoringEvent({
    event: "monitoring.provider.submitted",
    scanRunId: request.scanRunId,
    workspaceId: request.workspaceId,
    monitorConfigurationId: request.monitorConfigurationId,
    aiSurface: request.aiSurface,
    providerId: provider.metadata.id,
    attemptNumber: Number(scanRun.attempt_count ?? 0),
    durationMs: Date.now() - started,
    correlationId: request.correlationId,
  });

  if (submitted.status === "failed") {
    return markRunFailed({
      scanRun,
      category: String(submitted.code),
      safeMessage: submitted.safeMessage,
      retryable: submitted.retryable,
      providerStatusCode: submitted.providerStatusCode,
    });
  }

  if (submitted.status === "pending") {
    await admin.from("provider_tasks").upsert(
      {
        scan_run_id: request.scanRunId,
        workspace_id: request.workspaceId,
        provider: provider.metadata.id,
        provider_task_id: submitted.providerTaskId,
        status: "pending",
        submission_state: "accepted",
        external_request_key: externalRequestKey,
        adapter_version: provider.metadata.adapterVersion,
        normalization_version: NORMALIZATION_VERSION,
        attempt_count: Number(scanRun.attempt_count ?? 0),
        next_poll_at: new Date(
          Date.now() + submitted.pollAfterSeconds * 1000,
        ).toISOString(),
        metadata: (submitted.providerMetadata ?? {}) as Json,
      },
      { onConflict: "scan_run_id" },
    );

    await transitionScanRun({
      scanRun,
      toPhase: "provider_pending",
      reason: "provider_pending",
      expectedStatus: "running",
      patch: {
        provider_task_id: submitted.providerTaskId,
        next_poll_at: new Date(
          Date.now() + submitted.pollAfterSeconds * 1000,
        ).toISOString(),
        claimed_at: null,
        claimed_by: null,
        lease_expires_at: null,
      },
    });

    return "pending";
  }

  await admin.from("provider_tasks").upsert(
    {
      scan_run_id: request.scanRunId,
      workspace_id: request.workspaceId,
      provider: provider.metadata.id,
      provider_task_id: submitted.result.providerTaskId ?? externalRequestKey,
      status: "completed",
      submission_state: "accepted",
      external_request_key: externalRequestKey,
      completed_at: new Date().toISOString(),
      adapter_version: provider.metadata.adapterVersion,
      normalization_version: NORMALIZATION_VERSION,
      attempt_count: Number(scanRun.attempt_count ?? 0),
      provider_usage: {
        providerCostUsd: submitted.result.providerCostUsd ?? null,
        providerCostType: submitted.result.providerCostType,
      } as Json,
      metadata: { live: true },
    },
    { onConflict: "scan_run_id" },
  );

  try {
    await transitionScanRun({
      scanRun,
      toPhase: "processing",
      reason: "persist_started",
      expectedStatus: "running",
    });

    await persistNormalizedResult({
      workspaceId: request.workspaceId,
      scanRunId: request.scanRunId,
      monitorConfigurationId: request.monitorConfigurationId,
      domainId: context.domainId,
      brandId: context.brandId,
      aiSurface: request.aiSurface,
      runType: request.runType,
      verifiedHostname: context.verifiedHostname,
      approvedAliases: context.approvedAliases,
      brandNames: context.brandNames,
      competitorHostnames: context.competitorHostnames,
      result: submitted.result,
      period: context.period,
      correlationId: request.correlationId,
    });

    emitMonitoringEvent({
      event: "monitoring.evidence.persisted",
      scanRunId: request.scanRunId,
      workspaceId: request.workspaceId,
      monitorConfigurationId: request.monitorConfigurationId,
      aiSurface: request.aiSurface,
      providerId: provider.metadata.id,
      correlationId: request.correlationId,
    });

    emitMonitoringEvent({
      event: "monitoring.provider.completed",
      scanRunId: request.scanRunId,
      workspaceId: request.workspaceId,
      monitorConfigurationId: request.monitorConfigurationId,
      aiSurface: request.aiSurface,
      providerId: provider.metadata.id,
      durationMs: Date.now() - started,
      correlationId: request.correlationId,
    });
  } catch (error) {
    logger.error("Persist failed after provider success", {
      event: "monitoring.execute.persist_failed",
      scanRunId: request.scanRunId,
      workspaceId: request.workspaceId,
      correlationId: request.correlationId,
      errorCategory: "internal_persistence_error",
    });
    void error;
    return markRunFailed({
      scanRun,
      category: "internal_persistence_error",
      safeMessage: "Cited could not save monitoring results.",
      retryable: true,
    });
  }

  await advanceMonitorSchedule({
    monitorConfigurationId: request.monitorConfigurationId,
    workspaceId: request.workspaceId,
    frequency: context.frequency,
    now: new Date(),
  });

  logger.info("Scan run executed", {
    event: "monitoring.execute.completed",
    scanRunId: request.scanRunId,
    workspaceId: request.workspaceId,
    monitorConfigurationId: request.monitorConfigurationId,
    aiSurface: request.aiSurface,
    provider: provider.metadata.id,
    status: "completed",
    attemptCount: scanRun.attempt_count,
    durationMs: Date.now() - started,
    correlationId: request.correlationId,
  });

  return "completed";
}
