type FreeScanStatus = "pending" | "running" | "completed" | "failed" | "expired";
import type {
  AiSurfaceKey,
  CitationAnnotationActivityAction,
  CitationAnnotationTargetKind,
  CitationAnnotationVisibility,
  CitationEventStatus,
  CitationEventType,
  CitationEvidenceType,
  DomainAliasType,
  DomainVerificationMethod,
  DomainVerificationStatus,
  MonitoringFrequency,
  NotebookBodyFormat,
  NotebookVisibility,
  PlanKey,
  PromptPriority,
  ScanRunStatus,
  UsageMetricKey,
  WorkspaceRole,
  WorkspaceStatus,
} from "@/types/product";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string;
          name: string;
          slug: string;
          owner_clerk_user_id: string;
          owner_user_id: string | null;
          plan_key: PlanKey;
          status: WorkspaceStatus;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          stripe_subscription_item_id: string | null;
          stripe_price_id_snapshot: string | null;
          billing_status:
            | "active"
            | "trialing"
            | "past_due"
            | "unpaid"
            | "canceled"
            | "incomplete"
            | "incomplete_expired"
            | "paused"
            | "suspended"
            | "unknown";
          cancel_at_period_end: boolean;
          canceled_at: string | null;
          current_period_start: string | null;
          current_period_end: string | null;
          trial_start: string | null;
          trial_end: string | null;
          billing_grace_until: string | null;
          billing_last_synced_at: string | null;
          billing_sync_error_code: string | null;
          billing_sync_error_at: string | null;
          billing_updated_at: string | null;
          onboarding_completed_at: string | null;
          portfolio_extra_domains: number;
          stripe_portfolio_extra_domain_item_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          owner_clerk_user_id: string;
          owner_user_id?: string | null;
          plan_key?: PlanKey;
          status?: WorkspaceStatus;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          stripe_subscription_item_id?: string | null;
          stripe_price_id_snapshot?: string | null;
          billing_status?:
            | "active"
            | "trialing"
            | "past_due"
            | "unpaid"
            | "canceled"
            | "incomplete"
            | "incomplete_expired"
            | "paused"
            | "suspended"
            | "unknown";
          cancel_at_period_end?: boolean;
          canceled_at?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          trial_start?: string | null;
          trial_end?: string | null;
          billing_grace_until?: string | null;
          billing_last_synced_at?: string | null;
          billing_sync_error_code?: string | null;
          billing_sync_error_at?: string | null;
          billing_updated_at?: string | null;
          onboarding_completed_at?: string | null;
          portfolio_extra_domains?: number;
          stripe_portfolio_extra_domain_item_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["workspaces"]["Insert"]>;
        Relationships: [];
      };
      workspace_members: {
        Row: {
          id: string;
          workspace_id: string;
          clerk_user_id: string;
          user_id: string | null;
          role: WorkspaceRole;
          active_domain_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          clerk_user_id: string;
          user_id?: string | null;
          role?: WorkspaceRole;
          active_domain_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["workspace_members"]["Insert"]
        >;
        Relationships: [];
      };
      domains: {
        Row: {
          id: string;
          workspace_id: string;
          hostname: string;
          normalized_hostname: string;
          display_name: string | null;
          verification_status: DomainVerificationStatus;
          verification_method: DomainVerificationMethod | null;
          verification_token: string | null;
          verification_token_rotated_at: string | null;
          verification_attempt_count: number;
          last_verification_error_code: string | null;
          verified_at: string | null;
          last_checked_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          hostname: string;
          normalized_hostname: string;
          display_name?: string | null;
          verification_status?: DomainVerificationStatus;
          verification_method?: DomainVerificationMethod | null;
          verification_token?: string | null;
          verification_token_rotated_at?: string | null;
          verification_attempt_count?: number;
          last_verification_error_code?: string | null;
          verified_at?: string | null;
          last_checked_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["domains"]["Insert"]>;
        Relationships: [];
      };
      domain_aliases: {
        Row: {
          id: string;
          domain_id: string;
          hostname: string;
          normalized_hostname: string;
          alias_type: DomainAliasType;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          domain_id: string;
          hostname: string;
          normalized_hostname: string;
          alias_type?: DomainAliasType;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["domain_aliases"]["Insert"]
        >;
        Relationships: [];
      };
      brands: {
        Row: {
          id: string;
          workspace_id: string;
          primary_domain_id: string | null;
          name: string;
          normalized_name: string;
          alternate_names: string[];
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          primary_domain_id?: string | null;
          name: string;
          normalized_name: string;
          alternate_names?: string[];
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["brands"]["Insert"]>;
        Relationships: [];
      };
      competitor_hostnames: {
        Row: {
          id: string;
          workspace_id: string;
          domain_id: string | null;
          monitor_configuration_id: string | null;
          normalized_hostname: string;
          display_hostname: string | null;
          brand_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          domain_id?: string | null;
          monitor_configuration_id?: string | null;
          normalized_hostname: string;
          display_hostname?: string | null;
          brand_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["competitor_hostnames"]["Insert"]
        >;
        Relationships: [];
      };
      monitored_prompts: {
        Row: {
          id: string;
          workspace_id: string;
          domain_id: string;
          name: string;
          prompt_text: string;
          normalized_prompt: string;
          locale: string | null;
          language_code: string | null;
          country_code: string | null;
          city: string | null;
          active: boolean;
          monitoring_frequency: MonitoringFrequency;
          priority: PromptPriority;
          setup_status: "draft" | "configured";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          domain_id: string;
          name: string;
          prompt_text: string;
          normalized_prompt: string;
          locale?: string | null;
          language_code?: string | null;
          country_code?: string | null;
          city?: string | null;
          active?: boolean;
          monitoring_frequency?: MonitoringFrequency;
          priority?: PromptPriority;
          setup_status?: "draft" | "configured";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["monitored_prompts"]["Insert"]
        >;
        Relationships: [];
      };
      ai_surfaces: {
        Row: {
          key: AiSurfaceKey;
          display_name: string;
          category: string;
          supports_citations: boolean;
          supports_mentions: boolean;
          supports_location: boolean;
          supports_scheduled_monitoring: boolean;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          key: AiSurfaceKey;
          display_name: string;
          category: string;
          supports_citations?: boolean;
          supports_mentions?: boolean;
          supports_location?: boolean;
          supports_scheduled_monitoring?: boolean;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ai_surfaces"]["Insert"]>;
        Relationships: [];
      };
      monitor_configurations: {
        Row: {
          id: string;
          workspace_id: string;
          monitored_prompt_id: string;
          ai_surface: AiSurfaceKey;
          enabled: boolean;
          scan_frequency: MonitoringFrequency;
          locale: string | null;
          country_code: string | null;
          city: string | null;
          configured_at: string | null;
          activation_status:
            | "configured"
            | "paused"
            | "active"
            | "blocked"
            | "disabled";
          next_run_at: string | null;
          last_run_at: string | null;
          last_successful_run_at: string | null;
          last_failure_at: string | null;
          failure_streak: number;
          paused_at: string | null;
          pause_reason: string | null;
          activated_at: string | null;
          schedule_version: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          monitored_prompt_id: string;
          ai_surface: AiSurfaceKey;
          enabled?: boolean;
          scan_frequency?: MonitoringFrequency;
          locale?: string | null;
          country_code?: string | null;
          city?: string | null;
          configured_at?: string | null;
          activation_status?:
            | "configured"
            | "paused"
            | "active"
            | "blocked"
            | "disabled";
          next_run_at?: string | null;
          last_run_at?: string | null;
          last_successful_run_at?: string | null;
          last_failure_at?: string | null;
          failure_streak?: number;
          paused_at?: string | null;
          pause_reason?: string | null;
          activated_at?: string | null;
          schedule_version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["monitor_configurations"]["Insert"]
        >;
        Relationships: [];
      };
      monitor_config_snapshots: {
        Row: {
          id: string;
          workspace_id: string;
          monitor_configuration_id: string;
          version: number;
          classification_version: string;
          configuration: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          monitor_configuration_id: string;
          version: number;
          classification_version: string;
          configuration: Json;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["monitor_config_snapshots"]["Insert"]
        >;
        Relationships: [];
      };
      scan_runs: {
        Row: {
          id: string;
          workspace_id: string;
          monitor_configuration_id: string;
          status: ScanRunStatus;
          requested_at: string;
          started_at: string | null;
          completed_at: string | null;
          provider: string;
          provider_task_id: string | null;
          provider_cost_usd: number | null;
          response_hash: string | null;
          failure_code: string | null;
          failure_message: string | null;
          metadata: Json;
          scheduled_for: string;
          run_type: "baseline" | "recurring" | "manual";
          attempt_count: number;
          poll_attempt_count: number;
          next_attempt_at: string | null;
          next_poll_at: string | null;
          claimed_at: string | null;
          claimed_by: string | null;
          lease_expires_at: string | null;
          completed_with_warnings: boolean;
          provider_cost_type: "actual" | "estimated" | "unknown" | null;
          provider_error_category: string | null;
          provider_status_code: number | null;
          result_summary: Json;
          correlation_id: string | null;
          idempotency_key: string | null;
          config_snapshot_id: string | null;
          phase: string | null;
          last_transition_at: string | null;
          last_transition_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          monitor_configuration_id: string;
          status?: ScanRunStatus;
          requested_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
          provider?: string;
          provider_task_id?: string | null;
          provider_cost_usd?: number | null;
          response_hash?: string | null;
          failure_code?: string | null;
          failure_message?: string | null;
          metadata?: Json;
          scheduled_for: string;
          run_type?: "baseline" | "recurring" | "manual";
          attempt_count?: number;
          poll_attempt_count?: number;
          next_attempt_at?: string | null;
          next_poll_at?: string | null;
          claimed_at?: string | null;
          claimed_by?: string | null;
          lease_expires_at?: string | null;
          completed_with_warnings?: boolean;
          provider_cost_type?: "actual" | "estimated" | "unknown" | null;
          provider_error_category?: string | null;
          provider_status_code?: number | null;
          result_summary?: Json;
          correlation_id?: string | null;
          idempotency_key?: string | null;
          config_snapshot_id?: string | null;
          phase?: string | null;
          last_transition_at?: string | null;
          last_transition_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["scan_runs"]["Insert"]>;
        Relationships: [];
      };
      ai_responses: {
        Row: {
          id: string;
          workspace_id: string;
          scan_run_id: string;
          ai_surface: AiSurfaceKey;
          prompt_text_snapshot: string;
          response_text: string;
          response_language: string | null;
          response_hash: string;
          model_name: string | null;
          location_snapshot: Json;
          raw_provider_payload: Json | null;
          citations_snapshot: Json;
          provider_metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          scan_run_id: string;
          ai_surface: AiSurfaceKey;
          prompt_text_snapshot: string;
          response_text: string;
          response_language?: string | null;
          response_hash: string;
          model_name?: string | null;
          location_snapshot?: Json;
          raw_provider_payload?: Json | null;
          citations_snapshot?: Json;
          provider_metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ai_responses"]["Insert"]>;
        Relationships: [];
      };
      citation_events: {
        Row: {
          id: string;
          workspace_id: string;
          domain_id: string | null;
          brand_id: string | null;
          scan_run_id: string;
          ai_response_id: string;
          event_type: CitationEventType;
          status: CitationEventStatus;
          cited_hostname: string | null;
          cited_url: string | null;
          cited_url_normalized: string | null;
          source_title: string | null;
          source_snippet: string | null;
          citation_position: number | null;
          confidence_score: number;
          first_seen_at: string;
          last_seen_at: string;
          monitor_configuration_id: string | null;
          event_fingerprint: string | null;
          ai_surface: AiSurfaceKey | null;
          occurrence_count: number;
          metadata: Json;
          search_document?: unknown;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          domain_id?: string | null;
          brand_id?: string | null;
          scan_run_id: string;
          ai_response_id: string;
          event_type: CitationEventType;
          status?: CitationEventStatus;
          cited_hostname?: string | null;
          cited_url?: string | null;
          cited_url_normalized?: string | null;
          source_title?: string | null;
          source_snippet?: string | null;
          citation_position?: number | null;
          confidence_score?: number;
          first_seen_at?: string;
          last_seen_at?: string;
          monitor_configuration_id?: string | null;
          event_fingerprint?: string | null;
          ai_surface?: AiSurfaceKey | null;
          occurrence_count?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["citation_events"]["Insert"]
        >;
        Relationships: [];
      };
      citation_evidence: {
        Row: {
          id: string;
          citation_event_id: string;
          evidence_type: CitationEvidenceType;
          evidence_text: string | null;
          evidence_url: string | null;
          evidence_position: number | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          citation_event_id: string;
          evidence_type: CitationEvidenceType;
          evidence_text?: string | null;
          evidence_url?: string | null;
          evidence_position?: number | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["citation_evidence"]["Insert"]
        >;
        Relationships: [];
      };
      notebook_entries: {
        Row: {
          id: string;
          workspace_id: string;
          citation_event_id: string | null;
          author_clerk_user_id: string;
          title: string;
          body: string;
          body_format: NotebookBodyFormat;
          visibility: NotebookVisibility;
          pinned: boolean;
          archived_at: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          citation_event_id?: string | null;
          author_clerk_user_id: string;
          title: string;
          body: string;
          body_format?: NotebookBodyFormat;
          visibility?: NotebookVisibility;
          pinned?: boolean;
          archived_at?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["notebook_entries"]["Insert"]
        >;
        Relationships: [];
      };
      notebook_entry_revisions: {
        Row: {
          id: string;
          notebook_entry_id: string;
          workspace_id: string;
          revision_number: number;
          title_snapshot: string;
          body_snapshot: string;
          edited_by_clerk_user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          notebook_entry_id: string;
          workspace_id: string;
          revision_number: number;
          title_snapshot: string;
          body_snapshot: string;
          edited_by_clerk_user_id: string;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["notebook_entry_revisions"]["Insert"]
        >;
        Relationships: [];
      };
      citation_annotations: {
        Row: {
          id: string;
          workspace_id: string;
          citation_event_id: string;
          ai_response_id: string | null;
          citation_evidence_id: string | null;
          target_kind: CitationAnnotationTargetKind;
          anchor_start: number | null;
          anchor_end: number | null;
          anchor_text: string | null;
          context_before: string | null;
          context_after: string | null;
          target_text_hash: string | null;
          body: string;
          visibility: CitationAnnotationVisibility;
          author_clerk_user_id: string;
          resolved_at: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          citation_event_id: string;
          ai_response_id?: string | null;
          citation_evidence_id?: string | null;
          target_kind: CitationAnnotationTargetKind;
          anchor_start?: number | null;
          anchor_end?: number | null;
          anchor_text?: string | null;
          context_before?: string | null;
          context_after?: string | null;
          target_text_hash?: string | null;
          body: string;
          visibility?: CitationAnnotationVisibility;
          author_clerk_user_id: string;
          resolved_at?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["citation_annotations"]["Insert"]
        >;
        Relationships: [];
      };
      citation_annotation_activity: {
        Row: {
          id: string;
          workspace_id: string;
          citation_annotation_id: string;
          clerk_user_id: string;
          action: CitationAnnotationActivityAction;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          citation_annotation_id: string;
          clerk_user_id: string;
          action: CitationAnnotationActivityAction;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["citation_annotation_activity"]["Insert"]
        >;
        Relationships: [];
      };
      notification_preferences: {
        Row: {
          id: string;
          workspace_id: string;
          email_enabled: boolean;
          weekly_digest_enabled: boolean;
          instant_citation_alerts_enabled: boolean;
          competitor_alerts_enabled: boolean;
          missed_opportunity_alerts_enabled: boolean;
          slack_enabled: boolean;
          slack_webhook_url_encrypted: string | null;
          instant_email_enabled: boolean;
          instant_slack_enabled: boolean;
          weekly_digest_email_enabled: boolean;
          weekly_digest_slack_enabled: boolean;
          monitor_issue_email_enabled: boolean;
          monitor_issue_slack_enabled: boolean;
          recurring_citation_alerts_enabled: boolean;
          product_tips_email_enabled: boolean;
          send_empty_digest: boolean;
          digest_weekday: number;
          digest_hour: number;
          digest_timezone: string;
          slack_webhook_configured_at: string | null;
          slack_last_tested_at: string | null;
          slack_last_success_at: string | null;
          slack_last_failure_at: string | null;
          slack_last_failure_code: string | null;
          slack_status: "not_connected" | "connected" | "needs_attention";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          email_enabled?: boolean;
          weekly_digest_enabled?: boolean;
          instant_citation_alerts_enabled?: boolean;
          competitor_alerts_enabled?: boolean;
          missed_opportunity_alerts_enabled?: boolean;
          slack_enabled?: boolean;
          slack_webhook_url_encrypted?: string | null;
          instant_email_enabled?: boolean;
          instant_slack_enabled?: boolean;
          weekly_digest_email_enabled?: boolean;
          weekly_digest_slack_enabled?: boolean;
          monitor_issue_email_enabled?: boolean;
          monitor_issue_slack_enabled?: boolean;
          recurring_citation_alerts_enabled?: boolean;
          product_tips_email_enabled?: boolean;
          send_empty_digest?: boolean;
          digest_weekday?: number;
          digest_hour?: number;
          digest_timezone?: string;
          slack_webhook_configured_at?: string | null;
          slack_last_tested_at?: string | null;
          slack_last_success_at?: string | null;
          slack_last_failure_at?: string | null;
          slack_last_failure_code?: string | null;
          slack_status?: "not_connected" | "connected" | "needs_attention";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["notification_preferences"]["Insert"]
        >;
        Relationships: [];
      };
      user_notification_preferences: {
        Row: {
          id: string;
          workspace_id: string;
          clerk_user_id: string;
          email_alerts_enabled: boolean;
          weekly_digest_enabled: boolean;
          monitor_issue_alerts_enabled: boolean;
          product_tips_enabled: boolean;
          slack_mentions_enabled: boolean;
          unsubscribed_all_at: string | null;
          email_unsubscribed_at: string | null;
          digest_unsubscribed_at: string | null;
          product_tips_unsubscribed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          clerk_user_id: string;
          email_alerts_enabled?: boolean;
          weekly_digest_enabled?: boolean;
          monitor_issue_alerts_enabled?: boolean;
          product_tips_enabled?: boolean;
          slack_mentions_enabled?: boolean;
          unsubscribed_all_at?: string | null;
          email_unsubscribed_at?: string | null;
          digest_unsubscribed_at?: string | null;
          product_tips_unsubscribed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["user_notification_preferences"]["Insert"]
        >;
        Relationships: [];
      };
      workspace_usage: {
        Row: {
          id: string;
          workspace_id: string;
          metric_key: UsageMetricKey;
          period_start: string;
          period_end: string;
          usage_count: number;
          limit_count: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          metric_key: UsageMetricKey;
          period_start: string;
          period_end: string;
          usage_count?: number;
          limit_count?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["workspace_usage"]["Insert"]
        >;
        Relationships: [];
      };

      citation_event_occurrences: {
        Row: {
          id: string;
          workspace_id: string;
          citation_event_id: string;
          scan_run_id: string;
          ai_response_id: string;
          observed_at: string;
          event_type: CitationEventType;
          source_url_normalized: string | null;
          source_hostname: string | null;
          source_title: string | null;
          source_snippet: string | null;
          citation_position: number | null;
          confidence_score: number;
          evidence_hash: string;
          source_fingerprint: string | null;
          response_fingerprint: string | null;
          is_material_change: boolean | null;
          change_summary: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          citation_event_id: string;
          scan_run_id: string;
          ai_response_id: string;
          observed_at?: string;
          event_type: CitationEventType;
          source_url_normalized?: string | null;
          source_hostname?: string | null;
          source_title?: string | null;
          source_snippet?: string | null;
          citation_position?: number | null;
          confidence_score?: number;
          evidence_hash: string;
          source_fingerprint?: string | null;
          response_fingerprint?: string | null;
          is_material_change?: boolean | null;
          change_summary?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["citation_event_occurrences"]["Insert"]
        >;
        Relationships: [];
      };
      citation_event_member_states: {
        Row: {
          id: string;
          workspace_id: string;
          citation_event_id: string;
          clerk_user_id: string;
          seen_at: string | null;
          saved_at: string | null;
          archived_at: string | null;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          citation_event_id: string;
          clerk_user_id: string;
          seen_at?: string | null;
          saved_at?: string | null;
          archived_at?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["citation_event_member_states"]["Insert"]
        >;
        Relationships: [];
      };
      citation_event_member_activity: {
        Row: {
          id: string;
          workspace_id: string;
          citation_event_id: string;
          clerk_user_id: string;
          action:
            | "seen"
            | "saved"
            | "unsaved"
            | "archived"
            | "restored"
            | "resolved"
            | "reopened";
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          citation_event_id: string;
          clerk_user_id: string;
          action:
            | "seen"
            | "saved"
            | "unsaved"
            | "archived"
            | "restored"
            | "resolved"
            | "reopened";
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["citation_event_member_activity"]["Insert"]
        >;
        Relationships: [];
      };
      monitoring_usage_events: {
        Row: {
          id: string;
          workspace_id: string;
          scan_run_id: string | null;
          metric_key:
            | "provider_task_submitted"
            | "monitor_check_completed"
            | "provider_cost_usd"
            | "baseline_scan_completed"
            | "recurring_scan_completed";
          quantity: number;
          billing_period_start: string;
          billing_period_end: string;
          source: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          scan_run_id?: string | null;
          metric_key:
            | "provider_task_submitted"
            | "monitor_check_completed"
            | "provider_cost_usd"
            | "baseline_scan_completed"
            | "recurring_scan_completed";
          quantity?: number;
          billing_period_start: string;
          billing_period_end: string;
          source?: string;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["monitoring_usage_events"]["Insert"]
        >;
        Relationships: [];
      };
      provider_tasks: {
        Row: {
          id: string;
          scan_run_id: string;
          workspace_id: string;
          provider: string;
          provider_task_id: string | null;
          provider_request_id: string | null;
          status: "submitted" | "pending" | "completed" | "failed" | "abandoned";
          submitted_at: string;
          last_polled_at: string | null;
          completed_at: string | null;
          adapter_version: string | null;
          normalization_version: string | null;
          attempt_count: number;
          error_code: string | null;
          diagnostic_id: string | null;
          failed_at: string | null;
          canceled_at: string | null;
          next_poll_at: string | null;
          provider_usage: Json;
          metadata: Json;
          submission_state: string | null;
          external_request_key: string | null;
          submission_intent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          scan_run_id: string;
          workspace_id: string;
          provider?: string;
          provider_task_id?: string | null;
          provider_request_id?: string | null;
          status?: "submitted" | "pending" | "completed" | "failed" | "abandoned";
          submitted_at?: string;
          last_polled_at?: string | null;
          completed_at?: string | null;
          adapter_version?: string | null;
          normalization_version?: string | null;
          attempt_count?: number;
          error_code?: string | null;
          diagnostic_id?: string | null;
          failed_at?: string | null;
          canceled_at?: string | null;
          next_poll_at?: string | null;
          provider_usage?: Json;
          metadata?: Json;
          submission_state?: string | null;
          external_request_key?: string | null;
          submission_intent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["provider_tasks"]["Insert"]>;
        Relationships: [];
      };
      monitoring_audit_events: {
        Row: {
          id: string;
          workspace_id: string | null;
          monitor_configuration_id: string | null;
          scan_run_id: string | null;
          event_name: string;
          safe_metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id?: string | null;
          monitor_configuration_id?: string | null;
          scan_run_id?: string | null;
          event_name: string;
          safe_metadata?: Json;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["monitoring_audit_events"]["Insert"]
        >;
        Relationships: [];
      };
      notification_outbox: {
        Row: {
          id: string;
          workspace_id: string;
          event_type: string;
          notification_type: string;
          source_entity_type: string;
          source_entity_id: string;
          dedupe_key: string | null;
          priority: "low" | "normal" | "high";
          status:
            | "pending"
            | "processing"
            | "delivered"
            | "partially_delivered"
            | "canceled"
            | "failed"
            | "suppressed";
          payload: Json;
          payload_summary: Json;
          available_at: string;
          locked_at: string | null;
          lock_expires_at: string | null;
          attempt_count: number;
          max_attempts: number;
          last_attempt_at: string | null;
          next_attempt_at: string | null;
          delivered_at: string | null;
          canceled_at: string | null;
          failure_code: string | null;
          failure_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          event_type: string;
          notification_type?: string;
          source_entity_type: string;
          source_entity_id: string;
          dedupe_key?: string | null;
          priority?: "low" | "normal" | "high";
          status?:
            | "pending"
            | "processing"
            | "delivered"
            | "partially_delivered"
            | "canceled"
            | "failed"
            | "suppressed";
          payload?: Json;
          payload_summary?: Json;
          available_at?: string;
          locked_at?: string | null;
          lock_expires_at?: string | null;
          attempt_count?: number;
          max_attempts?: number;
          last_attempt_at?: string | null;
          next_attempt_at?: string | null;
          delivered_at?: string | null;
          canceled_at?: string | null;
          failure_code?: string | null;
          failure_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["notification_outbox"]["Insert"]
        >;
        Relationships: [];
      };
      notification_deliveries: {
        Row: {
          id: string;
          workspace_id: string;
          outbox_id: string;
          channel: "email" | "slack";
          recipient_type:
            | "workspace_owner"
            | "workspace_admin"
            | "workspace_member"
            | "slack_workspace"
            | "free_scan_requester";
          recipient_clerk_user_id: string | null;
          recipient_email_hash: string | null;
          recipient_key: string;
          status:
            | "pending"
            | "processing"
            | "delivered"
            | "failed"
            | "suppressed"
            | "canceled";
          provider: string | null;
          provider_message_id: string | null;
          attempt_count: number;
          last_attempt_at: string | null;
          delivered_at: string | null;
          failed_at: string | null;
          failure_code: string | null;
          failure_message: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          outbox_id: string;
          channel: "email" | "slack";
          recipient_type:
            | "workspace_owner"
            | "workspace_admin"
            | "workspace_member"
            | "slack_workspace"
            | "free_scan_requester";
          recipient_clerk_user_id?: string | null;
          recipient_email_hash?: string | null;
          status?:
            | "pending"
            | "processing"
            | "delivered"
            | "failed"
            | "suppressed"
            | "canceled";
          provider?: string | null;
          provider_message_id?: string | null;
          attempt_count?: number;
          last_attempt_at?: string | null;
          delivered_at?: string | null;
          failed_at?: string | null;
          failure_code?: string | null;
          failure_message?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["notification_deliveries"]["Insert"]
        >;
        Relationships: [];
      };
      notification_unsubscribe_tokens: {
        Row: {
          id: string;
          workspace_id: string;
          clerk_user_id: string | null;
          email_hash: string;
          token_hash: string;
          scope:
            | "all_email"
            | "instant_alerts"
            | "weekly_digest"
            | "monitor_issues"
            | "free_scan_followup"
            | "product_tips";
          expires_at: string;
          used_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          clerk_user_id?: string | null;
          email_hash: string;
          token_hash: string;
          scope:
            | "all_email"
            | "instant_alerts"
            | "weekly_digest"
            | "monitor_issues"
            | "free_scan_followup"
            | "product_tips";
          expires_at: string;
          used_at?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["notification_unsubscribe_tokens"]["Insert"]
        >;
        Relationships: [];
      };
      lifecycle_email_enrollments: {
        Row: {
          id: string;
          workspace_id: string;
          sequence_key: "welcome_nurture" | "learn_domains_promo";
          anchor_at: string;
          status: "active" | "completed" | "canceled";
          canceled_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          sequence_key: "welcome_nurture" | "learn_domains_promo";
          anchor_at: string;
          status?: "active" | "completed" | "canceled";
          canceled_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["lifecycle_email_enrollments"]["Insert"]
        >;
        Relationships: [];
      };
      lifecycle_email_sends: {
        Row: {
          id: string;
          enrollment_id: string;
          workspace_id: string;
          step_key: string;
          notification_type: string;
          scheduled_for: string;
          status:
            | "pending"
            | "queued"
            | "sent"
            | "suppressed"
            | "canceled"
            | "failed";
          outbox_id: string | null;
          queued_at: string | null;
          sent_at: string | null;
          suppressed_at: string | null;
          failure_code: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          enrollment_id: string;
          workspace_id: string;
          step_key: string;
          notification_type: string;
          scheduled_for: string;
          status?:
            | "pending"
            | "queued"
            | "sent"
            | "suppressed"
            | "canceled"
            | "failed";
          outbox_id?: string | null;
          queued_at?: string | null;
          sent_at?: string | null;
          suppressed_at?: string | null;
          failure_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["lifecycle_email_sends"]["Insert"]
        >;
        Relationships: [];
      };
      notification_digest_runs: {
        Row: {
          id: string;
          workspace_id: string;
          period_start: string;
          period_end: string;
          channel: "email" | "slack";
          status: "pending" | "queued" | "sent" | "suppressed" | "failed";
          outbox_id: string | null;
          sent_at: string | null;
          suppressed_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          period_start: string;
          period_end: string;
          channel: "email" | "slack";
          status?: "pending" | "queued" | "sent" | "suppressed" | "failed";
          outbox_id?: string | null;
          sent_at?: string | null;
          suppressed_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["notification_digest_runs"]["Insert"]
        >;
        Relationships: [];
      };

      free_scan_requests: {
        Row: {
          id: string;
          public_token: string;
          status: FreeScanStatus;
          normalized_hostname: string;
          raw_domain_input: string;
          brand_name: string;
          alternate_brand_names: string[];
          prompts: string[];
          email: string;
          marketing_consent: boolean;
          marketing_consent_at: string | null;
          terms_accepted_at: string;
          source: string;
          referrer_path: string | null;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          utm_term: string | null;
          utm_content: string | null;
          request_fingerprint_hash: string | null;
          requested_at: string;
          queued_at: string | null;
          completed_at: string | null;
          expired_at: string | null;
          result_summary: Json | null;
          error_code: string | null;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          public_token: string;
          status?: FreeScanStatus;
          normalized_hostname: string;
          raw_domain_input: string;
          brand_name: string;
          alternate_brand_names?: string[];
          prompts?: string[];
          email: string;
          marketing_consent?: boolean;
          marketing_consent_at?: string | null;
          terms_accepted_at: string;
          source?: string;
          referrer_path?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          utm_term?: string | null;
          utm_content?: string | null;
          request_fingerprint_hash?: string | null;
          requested_at?: string;
          queued_at?: string | null;
          completed_at?: string | null;
          expired_at?: string | null;
          result_summary?: Json | null;
          error_code?: string | null;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["free_scan_requests"]["Insert"]
        >;
        Relationships: [];
      };
      chatbot_leads: {
        Row: {
          id: string;
          normalized_domain: string;
          raw_domain_input: string;
          email: string;
          category: string;
          intent: string;
          source_path: string | null;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          normalized_domain: string;
          raw_domain_input: string;
          email: string;
          category: string;
          intent?: string;
          source_path?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["chatbot_leads"]["Insert"]
        >;
        Relationships: [];
      };
      checkout_intents: {
        Row: {
          id: string;
          clerk_user_id: string;
          requested_plan_key: PlanKey;
          stripe_price_id_snapshot: string;
          status:
            | "created"
            | "reserved"
            | "checkout_created"
            | "checkout_completed"
            | "provisioned"
            | "expired"
            | "canceled"
            | "failed";
          stripe_checkout_session_id: string | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          workspace_id: string | null;
          reservation_expires_at: string | null;
          completed_at: string | null;
          canceled_at: string | null;
          expires_at: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          clerk_user_id: string;
          requested_plan_key: PlanKey;
          stripe_price_id_snapshot: string;
          status?:
            | "created"
            | "reserved"
            | "checkout_created"
            | "checkout_completed"
            | "provisioned"
            | "expired"
            | "canceled"
            | "failed";
          stripe_checkout_session_id?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          workspace_id?: string | null;
          reservation_expires_at?: string | null;
          completed_at?: string | null;
          canceled_at?: string | null;
          expires_at?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["checkout_intents"]["Insert"]
        >;
        Relationships: [];
      };
      plan_inventory: {
        Row: {
          plan_key: PlanKey;
          capacity: number;
          active_count: number;
          reserved_count: number;
          updated_at: string;
        };
        Insert: {
          plan_key: PlanKey;
          capacity: number;
          active_count?: number;
          reserved_count?: number;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["plan_inventory"]["Insert"]>;
        Relationships: [];
      };
      stripe_webhook_events: {
        Row: {
          id: string;
          stripe_event_id: string;
          event_type: string;
          processing_status: "received" | "processed" | "ignored" | "failed";
          checkout_intent_id: string | null;
          workspace_id: string | null;
          processed_at: string | null;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          stripe_event_id: string;
          event_type: string;
          processing_status?: "received" | "processed" | "ignored" | "failed";
          checkout_intent_id?: string | null;
          workspace_id?: string | null;
          processed_at?: string | null;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["stripe_webhook_events"]["Insert"]
        >;
        Relationships: [];
      };
      billing_events: {
        Row: {
          id: string;
          workspace_id: string | null;
          stripe_event_id: string | null;
          event_type: string;
          source:
            | "stripe_webhook"
            | "manual_reconciliation"
            | "customer_portal"
            | "checkout"
            | "system";
          status:
            | "received"
            | "processed"
            | "ignored"
            | "failed"
            | "reconciled";
          safe_summary: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id?: string | null;
          stripe_event_id?: string | null;
          event_type: string;
          source:
            | "stripe_webhook"
            | "manual_reconciliation"
            | "customer_portal"
            | "checkout"
            | "system";
          status?:
            | "received"
            | "processed"
            | "ignored"
            | "failed"
            | "reconciled";
          safe_summary?: Record<string, unknown>;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["billing_events"]["Insert"]>;
        Relationships: [];
      };
      plan_change_requests: {
        Row: {
          id: string;
          workspace_id: string;
          requested_by_clerk_user_id: string;
          from_plan_key: PlanKey;
          to_plan_key: PlanKey | null;
          change_type:
            | "upgrade"
            | "downgrade"
            | "reactivation"
            | "cancelation"
            | "portal";
          status:
            | "requested"
            | "pending_stripe"
            | "completed"
            | "failed"
            | "canceled"
            | "expired";
          stripe_subscription_id: string | null;
          stripe_checkout_session_id: string | null;
          stripe_portal_session_id: string | null;
          effective_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          requested_by_clerk_user_id: string;
          from_plan_key: PlanKey;
          to_plan_key?: PlanKey | null;
          change_type:
            | "upgrade"
            | "downgrade"
            | "reactivation"
            | "cancelation"
            | "portal";
          status?:
            | "requested"
            | "pending_stripe"
            | "completed"
            | "failed"
            | "canceled"
            | "expired";
          stripe_subscription_id?: string | null;
          stripe_checkout_session_id?: string | null;
          stripe_portal_session_id?: string | null;
          effective_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["plan_change_requests"]["Insert"]
        >;
        Relationships: [];
      };
      billing_usage_snapshots: {
        Row: {
          id: string;
          workspace_id: string;
          billing_period_start: string;
          billing_period_end: string;
          plan_key_snapshot: PlanKey;
          domains_used: number;
          domains_limit: number;
          prompts_used: number;
          prompts_limit: number;
          active_monitor_configurations_used: number;
          active_monitor_configurations_limit: number;
          monitor_checks_used: number;
          monitor_checks_limit: number;
          members_used: number;
          members_limit: number;
          provider_cost_usd_estimate: number | null;
          provider_cost_usd_actual: number | null;
          generated_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          billing_period_start: string;
          billing_period_end: string;
          plan_key_snapshot: PlanKey;
          domains_used?: number;
          domains_limit: number;
          prompts_used?: number;
          prompts_limit: number;
          active_monitor_configurations_used?: number;
          active_monitor_configurations_limit: number;
          monitor_checks_used?: number;
          monitor_checks_limit: number;
          members_used?: number;
          members_limit: number;
          provider_cost_usd_estimate?: number | null;
          provider_cost_usd_actual?: number | null;
          generated_at?: string;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["billing_usage_snapshots"]["Insert"]
        >;
        Relationships: [];
      };
      workspace_onboarding: {
        Row: {
          id: string;
          workspace_id: string;
          current_step: number;
          completed_at: string | null;
          dismissed_at: string | null;
          selected_plan_key_snapshot: PlanKey | null;
          setup_started_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          current_step?: number;
          completed_at?: string | null;
          dismissed_at?: string | null;
          selected_plan_key_snapshot?: PlanKey | null;
          setup_started_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["workspace_onboarding"]["Insert"]
        >;
        Relationships: [];
      };
      domain_verification_attempts: {
        Row: {
          id: string;
          domain_id: string;
          workspace_id: string;
          method: DomainVerificationMethod;
          status:
            | "success"
            | "not_found"
            | "mismatch"
            | "rate_limited"
            | "error";
          attempted_at: string;
          failure_code: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          domain_id: string;
          workspace_id: string;
          method?: DomainVerificationMethod;
          status:
            | "success"
            | "not_found"
            | "mismatch"
            | "rate_limited"
            | "error";
          attempted_at?: string;
          failure_code?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["domain_verification_attempts"]["Insert"]
        >;
        Relationships: [];
      };
      integration_handoffs: {
        Row: {
          id: string;
          workspace_id: string;
          integration: "learn_domains";
          source_entity_type: "citation_event" | "monitor_configuration";
          source_entity_id: string;
          created_by_clerk_user_id: string;
          payload_summary: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          integration: "learn_domains";
          source_entity_type: "citation_event" | "monitor_configuration";
          source_entity_id: string;
          created_by_clerk_user_id: string;
          payload_summary?: Json;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["integration_handoffs"]["Insert"]
        >;
        Relationships: [];
      };
      member_ui_preferences: {
        Row: {
          id: string;
          workspace_id: string;
          clerk_user_id: string;
          setup_checklist_dismissed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          clerk_user_id: string;
          setup_checklist_dismissed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["member_ui_preferences"]["Insert"]
        >;
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          email_normalized: string | null;
          display_name: string | null;
          status: "active" | "disabled";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email_normalized?: string | null;
          display_name?: string | null;
          status?: "active" | "disabled";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
        Relationships: [];
      };
      auth_identities: {
        Row: {
          id: string;
          user_id: string;
          provider: "clerk" | "local";
          provider_subject: string;
          provider_metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider: "clerk" | "local";
          provider_subject: string;
          provider_metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["auth_identities"]["Insert"]>;
        Relationships: [];
      };
      local_credentials: {
        Row: {
          user_id: string;
          password_hash: string;
          password_changed_at: string | null;
          failed_attempt_count: number;
          locked_until: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          password_hash: string;
          password_changed_at?: string | null;
          failed_attempt_count?: number;
          locked_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["local_credentials"]["Insert"]
        >;
        Relationships: [];
      };
      workspace_invitations: {
        Row: {
          id: string;
          workspace_id: string;
          email_normalized: string;
          role: WorkspaceRole;
          token_hash: string;
          invited_by_user_id: string | null;
          accepted_by_user_id: string | null;
          status: "pending" | "accepted" | "revoked" | "expired";
          expires_at: string;
          accepted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          email_normalized: string;
          role: WorkspaceRole;
          token_hash: string;
          invited_by_user_id?: string | null;
          accepted_by_user_id?: string | null;
          status?: "pending" | "accepted" | "revoked" | "expired";
          expires_at: string;
          accepted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["workspace_invitations"]["Insert"]
        >;
        Relationships: [];
      };
      auth_audit_events: {
        Row: {
          id: string;
          user_id: string | null;
          workspace_id: string | null;
          action: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          workspace_id?: string | null;
          action: string;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["auth_audit_events"]["Insert"]
        >;
        Relationships: [];
      };
      rate_limit_buckets: {
        Row: {
          bucket_key: string;
          window_started_at: string;
          hit_count: number;
          updated_at: string;
        };
        Insert: {
          bucket_key: string;
          window_started_at: string;
          hit_count?: number;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["rate_limit_buckets"]["Insert"]
        >;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      release_expired_founder_reservations: {
        Args: Record<string, never>;
        Returns: number;
      };
      reserve_founder_slot: {
        Args: { p_intent_id: string; p_ttl_minutes?: number };
        Returns: boolean;
      };
      activate_founder_reservation: {
        Args: { p_intent_id: string };
        Returns: boolean;
      };
      release_founder_reservation: {
        Args: { p_intent_id: string };
        Returns: boolean;
      };
      release_founder_active_slot: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      claim_due_scan_runs: {
        Args: {
          p_limit: number;
          p_worker_id: string;
          p_lease_seconds?: number;
        };
        Returns: Database["public"]["Tables"]["scan_runs"]["Row"][];
      };
      release_expired_scan_run_leases: {
        Args: Record<string, never>;
        Returns: number;
      };
      claim_notification_outbox: {
        Args: {
          p_limit: number;
          p_lease_seconds?: number;
        };
        Returns: Database["public"]["Tables"]["notification_outbox"]["Row"][];
      };
      release_stale_notification_outbox_locks: {
        Args: Record<string, never>;
        Returns: number;
      };
      record_monitoring_usage_event: {
        Args: {
          p_workspace_id: string;
          p_scan_run_id: string;
          p_metric_key:
            | "provider_task_submitted"
            | "monitor_check_completed"
            | "provider_cost_usd"
            | "baseline_scan_completed"
            | "recurring_scan_completed";
          p_quantity: number;
          p_billing_period_start: string;
          p_billing_period_end: string;
          p_source?: string;
        };
        Returns: boolean;
      };
      inbox_tab_counts: {
        Args: {
          p_workspace_id: string;
          p_clerk_user_id: string;
        };
        Returns: {
          all_count: number;
          new_count: number;
          citations_count: number;
          mentions_count: number;
          recommendations_count: number;
          opportunities_count: number;
          saved_count: number;
          archived_count: number;
        }[];
      };
      inbox_list_events: {
        Args: {
          p_workspace_id: string;
          p_clerk_user_id: string;
          p_view?: string;
          p_event_types?: CitationEventType[] | null;
          p_surfaces?: AiSurfaceKey[] | null;
          p_domain_id?: string | null;
          p_prompt_id?: string | null;
          p_from?: string | null;
          p_to?: string | null;
          p_member_states?: string[] | null;
          p_has_source?: boolean | null;
          p_search?: string | null;
          p_cursor_last_seen_at?: string | null;
          p_cursor_id?: string | null;
          p_limit?: number;
        };
        Returns: (Database["public"]["Tables"]["citation_events"]["Row"] & {
          member_seen_at: string | null;
          member_saved_at: string | null;
          member_archived_at: string | null;
          member_resolved_at: string | null;
          prompt_id: string | null;
          prompt_text: string | null;
          domain_hostname: string | null;
        })[];
      };
    };
    CompositeTypes: Record<string, never>;
    Enums: {
      workspace_status: WorkspaceStatus;
      plan_key: PlanKey;
      workspace_role: WorkspaceRole;
      domain_verification_status: DomainVerificationStatus;
      domain_verification_method: DomainVerificationMethod;
      domain_alias_type: DomainAliasType;
      monitoring_frequency: MonitoringFrequency;
      prompt_priority: PromptPriority;
      ai_surface_key: AiSurfaceKey;
      scan_run_status: ScanRunStatus;
      citation_event_type: CitationEventType;
      citation_event_status: CitationEventStatus;
      citation_evidence_type: CitationEvidenceType;
      usage_metric_key: UsageMetricKey;
      free_scan_status: FreeScanStatus;
      notebook_body_format: NotebookBodyFormat;
      notebook_visibility: NotebookVisibility;
      citation_annotation_target_kind: CitationAnnotationTargetKind;
      citation_annotation_visibility: CitationAnnotationVisibility;
      citation_annotation_activity_action: CitationAnnotationActivityAction;
    };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
