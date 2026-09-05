import repositoryMetadata from "@/config/repository-metadata.json";

export const GITHUB_REPOSITORY_URL =
  repositoryMetadata.repositoryUrl ?? "https://github.com/cited-cc/cited";

export function getGitHubRepositorySlug(): string {
  const { pathname } = new URL(GITHUB_REPOSITORY_URL);
  return pathname.replace(/^\//, "").replace(/\.git$/, "");
}
