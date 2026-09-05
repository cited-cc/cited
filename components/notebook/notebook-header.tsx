import { AppPageHeader } from "@/components/app/app-page-header";
import { Button } from "@/components/ui/button";

type NotebookHeaderProps = {
  canCreate: boolean;
  onCreate?: () => void;
  createHref?: string;
};

export function NotebookHeader({
  canCreate,
  onCreate,
  createHref,
}: NotebookHeaderProps) {
  return (
    <AppPageHeader
      eyebrow="Saved evidence"
      title="Notebook"
      description="Keep the proof behind the moments that matter."
      actions={
        canCreate ? (
          createHref ? (
            <Button href={createHref} variant="primary" size="sm">
              New note
            </Button>
          ) : (
            <Button type="button" variant="primary" size="sm" onClick={onCreate}>
              New note
            </Button>
          )
        ) : null
      }
    />
  );
}
