import { getNotificationsBaseUrl } from "@/lib/env";

export function buildAppAbsoluteUrl(path: string): string {
  const base = getNotificationsBaseUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}
