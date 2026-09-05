import { Skeleton } from "@/components/ui/skeleton";

export default function InboxEventLoading() {
  return (
    <div
      className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8"
      aria-busy="true"
      aria-label="Loading citation note"
    >
      <Skeleton className="h-8 w-28" />
      <div className="mt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-10">
        <div>
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-3 h-8 w-3/4" />
          <Skeleton className="mt-4 h-3 w-64" />
          <Skeleton className="mt-8 h-20 w-full" />
          <Skeleton className="mt-8 h-3 w-16" />
          <Skeleton className="mt-2 h-40 w-full" />
          <Skeleton className="mt-8 h-32 w-full" />
        </div>
        <div className="mt-8 hidden space-y-4 lg:mt-0 lg:block">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="mt-6 h-3 w-24" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    </div>
  );
}
