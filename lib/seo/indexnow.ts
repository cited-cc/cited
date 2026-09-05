import { buildPublicIndexablePaths } from "@/lib/seo/indexable-paths";
import { ORGANIZATION, absoluteUrl } from "@/lib/seo/site";

/** Default IndexNow key for cited.cc. Override with INDEXNOW_KEY in production if needed. */
export const INDEXNOW_KEY = "a7f3c9e2b1d84f6c";

export function getIndexNowKey(): string {
  return process.env.INDEXNOW_KEY?.trim() || INDEXNOW_KEY;
}

export function getIndexNowKeyLocation(): string {
  return absoluteUrl(`/${getIndexNowKey()}.txt`);
}

export function getIndexNowHost(): string {
  return ORGANIZATION.url.replace(/^https?:\/\//, "");
}

export function getIndexNowUrlList(): string[] {
  return buildPublicIndexablePaths().map((path) => absoluteUrl(path));
}

export type IndexNowSubmissionResult = {
  endpoint: string;
  ok: boolean;
  status: number;
  body: string;
  urlCount: number;
};

const INDEXNOW_ENDPOINTS = [
  "https://api.indexnow.org/indexnow",
  "https://yandex.com/indexnow",
  "https://www.bing.com/indexnow",
  "https://search.seznam.cz/indexnow",
  "https://indexnow.yep.com/indexnow",
] as const;

export async function submitIndexNowToEndpoint(
  endpoint: string,
  urlList: string[] = getIndexNowUrlList(),
): Promise<IndexNowSubmissionResult> {
  const key = getIndexNowKey();
  const payload = {
    host: getIndexNowHost(),
    key,
    keyLocation: getIndexNowKeyLocation(),
    urlList,
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(payload),
  });

  const body = await response.text();

  return {
    endpoint,
    ok: response.ok || response.status === 202,
    status: response.status,
    body,
    urlCount: urlList.length,
  };
}

export async function submitIndexNow(
  urlList: string[] = getIndexNowUrlList(),
): Promise<IndexNowSubmissionResult[]> {
  return Promise.all(
    INDEXNOW_ENDPOINTS.map((endpoint) =>
      submitIndexNowToEndpoint(endpoint, urlList),
    ),
  );
}

/** True when at least one IndexNow endpoint accepted the submission. */
export function indexNowSubmissionSucceeded(
  results: IndexNowSubmissionResult[],
): boolean {
  return results.some((result) => result.ok);
}

export type SearchPingResult = {
  ok: boolean;
  status: number;
  body: string;
  deprecated?: boolean;
};

export async function pingSearchEngineSitemap(
  engine: "google" | "bing",
  sitemapUrl: string,
): Promise<SearchPingResult> {
  const pingUrl =
    engine === "google"
      ? `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`
      : `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;

  const response = await fetch(pingUrl, { method: "GET" });
  const body = await response.text();

  return {
    ok: response.ok,
    status: response.status,
    body,
    deprecated: response.status === 404 || response.status === 410,
  };
}

export async function verifyIndexNowKeyFile(): Promise<boolean> {
  const response = await fetch(getIndexNowKeyLocation(), { method: "GET" });
  if (!response.ok) return false;
  const body = await response.text();
  return body === getIndexNowKey();
}
