import { describe, expect, it } from "vitest";

import {
  assertSafeChangeLabel,
  buildResponseFingerprint,
  buildSourceFingerprint,
  detectMaterialChange,
  FORBIDDEN_CHANGE_LANGUAGE,
  materialChangeResult,
} from "@/lib/evidence/material-change";
import {
  hashTargetText,
  validateAnnotationBody,
  validateResponseAnchor,
} from "@/lib/evidence/annotation-validation";
import {
  buildOccurrencePage,
  findPriorOccurrence,
  isEarliestOccurrence,
  selectOccurrence,
} from "@/lib/evidence/occurrence-history";
import {
  buildEvidenceHighlights,
  serializeEvidenceSource,
} from "@/lib/evidence/serializers";
import { toSafeHttpsUrl } from "@/lib/inbox/safe-url";
import { sanitizeProductEventPayload } from "@/lib/analytics/product";
import {
  canCreateAnnotations,
  canCreateNotebookEntries,
  canViewNotebook,
} from "@/lib/auth/permissions";
import {
  canEditNotebookEntry,
  canViewNotebookEntry,
} from "@/lib/notebook/permissions";
import {
  normalizeNotebookSearch,
  parseNotebookSearchParams,
  buildNotebookHref,
} from "@/lib/notebook/query-state";
import {
  normalizeNotebookBody,
  normalizeNotebookTitle,
} from "@/lib/notebook/serializers";
import { validateNotebookContent } from "@/lib/notebook/revisions";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Tables } from "@/lib/db/types";

function sampleOccurrence(
  overrides: Partial<Tables<"citation_event_occurrences">> = {},
): Tables<"citation_event_occurrences"> {
  return {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    workspace_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    citation_event_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    scan_run_id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    ai_response_id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
    observed_at: "2026-07-08T12:00:00.000Z",
    event_type: "citation",
    source_url_normalized: "https://cited-test.example/guides/ai",
    source_hostname: "cited-test.example",
    source_title: "AI guide",
    source_snippet: "Cited Test Brand",
    citation_position: 1,
    confidence_score: 0.95,
    evidence_hash: "hash-a",
    source_fingerprint: null,
    response_fingerprint: null,
    is_material_change: null,
    change_summary: null,
    created_at: "2026-07-08T12:00:00.000Z",
    ...overrides,
  };
}

