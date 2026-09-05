import { BookMarked } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AnnotationEmptyStateProps = {
  canAnnotate: boolean;
  onAdd?: () => void;
  className?: string;
};

export function AnnotationEmptyState({
  canAnnotate,
  onAdd,
  className,
}: AnnotationEmptyStateProps) {
  return (
    <EmptyState
      className={cn("px-4 py-6", className)}
      title="No annotations yet"
      description="Mark a passage, source, or the whole note when something matters. Annotations stay with the evidence."
      icon={<BookMarked className="h-6 w-6" aria-hidden />}
      action={
        canAnnotate && onAdd ? (
          <Button type="button" variant="secondary" size="sm" onClick={onAdd}>
            Add annotation
          </Button>
        ) : null
      }
    />
  );
}
