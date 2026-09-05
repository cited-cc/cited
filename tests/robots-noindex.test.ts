import { describe, expect, it } from "vitest";

import robots from "@/app/robots";
import { buildPageMetadata } from "@/lib/seo/metadata";

describe("private route indexing", () => {
  it("marks subprocessors metadata as noindex when defined", () => {
    const meta = buildPageMetadata("subprocessors");
    expect(meta.robots).toEqual({ index: false, follow: false });
  });

  it("disallows all crawlers in community edition robots output", () => {
    const result = robots();
    expect(result.rules).toEqual({
      userAgent: "*",
      disallow: "/",
    });
  });
});
