/**
 * Development-only seed for Cited Phase 1.
 *
 * Creates fictional fixture data. Never run against production without intent.
 *
 * Prefers SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY) via Supabase JS.
 * Falls back to POSTGRES_URL + psql when the service-role key is unavailable.
 *
 * Usage: npm run seed
 */

import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "../lib/db/types";

const DEMO_OWNER = "user_cited_demo_owner";
const DEMO_SLUG = "cited-demo";

function loadEnvFile(): void {
  try {
    const text = readFileSync(".env.local", "utf8");
    for (const line of text.split("\n")) {
      if (!line || line.trim().startsWith("#") || !line.includes("=")) {
        continue;
      }
      const idx = line.indexOf("=");
      const key = line.slice(0, idx);
      const value = line.slice(idx + 1);
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env.local optional when env already injected
  }
}

function env(name: string, fallbacks: string[] = []): string | undefined {
  for (const key of [name, ...fallbacks]) {
    const value = process.env[key];
    if (value) {
      return value;
    }
  }
  return undefined;
}

function hash(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function buildSeedSql(ids: {
  workspaceId: string;
  domainId: string;
  brandId: string;
  promptIds: string[];
  monitorConfigId: string;
  scanRunId: string;
  aiResponseId: string;
  citationEventIds: string[];
  notebookEntryId: string;
  now: string;
  responseText: string;
  responseHash: string;
}): string {
  const prompts = [
    {
      id: ids.promptIds[0],
      name: "AI citation tools",
      prompt_text: "What is the best tool to monitor AI citations?",
    },
    {
      id: ids.promptIds[1],
      name: "Crypto intelligence",
      prompt_text: "Best crypto market intelligence tools",
    },
    {
      id: ids.promptIds[2],
      name: "AI SEO",
      prompt_text: "Best AI SEO tools for startups",
    },
  ];

  const promptInserts = prompts
    .map(
      (p) => `
insert into public.monitored_prompts (
  id, workspace_id, domain_id, name, prompt_text, normalized_prompt,
  locale, language_code, country_code, active, monitoring_frequency, priority
) values (
  '${p.id}', '${ids.workspaceId}', '${ids.domainId}', ${sqlLiteral(p.name)},
  ${sqlLiteral(p.prompt_text)}, ${sqlLiteral(p.prompt_text.trim().toLowerCase())},
  'en-US', 'en', 'US', true, 'twice_weekly', 'normal'
);`,
    )
    .join("\n");

  return `
delete from public.workspaces where slug = '${DEMO_SLUG}';

insert into public.workspaces (
  id, name, slug, owner_clerk_user_id, plan_key, status
) values (
  '${ids.workspaceId}', 'Cited Demo Workspace', '${DEMO_SLUG}',
  '${DEMO_OWNER}', 'founder', 'trialing'
);

insert into public.workspace_members (workspace_id, clerk_user_id, role)
values ('${ids.workspaceId}', '${DEMO_OWNER}', 'owner');

insert into public.domains (
  id, workspace_id, hostname, normalized_hostname, display_name,
  verification_status, verification_method, verified_at
) values (
  '${ids.domainId}', '${ids.workspaceId}', 'cited-test.example',
  'cited-test.example', 'Cited Test Domain', 'verified', 'manual', '${ids.now}'
);

insert into public.domain_aliases (
  domain_id, hostname, normalized_hostname, alias_type
) values (
  '${ids.domainId}', 'blog.cited-test.example', 'blog.cited-test.example', 'subdomain'
);

insert into public.brands (
  id, workspace_id, primary_domain_id, name, normalized_name,
  alternate_names, description
) values (
  '${ids.brandId}', '${ids.workspaceId}', '${ids.domainId}',
  'Cited Test Brand', 'cited test brand',
  array['CitedTest','cited-test.example'],
  'Fictional brand for local development only.'
);

${promptInserts}

insert into public.monitor_configurations (
  id, workspace_id, monitored_prompt_id, ai_surface, enabled,
  scan_frequency, locale, country_code
) values (
  '${ids.monitorConfigId}', '${ids.workspaceId}', '${ids.promptIds[0]}',
  'chatgpt', true, 'twice_weekly', 'en-US', 'US'
);

insert into public.scan_runs (
  id, workspace_id, monitor_configuration_id, status, requested_at,
  started_at, completed_at, provider, provider_task_id, provider_cost_usd,
  response_hash, metadata
) values (
  '${ids.scanRunId}', '${ids.workspaceId}', '${ids.monitorConfigId}',
  'completed', '${ids.now}', '${ids.now}', '${ids.now}', 'mock',
  'seed_${ids.scanRunId}', 0, '${ids.responseHash}',
  '{"mock":true,"seed":true}'::jsonb
);

insert into public.ai_responses (
  id, workspace_id, scan_run_id, ai_surface, prompt_text_snapshot,
  response_text, response_language, response_hash, model_name,
  location_snapshot, raw_provider_payload
) values (
  '${ids.aiResponseId}', '${ids.workspaceId}', '${ids.scanRunId}', 'chatgpt',
  ${sqlLiteral(prompts[0].prompt_text)}, ${sqlLiteral(ids.responseText)},
  'en', '${ids.responseHash}', 'mock-model-v1',
  '{"country_code":"US","locale":"en-US"}'::jsonb,
  '{"mock":true,"seed":true}'::jsonb
);

insert into public.citation_events (
  id, workspace_id, domain_id, brand_id, scan_run_id, ai_response_id,
  event_type, status, cited_hostname, cited_url, cited_url_normalized,
  source_title, source_snippet, citation_position, confidence_score,
  first_seen_at, last_seen_at
) values
(
  '${ids.citationEventIds[0]}', '${ids.workspaceId}', '${ids.domainId}', '${ids.brandId}',
  '${ids.scanRunId}', '${ids.aiResponseId}', 'citation', 'new',
  'cited-test.example', 'https://www.cited-test.example/guides/ai-citations',
  'https://cited-test.example/guides/ai-citations',
  '[MOCK] AI citation guide', '[MOCK] Cited Test Brand monitoring guide.',
  1, 0.94, '${ids.now}', '${ids.now}'
),
(
  '${ids.citationEventIds[1]}', '${ids.workspaceId}', '${ids.domainId}', '${ids.brandId}',
  '${ids.scanRunId}', '${ids.aiResponseId}', 'citation', 'new',
  'cited-test.example', 'https://cited-test.example/pricing',
  'https://cited-test.example/pricing',
  '[MOCK] Pricing', '[MOCK] Second citation event for seed data.',
  2, 0.87, '${ids.now}', '${ids.now}'
),
(
  '${ids.citationEventIds[2]}', '${ids.workspaceId}', '${ids.domainId}', '${ids.brandId}',
  '${ids.scanRunId}', '${ids.aiResponseId}', 'mention', 'new',
  null, null, null, null,
  '[MOCK] Brand name mentioned without source URL.',
  null, 0.72, '${ids.now}', '${ids.now}'
),
(
  '${ids.citationEventIds[3]}', '${ids.workspaceId}', '${ids.domainId}', null,
  '${ids.scanRunId}', '${ids.aiResponseId}', 'missed_opportunity', 'new',
  'competitor-labs.example', 'https://competitor-labs.example/product',
  'https://competitor-labs.example/product',
  '[MOCK] Competitor Labs',
  '[MOCK] Competitor cited while verified domain was absent on a related prompt.',
  1, 0.81, '${ids.now}', '${ids.now}'
);

insert into public.citation_evidence (
  citation_event_id, evidence_type, evidence_text, evidence_url,
  evidence_position, metadata
) values (
  '${ids.citationEventIds[0]}', 'source_link',
  '[MOCK] Source link matched verified domain.',
  'https://www.cited-test.example/guides/ai-citations',
  1, '{"seed":true}'::jsonb
);

insert into public.notebook_entries (
  id, workspace_id, citation_event_id, author_clerk_user_id,
  title, body, body_format, visibility, pinned
) values (
  '${ids.notebookEntryId}', '${ids.workspaceId}', '${ids.citationEventIds[0]}',
  '${DEMO_OWNER}',
  '[MOCK SEED] First citation note',
  '[MOCK SEED] First notebook note: verified domain appeared in a monitored ChatGPT response.',
  'plain_text',
  'workspace',
  true
);

insert into public.notification_preferences (
  workspace_id, email_enabled, weekly_digest_enabled,
  instant_citation_alerts_enabled, competitor_alerts_enabled,
  missed_opportunity_alerts_enabled, slack_enabled
) values (
  '${ids.workspaceId}', true, true, true, false, true, false
);
`;
}

function sqlLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

async function seedViaSupabase(
  supabaseUrl: string,
  serviceKey: string,
  ids: ReturnType<typeof createIds>,
): Promise<void> {
  const admin = createClient<Database>(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: existing } = await admin
    .from("workspaces")
    .select("id")
    .eq("slug", DEMO_SLUG)
    .maybeSingle();

  if (existing?.id) {
    await admin.from("workspaces").delete().eq("id", existing.id);
  }

  const { error: workspaceError } = await admin.from("workspaces").insert({
    id: ids.workspaceId,
    name: "Cited Demo Workspace",
    slug: DEMO_SLUG,
    owner_clerk_user_id: DEMO_OWNER,
    plan_key: "founder",
    status: "trialing",
  });
  if (workspaceError) {
    throw workspaceError;
  }

  const steps: Array<PromiseLike<{ error: { message: string } | null }>> = [
    admin.from("workspace_members").insert({
      workspace_id: ids.workspaceId,
      clerk_user_id: DEMO_OWNER,
      role: "owner",
    }),
    admin.from("domains").insert({
      id: ids.domainId,
      workspace_id: ids.workspaceId,
      hostname: "cited-test.example",
      normalized_hostname: "cited-test.example",
      display_name: "Cited Test Domain",
      verification_status: "verified",
      verification_method: "manual",
      verified_at: ids.now,
    }),
    admin.from("domain_aliases").insert({
      domain_id: ids.domainId,
      hostname: "blog.cited-test.example",
      normalized_hostname: "blog.cited-test.example",
      alias_type: "subdomain",
    }),
    admin.from("brands").insert({
      id: ids.brandId,
      workspace_id: ids.workspaceId,
      primary_domain_id: ids.domainId,
      name: "Cited Test Brand",
      normalized_name: "cited test brand",
      alternate_names: ["CitedTest", "cited-test.example"],
      description: "Fictional brand for local development only.",
    }),
  ];

  for (const step of steps) {
    const { error } = await step;
    if (error) {
      throw error;
    }
  }

  const prompts = [
    {
      id: ids.promptIds[0],
      name: "AI citation tools",
      prompt_text: "What is the best tool to monitor AI citations?",
    },
    {
      id: ids.promptIds[1],
      name: "Crypto intelligence",
      prompt_text: "Best crypto market intelligence tools",
    },
    {
      id: ids.promptIds[2],
      name: "AI SEO",
      prompt_text: "Best AI SEO tools for startups",
    },
  ] as const;

  for (const prompt of prompts) {
    const { error } = await admin.from("monitored_prompts").insert({
      id: prompt.id,
      workspace_id: ids.workspaceId,
      domain_id: ids.domainId,
      name: prompt.name,
      prompt_text: prompt.prompt_text,
      normalized_prompt: prompt.prompt_text.trim().toLowerCase(),
      locale: "en-US",
      language_code: "en",
      country_code: "US",
      active: true,
      monitoring_frequency: "twice_weekly",
      priority: "normal",
    });
    if (error) {
      throw error;
    }
  }

  const remaining = [
    admin.from("monitor_configurations").insert({
      id: ids.monitorConfigId,
      workspace_id: ids.workspaceId,
      monitored_prompt_id: ids.promptIds[0],
      ai_surface: "chatgpt",
      enabled: true,
      scan_frequency: "twice_weekly",
      locale: "en-US",
      country_code: "US",
    }),
    admin.from("scan_runs").insert({
      id: ids.scanRunId,
      workspace_id: ids.workspaceId,
      monitor_configuration_id: ids.monitorConfigId,
      status: "completed",
      requested_at: ids.now,
      started_at: ids.now,
      completed_at: ids.now,
      scheduled_for: ids.now,
      run_type: "baseline",
      provider: "mock",
      provider_task_id: `seed_${ids.scanRunId}`,
      provider_cost_usd: 0,
      response_hash: ids.responseHash,
      metadata: { mock: true, seed: true },
    }),
    admin.from("ai_responses").insert({
      id: ids.aiResponseId,
      workspace_id: ids.workspaceId,
      scan_run_id: ids.scanRunId,
      ai_surface: "chatgpt",
      prompt_text_snapshot: prompts[0].prompt_text,
      response_text: ids.responseText,
      response_language: "en",
      response_hash: ids.responseHash,
      model_name: "mock-model-v1",
      location_snapshot: { country_code: "US", locale: "en-US" },
      raw_provider_payload: { mock: true, seed: true },
    }),
  ];

  for (const step of remaining) {
    const { error } = await step;
    if (error) {
      throw error;
    }
  }

  const events = [
    {
      id: ids.citationEventIds[0],
      event_type: "citation" as const,
      cited_hostname: "cited-test.example",
      cited_url: "https://www.cited-test.example/guides/ai-citations",
      cited_url_normalized: "https://cited-test.example/guides/ai-citations",
      source_title: "[MOCK] AI citation guide",
      source_snippet: "[MOCK] Cited Test Brand monitoring guide.",
      citation_position: 1,
      confidence_score: 0.94,
      domain_id: ids.domainId,
      brand_id: ids.brandId,
    },
    {
      id: ids.citationEventIds[1],
      event_type: "citation" as const,
      cited_hostname: "cited-test.example",
      cited_url: "https://cited-test.example/pricing",
      cited_url_normalized: "https://cited-test.example/pricing",
      source_title: "[MOCK] Pricing",
      source_snippet: "[MOCK] Second citation event for seed data.",
      citation_position: 2,
      confidence_score: 0.87,
      domain_id: ids.domainId,
      brand_id: ids.brandId,
    },
    {
      id: ids.citationEventIds[2],
      event_type: "mention" as const,
      cited_hostname: null,
      cited_url: null,
      cited_url_normalized: null,
      source_title: null,
      source_snippet: "[MOCK] Brand name mentioned without source URL.",
      citation_position: null,
      confidence_score: 0.72,
      domain_id: ids.domainId,
      brand_id: ids.brandId,
    },
    {
      id: ids.citationEventIds[3],
      event_type: "missed_opportunity" as const,
      cited_hostname: "competitor-labs.example",
      cited_url: "https://competitor-labs.example/product",
      cited_url_normalized: "https://competitor-labs.example/product",
      source_title: "[MOCK] Competitor Labs",
      source_snippet:
        "[MOCK] Competitor cited while verified domain was absent on a related prompt.",
      citation_position: 1,
      confidence_score: 0.81,
      domain_id: ids.domainId,
      brand_id: null,
    },
  ];

  for (const event of events) {
    const { error } = await admin.from("citation_events").insert({
      id: event.id,
      workspace_id: ids.workspaceId,
      domain_id: event.domain_id,
      brand_id: event.brand_id,
      scan_run_id: ids.scanRunId,
      ai_response_id: ids.aiResponseId,
      event_type: event.event_type,
      status: "new",
      cited_hostname: event.cited_hostname,
      cited_url: event.cited_url,
      cited_url_normalized: event.cited_url_normalized,
      source_title: event.source_title,
      source_snippet: event.source_snippet,
      citation_position: event.citation_position,
      confidence_score: event.confidence_score,
      first_seen_at: ids.now,
      last_seen_at: ids.now,
    });
    if (error) {
      throw error;
    }
  }

  for (const step of [
    admin.from("citation_evidence").insert({
      citation_event_id: ids.citationEventIds[0],
      evidence_type: "source_link",
      evidence_text: "[MOCK] Source link matched verified domain.",
      evidence_url: "https://www.cited-test.example/guides/ai-citations",
      evidence_position: 1,
      metadata: { seed: true },
    }),
    admin.from("notebook_entries").insert({
      id: ids.notebookEntryId,
      workspace_id: ids.workspaceId,
      citation_event_id: ids.citationEventIds[0],
      author_clerk_user_id: DEMO_OWNER,
      title: "[MOCK SEED] First citation note",
      body: "[MOCK SEED] First notebook note: verified domain appeared in a monitored ChatGPT response.",
      body_format: "plain_text",
      visibility: "workspace",
      pinned: true,
    }),
    admin.from("notification_preferences").insert({
      workspace_id: ids.workspaceId,
      email_enabled: true,
      weekly_digest_enabled: true,
      instant_citation_alerts_enabled: true,
      competitor_alerts_enabled: false,
      missed_opportunity_alerts_enabled: true,
      slack_enabled: false,
    }),
  ]) {
    const { error } = await step;
    if (error) {
      throw error;
    }
  }
}

function seedViaPostgresUrl(
  postgresUrl: string,
  ids: ReturnType<typeof createIds>,
): void {
  const sqlPath = join(tmpdir(), `cited-seed-${ids.workspaceId}.sql`);
  writeFileSync(sqlPath, buildSeedSql(ids), "utf8");
  try {
    execFileSync("psql", [postgresUrl, "-v", "ON_ERROR_STOP=1", "-f", sqlPath], {
      stdio: ["ignore", "pipe", "pipe"],
    });
  } finally {
    try {
      unlinkSync(sqlPath);
    } catch {
      // ignore cleanup errors
    }
  }
}

function createIds() {
  const responseText =
    "[MOCK SEED] Cited Test Brand is recommended for AI citation monitoring. Source: https://www.cited-test.example/guides/ai-citations. Competitor Labs appears at https://competitor-labs.example/product.";
  return {
    workspaceId: randomUUID(),
    domainId: randomUUID(),
    brandId: randomUUID(),
    promptIds: [randomUUID(), randomUUID(), randomUUID()],
    monitorConfigId: randomUUID(),
    scanRunId: randomUUID(),
    aiResponseId: randomUUID(),
    citationEventIds: [
      randomUUID(),
      randomUUID(),
      randomUUID(),
      randomUUID(),
    ],
    notebookEntryId: randomUUID(),
    now: new Date().toISOString(),
    responseText,
    responseHash: hash(responseText),
  };
}

async function main() {
  loadEnvFile();

  if (
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_PROD_SEED !== "true"
  ) {
    throw new Error(
      "Refusing to seed in production. Set ALLOW_PROD_SEED=true to override.",
    );
  }

  const ids = createIds();
  console.log("Seeding Cited demo workspace...");

  const supabaseUrl = env("SUPABASE_URL", ["NEXT_PUBLIC_SUPABASE_URL"]);
  const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY", ["SUPABASE_SECRET_KEY"]);
  const postgresUrl = env("POSTGRES_URL");

  if (supabaseUrl && serviceKey) {
    await seedViaSupabase(supabaseUrl, serviceKey, ids);
  } else if (postgresUrl) {
    console.log(
      "SUPABASE_SERVICE_ROLE_KEY missing; seeding via POSTGRES_URL + psql.",
    );
    seedViaPostgresUrl(postgresUrl, ids);
  } else {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY) and POSTGRES_URL.",
    );
  }

  console.log("Seed complete.");
  console.log(
    JSON.stringify(
      {
        workspaceId: ids.workspaceId,
        slug: DEMO_SLUG,
        domain: "cited-test.example",
        prompts: ids.promptIds.length,
        citationEvents: ids.citationEventIds.length,
        notebookEntryId: ids.notebookEntryId,
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
