export const CITED_THEME_STORAGE_KEY = "cited-theme";

export type CitedTheme = "light" | "dark";

export function isCitedTheme(value: unknown): value is CitedTheme {
  return value === "light" || value === "dark";
}

/** Cited is light-only; clear any legacy dark preference before paint. */
export const CITED_THEME_BOOT_SCRIPT = `(function(){try{var k=${JSON.stringify(CITED_THEME_STORAGE_KEY)};localStorage.removeItem(k);var e=document.documentElement;e.classList.remove('dark');e.setAttribute('data-theme','light');e.style.colorScheme='light';}catch(e){}})();`;
