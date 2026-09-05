/** Shared response headers for crawler and AI discovery files. */
export const DISCOVERY_TEXT_HEADERS = {
  "Content-Type": "text/plain; charset=utf-8",
  "Cache-Control": "public, max-age=3600",
  "Cross-Origin-Resource-Policy": "cross-origin",
} as const;
