import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function InboxEventNotFound() {
  return (
    <div className="px-4 py-10 sm:px-6 lg:px-8">
      <EmptyState
        title="Citation note not found."
        description="This note is unavailable in your workspace, or the link is no longer valid."
        action={
          <Button href="/app/inbox" variant="secondary" size="sm">
            Back to Inbox
          </Button>
        }
      />
    </div>
  );
}
