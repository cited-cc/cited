import { NotebookEntryCard } from "@/components/notebook/notebook-entry-card";
import type { NotebookEntryListItem } from "@/lib/notebook/types";
import { cn } from "@/lib/utils";

type NotebookPinnedSectionProps = {
  items: NotebookEntryListItem[];
  className?: string;
};

export function NotebookPinnedSection({
  items,
  className,
}: NotebookPinnedSectionProps) {
  if (items.length === 0) return null;

  return (
    <section className={cn("space-y-3", className)} aria-label="Pinned notes">
      <p className="type-micro text-cited-ink-faint">Pinned</p>
      <ul className="space-y-2">
        {items.map((entry) => (
          <li key={entry.id}>
            <NotebookEntryCard entry={entry} />
          </li>
        ))}
      </ul>
    </section>
  );
}
