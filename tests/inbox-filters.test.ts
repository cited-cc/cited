import { describe, expect, it } from "vitest";

import {
  buildInboxHref,
  clearAdvancedFilters,
  countActiveAdvancedFilters,
  normalizeInboxSearch,
  parseInboxSearchParams,
  resolveDateRangeBounds,
  serializeInboxSearchParams,
} from "@/lib/inbox/filters";
import {
  buildNextCursor,
  decodeInboxCursor,
  encodeInboxCursor,
} from "@/lib/inbox/pagination";
import {
  buildEventSummary,
  buildResponseExcerpt,
  eventTypeLabel,
  matchConfidenceLabel,
  serializeInboxEventListItem,
} from "@/lib/inbox/serializers";
import { toSafeHttpsUrl, truncateEvidenceText } from "@/lib/inbox/safe-url";
import { INBOX_PAGE_SIZE, type InboxEventListItem } from "@/lib/inbox/types";
import { sanitizeProductEventPayload } from "@/lib/analytics/product";
import {
  canArchiveInboxEvents,
  canResolveInboxEvents,
  canSaveInboxEvents,
  canTriageInboxEvents,
  canViewInbox,
} from "@/lib/auth/permissions";
import type { Tables } from "@/lib/db/types";

function sampleEvent(
  overrides: Partial<Tables<"citation_events">> = {},
): Tables<"citation_events"> {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    workspace_id: "22222222-2222-4222-8222-222222222222",
    domain_id: "33333333-3333-4333-8333-333333333333",
    brand_id: null,
    scan_run_id: "44444444-4444-4444-8444-444444444444",
    ai_response_id: "55555555-5555-4555-8555-555555555555",
    event_type: "citation",
    status: "new",
    cited_hostname: "cited-test.example",
    cited_url: "https://cited-test.example/guides/ai-citations",
    cited_url_normalized: "https://cited-test.example/guides/ai-citations",
    source_title: "AI citation guide",
    source_snippet: "Cited Test Brand monitors AI citations.",
    citation_position: 1,
    confidence_score: 0.95,
    first_seen_at: "2026-07-01T12:00:00.000Z",
    last_seen_at: "2026-07-08T12:00:00.000Z",
    monitor_configuration_id: null,
    event_fingerprint: "fp-1",
    ai_surface: "chatgpt",
    occurrence_count: 3,
    metadata: {},
    created_at: "2026-07-01T12:00:00.000Z",
    updated_at: "2026-07-08T12:00:00.000Z",
    ...overrides,
  };
}

