import { Skeleton } from "@/components/ui/skeleton";

export default function NotebookEntryLoading() {
  return (
    <div
      className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 lg:px-8"
      aria-busy="true"
      aria-label="Loading note"
    >
      <Skeleton className="h-8 w-36" />
      <Skeleton className="mt-6 h-4 w-28" />
      <Skeleton className="mt-3 h-8 w-2/3" />
      <Skeleton className="mt-4 h-8 w-48" />
      <Skeleton className="mt-8 h-40 w-full" />
    </div>
  );
}
