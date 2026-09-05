type NotebookLinkEventPickerProps = {
  citationEventId?: string | null;
};

/**
 * Lightweight linked-event display for create flows.
 * Full event search picker is deferred; callers pass citationEventId when creating from an event.
 */
export function NotebookLinkEventPicker({
  citationEventId,
}: NotebookLinkEventPickerProps) {
  if (!citationEventId) return null;

  return (
    <div className="rounded-md border border-cited-line-subtle bg-cited-surface px-3 py-2.5">
      <p className="type-micro text-cited-ink-faint">Linked citation note</p>
      <p className="mt-1 font-mono text-xs text-cited-ink">{citationEventId}</p>
    </div>
  );
}