describe("material change detection", () => {
  it("labels first observation", () => {
    const result = detectMaterialChange({
      current: {
        sourceUrlNormalized: "https://cited-test.example/a",
        sourceHostname: "cited-test.example",
        citationPosition: 1,
        evidenceHash: "h1",
        sourceFingerprint: "sf1",
        responseFingerprint: "rf1",
      },
      prior: null,
      isFirstObservation: true,
    });
    expect(result.kind).toBe("first_observation");
    expect(result.label).toBe("First observed by Cited");
    expect(assertSafeChangeLabel(result.label)).toBe(true);
  });

  it("detects observed again when nothing changed", () => {
    const fields = {
      sourceUrlNormalized: "https://cited-test.example/a",
      sourceHostname: "cited-test.example",
      citationPosition: 1,
      evidenceHash: "h1",
      sourceFingerprint: "sf1",
      responseFingerprint: "rf1",
    };
    const result = detectMaterialChange({
      current: fields,
      prior: fields,
      isFirstObservation: false,
    });
    expect(result.kind).toBe("observed_again");
    expect(result.isMaterialChange).toBe(false);
  });

  it("detects source URL change", () => {
    const result = detectMaterialChange({
      current: {
        sourceUrlNormalized: "https://cited-test.example/b",
        sourceHostname: "cited-test.example",
        citationPosition: 1,
        evidenceHash: "h1",
        sourceFingerprint: "sf2",
        responseFingerprint: "rf1",
      },
      prior: {
        sourceUrlNormalized: "https://cited-test.example/a",
        sourceHostname: "cited-test.example",
        citationPosition: 1,
        evidenceHash: "h1",
        sourceFingerprint: "sf1",
        responseFingerprint: "rf1",
      },
      isFirstObservation: false,
    });
    expect(result.kind).toBe("source_url_changed");
    expect(result.label).toBe("Source URL changed");
  });

  it("detects source hostname change", () => {
    const result = detectMaterialChange({
      current: {
        sourceUrlNormalized: null,
        sourceHostname: "other-test.example",
        citationPosition: 1,
        evidenceHash: "h1",
        sourceFingerprint: "sf2",
        responseFingerprint: "rf1",
      },
      prior: {
        sourceUrlNormalized: null,
        sourceHostname: "cited-test.example",
        citationPosition: 1,
        evidenceHash: "h1",
        sourceFingerprint: "sf1",
        responseFingerprint: "rf1",
      },
      isFirstObservation: false,
    });
    expect(result.kind).toBe("source_hostname_changed");
  });

  it("detects citation position change", () => {
    const result = detectMaterialChange({
      current: {
        sourceUrlNormalized: "https://cited-test.example/a",
        sourceHostname: "cited-test.example",
        citationPosition: 3,
        evidenceHash: "h1",
        sourceFingerprint: "sf1",
        responseFingerprint: "rf1",
      },
      prior: {
        sourceUrlNormalized: "https://cited-test.example/a",
        sourceHostname: "cited-test.example",
        citationPosition: 1,
        evidenceHash: "h1",
        sourceFingerprint: "sf1",
        responseFingerprint: "rf1",
      },
      isFirstObservation: false,
    });
    expect(result.kind).toBe("citation_position_changed");
  });

  it("detects evidence text change", () => {
    const result = detectMaterialChange({
      current: {
        sourceUrlNormalized: "https://cited-test.example/a",
        sourceHostname: "cited-test.example",
        citationPosition: 1,
        evidenceHash: "h2",
        sourceFingerprint: "sf1",
        responseFingerprint: "rf1",
      },
      prior: {
        sourceUrlNormalized: "https://cited-test.example/a",
        sourceHostname: "cited-test.example",
        citationPosition: 1,
        evidenceHash: "h1",
        sourceFingerprint: "sf1",
        responseFingerprint: "rf1",
      },
      isFirstObservation: false,
    });
    expect(result.kind).toBe("evidence_text_changed");
  });

  it("detects response change when evidence hash matches", () => {
    const result = detectMaterialChange({
      current: {
        sourceUrlNormalized: "https://cited-test.example/a",
        sourceHostname: "cited-test.example",
        citationPosition: 1,
        evidenceHash: "h1",
        sourceFingerprint: "sf1",
        responseFingerprint: "rf2",
      },
      prior: {
        sourceUrlNormalized: "https://cited-test.example/a",
        sourceHostname: "cited-test.example",
        citationPosition: 1,
        evidenceHash: "h1",
        sourceFingerprint: "sf1",
        responseFingerprint: "rf1",
      },
      isFirstObservation: false,
    });
    expect(result.kind).toBe("response_changed");
  });

  it("returns comparison unavailable when prior lacks comparable fields", () => {
    const result = detectMaterialChange({
      current: {
        sourceUrlNormalized: null,
        sourceHostname: null,
        citationPosition: null,
        evidenceHash: null,
        sourceFingerprint: null,
        responseFingerprint: null,
      },
      prior: {
        sourceUrlNormalized: null,
        sourceHostname: null,
        citationPosition: null,
        evidenceHash: null,
        sourceFingerprint: null,
        responseFingerprint: null,
      },
      isFirstObservation: false,
    });
    expect(result.kind).toBe("comparison_unavailable");
  });

  it("never uses causal or quality language", () => {
    const kinds = [
      "first_observation",
      "observed_again",
      "source_url_changed",
      "source_hostname_changed",
      "citation_position_changed",
      "evidence_text_changed",
      "response_changed",
      "comparison_unavailable",
    ] as const;
    for (const kind of kinds) {
      const result = materialChangeResult(kind);
      expect(assertSafeChangeLabel(result.label)).toBe(true);
      expect(assertSafeChangeLabel(result.summary)).toBe(true);
      for (const word of FORBIDDEN_CHANGE_LANGUAGE) {
        expect(result.label.toLowerCase()).not.toContain(word);
        expect(result.summary.toLowerCase()).not.toContain(word);
      }
    }
  });

  it("builds deterministic fingerprints", () => {
    const a = buildSourceFingerprint({
      sourceUrlNormalized: "https://cited-test.example/a",
      sourceHostname: "cited-test.example",
      citationPosition: 1,
    });
    const b = buildSourceFingerprint({
      sourceUrlNormalized: "https://cited-test.example/a",
      sourceHostname: "cited-test.example",
      citationPosition: 1,
    });
    expect(a).toBe(b);
    expect(buildResponseFingerprint({ evidenceHash: "h1" })).toBe("h1");
  });
});

