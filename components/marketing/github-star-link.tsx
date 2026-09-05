import { Star } from "lucide-react";

import { GITHUB_REPOSITORY_URL } from "@/lib/github/repository";
import { formatStarCount } from "@/lib/github/format-star-count";
import { cn } from "@/lib/utils";

type GitHubStarLinkProps = {
  starCount: number | null;
  className?: string;
};

export function GitHubStarLink({ starCount, className }: GitHubStarLinkProps) {
  const label =
    starCount != null
      ? `Star Cited on GitHub (${starCount.toLocaleString("en-US")} stars)`
      : "Star Cited on GitHub";

  return (
    <a
      href={GITHUB_REPOSITORY_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className={cn(
        "inline-flex h-8 min-h-8 items-center gap-1.5 rounded-md border border-white/15 px-2.5 text-[13px] font-medium text-cited-on-inverse-muted transition hover:bg-white/10 hover:text-cited-on-inverse sm:text-sm",
        className,
      )}
    >
      <Star className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>{starCount != null ? formatStarCount(starCount) : "Star"}</span>
    </a>
  );
}
