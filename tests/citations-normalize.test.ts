import { describe, expect, it } from "vitest";

import {
  dedupeHostnames,
  dedupeUrls,
  extractHostname,
  getRegistrableDomain,
  HostnameNormalizationError,
  isApprovedDomainMatch,
  isDomainMatch,
  isSubdomainMatch,
  normalizeHostname,
  normalizeUrl,
} from "@/lib/citations/normalize";

describe("normalizeHostname", () => {
  it("normalizes URLs and www hosts", () => {
    expect(normalizeHostname("https://www.thrive.fi/")).toBe("thrive.fi");
    expect(normalizeHostname("www.example.com")).toBe("example.com");
    expect(normalizeHostname("example.com/blog")).toBe("example.com");
  });

  it("rejects malformed hostnames", () => {
    expect(() => normalizeHostname("not a host")).toThrow(
      HostnameNormalizationError,
    );
    expect(() => normalizeHostname("http://localhost")).toThrow(
      HostnameNormalizationError,
    );
  });
});

describe("normalizeUrl", () => {
  it("produces stable comparable URLs", () => {
    expect(normalizeUrl("HTTPS://WWW.Example.com/Path/?q=1#hash")).toBe(
      "https://example.com/Path?q=1",
    );
  });
});

describe("domain matching", () => {
  it("matches exact domains www-insensitively", () => {
    expect(isDomainMatch("www.example.com", "example.com")).toBe(true);
    expect(isDomainMatch("example.com", "example.com")).toBe(true);
  });

  it("prevents false-positive suffix matches", () => {
    expect(isDomainMatch("example.co", "example.com")).toBe(false);
    expect(isDomainMatch("notexample.com", "example.com")).toBe(false);
    expect(isDomainMatch("example.com.fake-site.com", "example.com")).toBe(
      false,
    );
    expect(isSubdomainMatch("example.com.fake-site.com", "example.com")).toBe(
      false,
    );
  });

  it("matches approved subdomains via alias list only for isApprovedDomainMatch", () => {
    expect(isSubdomainMatch("blog.example.com", "example.com")).toBe(true);
    expect(
      isApprovedDomainMatch("blog.example.com", "example.com", []),
    ).toBe(false);
    expect(
      isApprovedDomainMatch("blog.example.com", "example.com", [
        "blog.example.com",
      ]),
    ).toBe(true);
  });
});

describe("helpers", () => {
  it("extracts hostnames and registrable domains", () => {
    expect(extractHostname("https://blog.example.com/a")).toBe(
      "blog.example.com",
    );
    expect(getRegistrableDomain("blog.example.com")).toBe("example.com");
    expect(getRegistrableDomain("shop.example.co.uk")).toBe("example.co.uk");
  });

  it("dedupes hostnames and urls", () => {
    expect(
      dedupeHostnames(["www.example.com", "example.com", "bad host"]),
    ).toEqual(["example.com"]);
    expect(
      dedupeUrls([
        "https://example.com/a/",
        "https://www.example.com/a",
        "not-a-url",
      ]),
    ).toEqual(["https://example.com/a"]);
  });
});