describe("occurrence selection and pagination", () => {
  const rows = [
    sampleOccurrence({
      id: "11111111-1111-4111-8111-111111111111",
      observed_at: "2026-07-08T12:00:00.000Z",
    }),
    sampleOccurrence({
      id: "22222222-2222-4222-8222-222222222222",
      observed_at: "2026-07-05T12:00:00.000Z",
    }),
    sampleOccurrence({
      id: "33333333-3333-4333-8333-333333333333",
      observed_at: "2026-07-01T12:00:00.000Z",
    }),
  ];

  it("defaults to latest occurrence", () => {
    const selected = selectOccurrence({
      occurrencesNewestFirst: rows,
      requestedId: null,
    });
    expect(selected?.id).toBe(rows[0]!.id);
  });

  it("selects requested occurrence when valid", () => {
    const selected = selectOccurrence({
      occurrencesNewestFirst: rows,
      requestedId: rows[2]!.id,
    });
    expect(selected?.id).toBe(rows[2]!.id);
  });

  it("falls back to latest for invalid occurrence id", () => {
    const selected = selectOccurrence({
      occurrencesNewestFirst: rows,
      requestedId: "99999999-9999-4999-8999-999999999999",
    });
    expect(selected?.id).toBe(rows[0]!.id);
  });

  it("finds prior and earliest correctly", () => {
    expect(findPriorOccurrence(rows, rows[0]!.id)?.id).toBe(rows[1]!.id);
    expect(isEarliestOccurrence(rows, rows[2]!.id)).toBe(true);
    expect(isEarliestOccurrence(rows, rows[0]!.id)).toBe(false);
  });

  it("paginates without duplicating rows", () => {
    const many = Array.from({ length: 15 }, (_, i) =>
      sampleOccurrence({
        id: `aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaa${i.toString(16).padStart(3, "0")}`,
        observed_at: new Date(Date.UTC(2026, 6, 15 - i)).toISOString(),
      }),
    );
    const page = buildOccurrencePage({ rows: many, pageSize: 12 });
    expect(page.items).toHaveLength(12);
    expect(page.hasMore).toBe(true);
    expect(page.nextCursor).toBeTruthy();
    const ids = new Set(page.items.map((r) => r.id));
    expect(ids.size).toBe(12);
  });
});