describe("inbox filter query parsing", () => {
  it("parses valid view and filter params", () => {
    const filters = parseInboxSearchParams({
      view: "citations",
      type: "citation,mention",
      surface: "chatgpt",
      range: "30d",
      prompt: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      q: "  cited test  ",
    });
    expect(filters.view).toBe("citations");
    expect(filters.eventTypes).toEqual(["citation", "mention"]);
    expect(filters.surfaces).toEqual(["chatgpt"]);
    expect(filters.range).toBe("30d");
    expect(filters.promptId).toBe("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
    expect(filters.search).toBe("cited test");
  });

  it("falls back safely on invalid filters", () => {
    const filters = parseInboxSearchParams({
      view: "not-a-view",
      type: "bogus",
      surface: "bing",
      prompt: "not-a-uuid",
      domain: "also-bad",
      range: "custom",
      from: "2010-01-01",
      to: "2099-01-01",
      state: "important",
      has_source: "maybe",
      q: "a".repeat(200),
    });
    expect(filters.view).toBe("all");
    expect(filters.eventTypes).toEqual([]);
    expect(filters.surfaces).toEqual([]);
    expect(filters.promptId).toBeNull();
    expect(filters.domainId).toBeNull();
    expect(filters.range).toBe("all");
    expect(filters.memberStates).toEqual([]);
    expect(filters.hasSourceCitation).toBeNull();
    expect(filters.search?.length).toBeLessThanOrEqual(120);
  });

  it("rejects inverted custom date ranges", () => {
    const filters = parseInboxSearchParams({
      range: "custom",
      from: "2026-07-08",
      to: "2026-07-01",
    });
    expect(filters.range).toBe("all");
    expect(filters.customFrom).toBeNull();
  });

  it("accepts safe custom date ranges", () => {
    const filters = parseInboxSearchParams({
      range: "custom",
      from: "2026-07-01",
      to: "2026-07-08",
    });
    expect(filters.range).toBe("custom");
    const bounds = resolveDateRangeBounds(filters);
    expect(bounds.from).toBe("2026-07-01T00:00:00.000Z");
    expect(bounds.to).toBe("2026-07-08T23:59:59.999Z");
  });

  it("normalizes search input", () => {
    expect(normalizeInboxSearch("  hello\u0000 world  ")).toBe("hello world");
    expect(normalizeInboxSearch("   ")).toBeNull();
  });

  it("serializes and rebuilds href without workspace ids", () => {
    const filters = parseInboxSearchParams({
      view: "saved",
      type: "citation",
      q: "guide",
    });
    const href = buildInboxHref(filters);
    expect(href).toContain("view=saved");
    expect(href).toContain("type=citation");
    expect(href).toContain("q=guide");
    expect(href).not.toContain("workspace");
    const params = serializeInboxSearchParams(filters);
    expect(params.get("view")).toBe("saved");
  });

  it("counts and clears advanced filters", () => {
    const filters = parseInboxSearchParams({
      view: "new",
      type: "citation",
      range: "7d",
      q: "x",
    });
    expect(countActiveAdvancedFilters(filters)).toBe(2);
    const cleared = clearAdvancedFilters(filters);
    expect(cleared.view).toBe("new");
    expect(cleared.eventTypes).toEqual([]);
    expect(cleared.search).toBe("x");
  });
});

describe("inbox cursor pagination", () => {
  it("encodes and decodes a signed cursor", () => {
    const encoded = encodeInboxCursor({
      lastSeenAt: "2026-07-08T12:00:00.000Z",
      id: "11111111-1111-4111-8111-111111111111",
    });
    const decoded = decodeInboxCursor(encoded);
    expect(decoded).toEqual({
      lastSeenAt: "2026-07-08T12:00:00.000Z",
      id: "11111111-1111-4111-8111-111111111111",
    });
  });

  it("rejects tampered or invalid cursors", () => {
    expect(decodeInboxCursor("not-valid")).toBeNull();
    expect(decodeInboxCursor("")).toBeNull();
    const encoded = encodeInboxCursor({
      lastSeenAt: "2026-07-08T12:00:00.000Z",
      id: "11111111-1111-4111-8111-111111111111",
    });
    expect(decodeInboxCursor(`${encoded}x`)).toBeNull();
  });

  it("builds next cursor only when page is full", () => {
    const short = buildNextCursor([
      { lastSeenAt: "2026-07-08T12:00:00.000Z", id: "11111111-1111-4111-8111-111111111111" },
    ]);
    expect(short.hasMore).toBe(false);
    expect(short.nextCursor).toBeNull();

    const full = Array.from({ length: INBOX_PAGE_SIZE }, (_, i) => ({
      lastSeenAt: "2026-07-08T12:00:00.000Z",
      id: `11111111-1111-4111-8111-${String(i).padStart(12, "0")}`,
    }));
    const page = buildNextCursor(full);
    expect(page.hasMore).toBe(true);
    expect(page.nextCursor).toBeTruthy();
  });
});

describe("inbox serializers and safe urls", () => {
  it("serializes list items without unsafe urls", () => {
    const item = serializeInboxEventListItem({
      event: sampleEvent({
        cited_url: "javascript:alert(1)",
        source_snippet: "A".repeat(400),
      }),
      promptText: "What is the best tool?",
      domainHostname: "cited-test.example",
    });
    expect(item.citedUrl).toBeNull();
    expect(item.sourceSnippet?.endsWith("…")).toBe(true);
    expect(item.promptText).toContain("best tool");
  });

  it("builds truthful event summaries", () => {
    const citation: InboxEventListItem = {
      ...serializeInboxEventListItem({
        event: sampleEvent(),
        domainHostname: "cited-test.example",
      }),
    };
    expect(buildEventSummary(citation)).toBe(
      "ChatGPT cited cited-test.example",
    );

    const mention = serializeInboxEventListItem({
      event: sampleEvent({
        event_type: "mention",
        cited_hostname: null,
        cited_url: null,
        ai_surface: "gemini",
      }),
      domainHostname: "Cited Test Brand",
    });
    expect(buildEventSummary(mention)).toBe(
      "Gemini mentioned Cited Test Brand",
    );

    const missed = serializeInboxEventListItem({
      event: sampleEvent({
        event_type: "missed_opportunity",
        cited_hostname: "competitor-labs.example",
      }),
    });
    expect(buildEventSummary(missed)).toContain("competitor");
  });

  it("labels event types exhaustively", () => {
    expect(eventTypeLabel("competitor_citation")).toBe("Competitor citation");
    expect(eventTypeLabel("missed_opportunity")).toBe("Missed opportunity");
  });

  it("rejects unsafe urls and truncates evidence", () => {
    expect(toSafeHttpsUrl("https://cited-test.example/x")).toBe(
      "https://cited-test.example/x",
    );
    expect(toSafeHttpsUrl("http://cited-test.example/x")).toBeNull();
    expect(toSafeHttpsUrl("javascript:alert(1)")).toBeNull();
    expect(toSafeHttpsUrl("data:text/html,hi")).toBeNull();
    expect(truncateEvidenceText("  hello   world  ", 100)).toBe("hello world");
    expect(buildResponseExcerpt(null)).toBeNull();
  });

  it("explains match confidence without opaque scores", () => {
    expect(matchConfidenceLabel(0.95, "citation")).toContain(
      "verified-domain",
    );
    expect(matchConfidenceLabel(null, "citation")).toBeNull();
  });
});

describe("inbox permissions and analytics hygiene", () => {
  it("enforces triage role boundaries", () => {
    expect(canViewInbox("viewer")).toBe(true);
    expect(canTriageInboxEvents("viewer")).toBe(true);
    expect(canSaveInboxEvents("viewer")).toBe(true);
    expect(canArchiveInboxEvents("viewer")).toBe(false);
    expect(canResolveInboxEvents("viewer")).toBe(false);
    expect(canArchiveInboxEvents("member")).toBe(true);
    expect(canResolveInboxEvents("admin")).toBe(true);
  });

  it("strips sensitive analytics payload keys and uuid-like values", () => {
    const dirty = {
      selected_tab: "new",
      filter_category: "advanced",
      event_type_category: "triage",
      workspace_id: "22222222-2222-4222-8222-222222222222",
      prompt: "secret prompt",
    };
    const clean = sanitizeProductEventPayload(
      dirty as Parameters<typeof sanitizeProductEventPayload>[0],
    );
    expect(clean).toEqual({
      selected_tab: "new",
      filter_category: "advanced",
      event_type_category: "triage",
    });
  });
});
