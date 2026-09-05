export const ALLOWED_DB_TABLES = [
  "users",
  "auth_identities",
  "local_credentials",
  "workspace_invitations",
  "auth_audit_events",
  "workspaces",
  "workspace_members",
  "workspace_onboarding",
  "domains",
  "domain_aliases",
  "brands",
  "competitor_hostnames",
  "monitored_prompts",
  "ai_surfaces",
  "monitor_configurations",
  "scan_runs",
  "provider_tasks",
  "ai_responses",
  "citation_events",
  "citation_evidence",
  "citation_event_occurrences",
  "citation_event_member_states",
  "citation_annotations",
  "citation_annotation_activity",
  "notebook_entries",
  "notebook_entry_revisions",
  "notification_preferences",
  "user_notification_preferences",
  "notification_outbox",
  "notification_delivery_log",
  "notification_unsubscribe_tokens",
  "rate_limit_buckets",
  "workspace_usage",
  "billing_usage_snapshots",
  "billing_events",
  "checkout_intents",
  "free_scan_requests",
  "chatbot_leads",
  "lifecycle_email_queue",
  "lifecycle_email_log",
  "monitoring_audit_events",
  "monitoring_usage_events",
  "member_ui_preferences",
  "export_jobs",
  "learn_domains_handoffs",
  "portfolio_domain_contexts",
  "cited_schema_migrations",
] as const;

export type AllowedDbTable = (typeof ALLOWED_DB_TABLES)[number];

export function assertAllowedTable(table: string): AllowedDbTable {
  if (!(ALLOWED_DB_TABLES as readonly string[]).includes(table)) {
    throw new Error(`Table "${table}" is not allowlisted for database access.`);
  }
  return table as AllowedDbTable;
}

export const ALLOWED_DB_RPCS = [
  "release_expired_scan_run_leases",
  "claim_due_scan_runs",
  "record_monitoring_usage_event",
  "inbox_tab_counts",
  "inbox_list_events",
  "release_stale_notification_outbox_locks",
  "claim_notification_outbox",
] as const;

export type AllowedDbRpc = (typeof ALLOWED_DB_RPCS)[number];

export function assertAllowedRpc(name: string): AllowedDbRpc {
  if (!(ALLOWED_DB_RPCS as readonly string[]).includes(name)) {
    throw new Error(`RPC "${name}" is not allowlisted for database access.`);
  }
  return name as AllowedDbRpc;
}
