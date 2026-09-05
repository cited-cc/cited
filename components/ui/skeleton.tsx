import { cn } from "@/lib/utils";

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-cited-surface-hover/70",
        "after:absolute after:inset-0 after:-translate-x-full after:bg-gradient-to-r after:from-transparent after:via-cited-ink/5 after:to-transparent",
        "motion-safe:after:animate-[cited-skeleton_1.4s_ease-in-out_infinite]",
        className,
      )}
      aria-hidden
    />
  );
}
