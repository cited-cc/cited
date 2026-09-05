import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  CITED_THEME_BOOT_SCRIPT,
  CITED_THEME_STORAGE_KEY,
  isCitedTheme,
} from "@/lib/theme/theme";

function readSource(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("theme system", () => {
  it("boots light-only and clears legacy storage", () => {
    expect(CITED_THEME_STORAGE_KEY).toBe("cited-theme");
    expect(CITED_THEME_BOOT_SCRIPT).toContain(CITED_THEME_STORAGE_KEY);
    expect(CITED_THEME_BOOT_SCRIPT).toContain("removeItem");
    expect(CITED_THEME_BOOT_SCRIPT).toContain("data-theme','light'");
    expect(CITED_THEME_BOOT_SCRIPT).toContain("classList.remove('dark')");
  });

  it("narrows theme values", () => {
    expect(isCitedTheme("light")).toBe(true);
    expect(isCitedTheme("dark")).toBe(true);
    expect(isCitedTheme("system")).toBe(false);
    expect(isCitedTheme(null)).toBe(false);
  });

  it("locks layout to light and removes theme toggles from chrome", () => {
    const layout = readSource("app/layout.tsx");
    const header = readSource("components/marketing/marketing-header.tsx");
    const sidebar = readSource("components/app/app-sidebar.tsx");

    expect(layout).toContain('data-theme="light"');
    expect(layout).toContain('colorScheme: "light"');
    expect(layout).toContain("cited-theme-boot");
    expect(layout).toContain("beforeInteractive");
    expect(layout).not.toContain("ThemeProvider");
    expect(header).not.toContain("ThemeToggle");
    expect(sidebar).not.toContain("ThemeToggle");
  });
});
