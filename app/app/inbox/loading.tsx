import { Skeleton } from "@/components/ui/skeleton";

export default function InboxLoading() {
  return (
    <div className="px-4 py-5 sm:px-6 lg:px-8" aria-busy="true" aria-label="Loading inbox">
      <div className="border-b border-cited-line-subtle pb-5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-8 w-40" />
        <Skeleton className="mt-3 h-4 w-full max-w-xl" />
      </div>

      <div className="mt-4 flex gap-2 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 shrink-0" />
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-md border border-cited-line border-l-2 border-l-cited-line-strong bg-cited-surface-raised p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="mt-3 h-5 w-3/4" />
            <Skeleton className="mt-3 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-2/3" />
            <div className="mt-4 flex justify-between border-t border-cited-line-subtle pt-3">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-6 w-28" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
