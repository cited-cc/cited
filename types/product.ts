/**
 * Cited product taxonomy and truthful language constants.
 *
 * Citation:
 * A monitored AI response includes a source URL, linked reference, citation card,
 * source domain, or explicit reference whose normalized hostname matches the
 * customer's verified domain or approved domain alias.
 *
 * Mention:
 * The AI response includes the customer's brand name, product name, or domain text,
 * but there is no attributable source URL or citation reference matching the
 * verified domain.
 *
 * Recommendation:
 * The AI response explicitly recommends the product, brand, or domain in answer
 * to a monitored prompt.
 *
 * Competitor Citation:
 * A monitored AI response cites or recommends a configured competitor domain.
 *
 * Missed Opportunity:
 * A monitored prompt returns a relevant AI response, but the customer's verified
 * domain is absent while one or more competitor domains appear.
 */

export const CITATION_EVENT_TYPES = [
  "citation",
  "mention",
  "recommendation",
  "competitor_citation",
  "missed_opportunity",
] as const;

export type CitationEventType = (typeof CITATION_EVENT_TYPES)[number];

export const CITATION_EVENT_STATUSES = [
  "new",
  "seen",
  "saved",
  "archived",
  "resolved",
] as const;

export type CitationEventStatus = (typeof CITATION_EVENT_STATUSES)[number];

export const CITATION_EVIDENCE_TYPES = [
  "source_link",
  "response_excerpt",
  "brand_match",
  "domain_match",
  "recommendation_excerpt",
  "competitor_match",
] as const;

export type CitationEvidenceType = (typeof CITATION_EVIDENCE_TYPES)[number];

export const WORKSPACE_STATUSES = [
  "active",
  "trialing",
  "past_due",
  "canceled",
  "suspended",
] as const;

export type WorkspaceStatus = (typeof WORKSPACE_STATUSES)[number];

export const PLAN_KEYS = [
  "free",
  "founder",
  "growth",
  "pro",
  "portfolio",
  "enterprise",
] as const;

export type PlanKey = (typeof PLAN_KEYS)[number];

export const WORKSPACE_ROLES = [
  "owner",
  "admin",
  "member",
  "viewer",
] as const;

export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

export const DOMAIN_VERIFICATION_STATUSES = [
  "pending",
  "verified",
  "failed",
  "disabled",
] as const;

export type DomainVerificationStatus =
  (typeof DOMAIN_VERIFICATION_STATUSES)[number];

export const DOMAIN_VERIFICATION_METHODS = [
  "dns_txt",
  "meta_tag",
  "file_upload",
  "manual",
] as const;

export type DomainVerificationMethod =
  (typeof DOMAIN_VERIFICATION_METHODS)[number];

export const DOMAIN_ALIAS_TYPES = [
  "www_variant",
  "subdomain",
  "redirected_domain",
  "brand_domain",
  "manual",
] as const;

export type DomainAliasType = (typeof DOMAIN_ALIAS_TYPES)[number];

export const MONITORING_FREQUENCIES = [
  "twice_weekly",
  "weekly",
  "daily",
  "manual",
] as const;

export type MonitoringFrequency = (typeof MONITORING_FREQUENCIES)[number];

export const PROMPT_PRIORITIES = [
  "low",
  "normal",
  "high",
  "critical",
] as const;

export type PromptPriority = (typeof PROMPT_PRIORITIES)[number];

export const AI_SURFACE_KEYS = [
  "chatgpt",
  "gemini",
  "google_ai_overviews",
  "google_ai_mode",
  "perplexity",
  "claude",
] as const;

export type AiSurfaceKey = (typeof AI_SURFACE_KEYS)[number];

export const SCAN_RUN_STATUSES = [
  "queued",
  "running",
  "completed",
  "partial",
  "failed",
  "canceled",
] as const;

export type ScanRunStatus = (typeof SCAN_RUN_STATUSES)[number];

export const USAGE_METRIC_KEYS = [
  "domains",
  "active_prompts",
  "active_monitors",
  "monthly_scans",
  "team_members",
  "notebook_entries",
] as const;

export type UsageMetricKey = (typeof USAGE_METRIC_KEYS)[number];

export const NOTEBOOK_BODY_FORMATS = ["plain_text"] as const;
export type NotebookBodyFormat = (typeof NOTEBOOK_BODY_FORMATS)[number];

export const NOTEBOOK_VISIBILITIES = ["workspace", "private"] as const;
export type NotebookVisibility = (typeof NOTEBOOK_VISIBILITIES)[number];

export const CITATION_ANNOTATION_TARGET_KINDS = [
  "event",
  "response",
  "evidence",
] as const;
export type CitationAnnotationTargetKind =
  (typeof CITATION_ANNOTATION_TARGET_KINDS)[number];

export const CITATION_ANNOTATION_VISIBILITIES = [
  "workspace",
  "private",
] as const;
export type CitationAnnotationVisibility =
  (typeof CITATION_ANNOTATION_VISIBILITIES)[number];

export const CITATION_ANNOTATION_ACTIVITY_ACTIONS = [
  "created",
  "edited",
  "resolved",
  "reopened",
  "deleted",
  "restored",
] as const;
export type CitationAnnotationActivityAction =
  (typeof CITATION_ANNOTATION_ACTIVITY_ACTIONS)[number];

/**
 * Approved customer-facing framing for Cited monitoring.
 * Never imply Cited sees every AI conversation in the world.
 */
export const APPROVED_PRODUCT_LANGUAGE = {
  corePromise: "Know when AI cites you.",
  monitoringFrame:
    "Cited checks the prompts, models, locations, and schedules you choose, then alerts you when your verified domain appears in a monitored response.",
  productThesis:
    "A quiet, beautiful citation inbox for the moments AI makes your brand part of the answer.",
  signalLayer:
    "Cited is the signal layer. Learn Domains helps customers act on missed citations.",
} as const;

export const DISALLOWED_PRODUCT_LANGUAGE = [
  "Get notified every time anyone cites you",
  "Track every AI mention",
  "See all AI conversations",
  "Monitor every LLM response",
] as const;
