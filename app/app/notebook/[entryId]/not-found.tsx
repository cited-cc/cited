import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export default function NotebookEntryNotFound() {
  return (
    <div className="px-4 py-10 sm:px-6 lg:px-8">
      <EmptyState
        title="Note not found"
        description="This notebook note may have been deleted, or you do not have access to it."
        action={
          <Button href="/app/notebook" variant="secondary" size="sm">
            Back to Notebook
          </Button>
        }
      />
    </div>
  );
}
