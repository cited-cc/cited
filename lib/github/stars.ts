import "server-only";

import { getGitHubRepositorySlug } from "@/lib/github/repository";

const REVALIDATE_SECONDS = 3600;

type GitHubRepoResponse = {
  stargazers_count?: number;
};

export async function getGitHubStarCount(): Promise<number | null> {
  const slug = getGitHubRepositorySlug();
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const token = process.env.GITHUB_TOKEN?.trim();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${slug}`, {
      headers,
      next: { revalidate: REVALIDATE_SECONDS },
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as GitHubRepoResponse;
    return typeof payload.stargazers_count === "number"
      ? payload.stargazers_count
      : null;
  } catch {
    return null;
  }
}
