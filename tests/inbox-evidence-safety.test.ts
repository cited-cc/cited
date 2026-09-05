import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { HighlightedEvidence } from "@/components/shared/highlighted-evidence";
import { normalizeProviderText } from "@/lib/evidence/provider-text";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const INBOX_COMPONENT_GLOBS = [
  "components/inbox/inbox-event-preview-panel.tsx",
  "components/inbox/inbox-event-focused-note.tsx",
  "components/inbox/source-evidence-card.tsx",
  "components/inbox/inbox-event-note-card.tsx",
  "components/shared/highlighted-evidence.tsx",
];

describe("inbox evidence rendering safety", () => {
  it("does not use dangerouslySetInnerHTML in evidence components", () => {
    for (const relative of INBOX_COMPONENT_GLOBS) {
      const source = readFileSync(join(process.cwd(), relative), "utf8");
      expect(source).not.toContain("dangerouslySetInnerHTML");
    }
  });

  it("renders provider html-looking text as escaped text only", () => {
    const raw = '<script>alert("x")</script> cited-test.example';
    const text = normalizeProviderText(raw);
    const citationStart = text.indexOf("cited-test.example");
    const html = renderToStaticMarkup(
      createElement(HighlightedEvidence, {
        text: raw,
        matches: [
          {
            start: citationStart,
            end: citationStart + "cited-test.example".length,
            type: "citation" as const,
          },
        ],
      }),
    );
    expect(html).not.toContain("<script>");
    expect(html).toContain("cited-test.example");
  });

  it("mention and missed-opportunity copy stays truthful in source card source", () => {
    const source = readFileSync(
      join(process.cwd(), "components/inbox/source-evidence-card.tsx"),
      "utf8",
    );
    expect(source).toContain(
      "No direct source citation was detected",
    );
    expect(source).toContain(
      "Your verified domain was absent from this monitored result",
    );
    expect(source).not.toContain("Strong signal");
  });
});