describe("annotation validation", () => {
  const responseText =
    "Cited Test Brand is a useful AI citation monitor for startups.";

  it("accepts exact selection offsets", () => {
    const selected = "Cited Test Brand";
    const start = responseText.indexOf(selected);
    const result = validateResponseAnchor({
      responseText,
      anchorStart: start,
      anchorEnd: start + selected.length,
      selectedText: selected,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.anchorText).toBe(selected);
      expect(result.targetTextHash).toBe(hashTargetText(responseText));
    }
  });

  it("rejects mismatched selected text", () => {
    const result = validateResponseAnchor({
      responseText,
      anchorStart: 0,
      anchorEnd: 5,
      selectedText: "WRONG",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("could not be saved");
    }
  });

  it("rejects invalid offsets", () => {
    const result = validateResponseAnchor({
      responseText,
      anchorStart: 10,
      anchorEnd: 5,
      selectedText: "x",
    });
    expect(result.ok).toBe(false);
  });

  it("enforces annotation body length", () => {
    expect(validateAnnotationBody("").ok).toBe(false);
    expect(validateAnnotationBody("  note  ").ok).toBe(true);
    expect(validateAnnotationBody("x".repeat(4001)).ok).toBe(false);
  });
});

describe("evidence source safety", () => {
  it("rejects unsafe URLs", () => {
    expect(toSafeHttpsUrl("javascript:alert(1)")).toBeNull();
    expect(toSafeHttpsUrl("http://cited-test.example")).toBeNull();
    expect(toSafeHttpsUrl("https://cited-test.example/path")).toBe(
      "https://cited-test.example/path",
    );
  });

  it("serializes evidence without fabricating titles", () => {
    const item = serializeEvidenceSource({
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      citation_event_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      evidence_type: "source_link",
      evidence_text: "snippet",
      evidence_url: "https://cited-test.example/a",
      evidence_position: 1,
      metadata: {},
      created_at: "2026-07-08T12:00:00.000Z",
    });
    expect(item.url).toBe("https://cited-test.example/a");
    expect(item.hostname).toBe("cited-test.example");
    expect(item.title).toBeNull();
  });

  it("builds non-overlapping highlights", () => {
    const text =
      "Cited Test Brand monitors AI citations at cited-test.example.";
    const spans = buildEvidenceHighlights({
      responseText: text,
      eventType: "mention",
      sources: [
        {
          id: "1",
          type: "brand_match",
          text: "Cited Test Brand",
          url: null,
          title: null,
          position: null,
          hostname: null,
        },
      ],
      citedHostname: null,
      brandName: "Cited Test Brand",
    });
    expect(spans.length).toBeGreaterThan(0);
    expect(spans[0]!.kind).toBe("brand");
  });
});

describe("evidence rendering safety", () => {
  it("does not use dangerouslySetInnerHTML in evidence components", () => {
    const dir = join(process.cwd(), "components/evidence");
    const files = [
      "evidence-transcript.tsx",
      "monitored-response-card.tsx",
      "source-evidence-card.tsx",
      "annotation-card.tsx",
      "annotation-composer.tsx",
    ];
    for (const file of files) {
      const src = readFileSync(join(dir, file), "utf8");
      expect(src).not.toContain("dangerouslySetInnerHTML");
    }
  });
});

describe("notebook permissions and filters", () => {
  it("hides private notes from non-authors", () => {
    expect(
      canViewNotebookEntry({
        role: "member",
        visibility: "private",
        authorClerkUserId: "user-a",
        currentUserId: "user-b",
      }),
    ).toBe(false);
    expect(
      canViewNotebookEntry({
        role: "member",
        visibility: "private",
        authorClerkUserId: "user-a",
        currentUserId: "user-a",
      }),
    ).toBe(true);
  });

  it("restricts viewers from creating notes and annotations", () => {
    expect(canViewNotebook("viewer")).toBe(true);
    expect(canCreateNotebookEntries("viewer")).toBe(false);
    expect(canCreateAnnotations("viewer")).toBe(false);
    expect(canCreateNotebookEntries("member")).toBe(true);
  });

  it("only authors edit their notes", () => {
    expect(
      canEditNotebookEntry({
        role: "admin",
        authorClerkUserId: "user-a",
        currentUserId: "user-b",
      }),
    ).toBe(false);
  });

  it("parses notebook query state safely", () => {
    const filters = parseNotebookSearchParams({
      view: "pinned",
      visibility: "workspace",
      type: "citation",
      surface: "chatgpt",
      q: "  cited test  ",
    });
    expect(filters.view).toBe("pinned");
    expect(filters.visibility).toBe("workspace");
    expect(filters.eventType).toBe("citation");
    expect(filters.surface).toBe("chatgpt");
    expect(filters.search).toBe("cited test");
    expect(buildNotebookHref(filters)).toContain("view=pinned");
  });

  it("normalizes notebook content", () => {
    expect(normalizeNotebookTitle("  Hello   world  ")).toBe("Hello world");
    expect(normalizeNotebookBody("a\r\nb")).toBe("a\nb");
    expect(normalizeNotebookSearch("  x  ")).toBe("x");
    expect(validateNotebookContent({ title: "", body: "x" }).ok).toBe(false);
    expect(
      validateNotebookContent({ title: "Note", body: "Body" }).ok,
    ).toBe(true);
  });
});

describe("analytics hygiene", () => {
  it("strips note bodies, prompts, and ids from payloads", () => {
    const clean = sanitizeProductEventPayload({
      annotation_target_kind: "response",
      visibility_category: "workspace",
      ...({
        prompt: "best AI SEO tools",
        body: "secret note",
        workspace_id: "11111111-1111-4111-8111-111111111111",
      } as Record<string, string>),
    } as Parameters<typeof sanitizeProductEventPayload>[0]);
    expect(clean).toEqual({
      annotation_target_kind: "response",
      visibility_category: "workspace",
    });
  });
});
