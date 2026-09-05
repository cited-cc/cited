"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { SURFACE_LABELS } from "@/components/shared/ai-surface-badge";
import { trackProductEvent } from "@/lib/analytics/product";
import {
  buildInboxHref,
  clearAdvancedFilters,
} from "@/lib/inbox/filters";
import { eventTypeLabel } from "@/lib/inbox/serializers";
import {
  INBOX_DATE_RANGES,
  INBOX_EVENT_TYPE_FILTERS,
  INBOX_MEMBER_STATE_FILTERS,
  type InboxDateRange,
  type InboxFilterOptions,
  type InboxFilters,
  type InboxMemberStateFilter,
} from "@/lib/inbox/types";
import type { AiSurfaceKey, CitationEventType } from "@/types/product";
import { cn } from "@/lib/utils";

type InboxFilterSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: InboxFilters;
  options: InboxFilterOptions;
};

const RANGE_LABELS: Record<InboxDateRange, string> = {
  today: "Today",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  all: "All time",
  custom: "Custom range",
};

const STATE_LABELS: Record<InboxMemberStateFilter, string> = {
  unread: "Unread",
  seen: "Seen",
  saved: "Saved",
  archived: "Archived",
  resolved: "Resolved",
  open: "Open",
};

function InboxFilterSheetPanel({
  filters,
  options,
  onOpenChange,
}: {
  filters: InboxFilters;
  options: InboxFilterOptions;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [, startTransition] = useTransition();
  const [draft, setDraft] = useState<InboxFilters>(filters);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current
      ?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      ?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus();
    };
  }, [onOpenChange]);

  function toggleType(type: CitationEventType) {
    setDraft((prev) => ({
      ...prev,
      eventTypes: prev.eventTypes.includes(type)
        ? prev.eventTypes.filter((t) => t !== type)
        : [...prev.eventTypes, type],
    }));
  }

  function toggleSurface(surface: AiSurfaceKey) {
    setDraft((prev) => ({
      ...prev,
      surfaces: prev.surfaces.includes(surface)
        ? prev.surfaces.filter((s) => s !== surface)
        : [...prev.surfaces, surface],
    }));
  }

  function toggleState(state: InboxMemberStateFilter) {
    setDraft((prev) => ({
      ...prev,
      memberStates: prev.memberStates.includes(state)
        ? prev.memberStates.filter((s) => s !== state)
        : [...prev.memberStates, state],
    }));
  }

  function apply() {
    trackProductEvent("inbox_filter_applied", {
      filter_category: "advanced",
    });
    startTransition(() => {
      router.push(
        buildInboxHref(draft, { cursor: null, selectedEventId: null }),
        { scroll: false },
      );
      onOpenChange(false);
    });
  }

  function clear() {
    const next = clearAdvancedFilters(filters);
    setDraft(next);
    startTransition(() => {
      router.push(
        buildInboxHref(next, { cursor: null, selectedEventId: null }),
        { scroll: false },
      );
      onOpenChange(false);
    });
  }

  const availableSurfaces =
    options.surfaces.length > 0
      ? options.surfaces
      : (Object.keys(SURFACE_LABELS) as AiSurfaceKey[]);

  return (
    <div className="fixed inset-0 z-[60]">
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        aria-label="Close filters"
        onClick={() => onOpenChange(false)}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-lg border border-cited-line bg-cited-canvas-elevated cited-overlay-shadow sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[min(100%,420px)] sm:rounded-none sm:border-l",
        )}
      >
        <div className="flex items-center justify-between border-b border-cited-line-subtle px-4 py-3">
          <h2 id={titleId} className="type-title">
            Filters
          </h2>
          <IconButton
            label="Close filters"
            icon={<X className="h-4 w-4" />}
            onClick={() => onOpenChange(false)}
          />
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
          <fieldset>
            <legend className="type-micro text-cited-ink-faint">Event type</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {INBOX_EVENT_TYPE_FILTERS.map((type) => {
                const selected = draft.eventTypes.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    aria-pressed={selected}
                    className={cn(
                      "rounded-sm border px-2.5 py-1.5 text-xs transition",
                      selected
                        ? "border-cited-accent/40 bg-cited-accent-muted text-cited-ink-strong"
                        : "border-cited-line text-cited-ink-muted hover:border-cited-line-strong",
                    )}
                    onClick={() => toggleType(type)}
                  >
                    {eventTypeLabel(type)}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className="type-micro text-cited-ink-faint">AI surface</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {availableSurfaces.map((surface) => {
                const selected = draft.surfaces.includes(surface);
                return (
                  <button
                    key={surface}
                    type="button"
                    aria-pressed={selected}
                    className={cn(
                      "rounded-sm border px-2.5 py-1.5 text-xs transition",
                      selected
                        ? "border-cited-accent/40 bg-cited-accent-muted text-cited-ink-strong"
                        : "border-cited-line text-cited-ink-muted hover:border-cited-line-strong",
                    )}
                    onClick={() => toggleSurface(surface)}
                  >
                    {SURFACE_LABELS[surface]}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div>
            <label className="type-micro text-cited-ink-faint" htmlFor="inbox-domain">
              Domain
            </label>
            <select
              id="inbox-domain"
              className="mt-2 h-9 w-full rounded-md border border-cited-line bg-cited-surface px-2 text-sm text-cited-ink"
              value={draft.domainId ?? ""}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  domainId: e.target.value || null,
                }))
              }
            >
              <option value="">All domains</option>
              {options.domains.map((domain) => (
                <option key={domain.id} value={domain.id}>
                  {domain.hostname}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="type-micro text-cited-ink-faint" htmlFor="inbox-prompt">
              Monitored prompt
            </label>
            <select
              id="inbox-prompt"
              className="mt-2 h-9 w-full rounded-md border border-cited-line bg-cited-surface px-2 text-sm text-cited-ink"
              value={draft.promptId ?? ""}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  promptId: e.target.value || null,
                }))
              }
            >
              <option value="">All prompts</option>
              {options.prompts.map((prompt) => (
                <option key={prompt.id} value={prompt.id}>
                  {prompt.name}
                </option>
              ))}
            </select>
          </div>

          <fieldset>
            <legend className="type-micro text-cited-ink-faint">Date range</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {INBOX_DATE_RANGES.map((range) => {
                const selected = draft.range === range;
                return (
                  <button
                    key={range}
                    type="button"
                    aria-pressed={selected}
                    className={cn(
                      "rounded-sm border px-2.5 py-1.5 text-xs transition",
                      selected
                        ? "border-cited-accent/40 bg-cited-accent-muted text-cited-ink-strong"
                        : "border-cited-line text-cited-ink-muted hover:border-cited-line-strong",
                    )}
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        range,
                        customFrom: range === "custom" ? prev.customFrom : null,
                        customTo: range === "custom" ? prev.customTo : null,
                      }))
                    }
                  >
                    {RANGE_LABELS[range]}
                  </button>
                );
              })}
            </div>
            {draft.range === "custom" ? (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div>
                  <label className="type-micro text-cited-ink-faint" htmlFor="inbox-from">
                    From (UTC)
                  </label>
                  <input
                    id="inbox-from"
                    type="date"
                    className="mt-1 h-9 w-full rounded-md border border-cited-line bg-cited-surface px-2 text-sm"
                    value={draft.customFrom ?? ""}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        customFrom: e.target.value || null,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="type-micro text-cited-ink-faint" htmlFor="inbox-to">
                    To (UTC)
                  </label>
                  <input
                    id="inbox-to"
                    type="date"
                    className="mt-1 h-9 w-full rounded-md border border-cited-line bg-cited-surface px-2 text-sm"
                    value={draft.customTo ?? ""}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        customTo: e.target.value || null,
                      }))
                    }
                  />
                </div>
              </div>
            ) : null}
          </fieldset>

          <fieldset>
            <legend className="type-micro text-cited-ink-faint">State</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {INBOX_MEMBER_STATE_FILTERS.map((state) => {
                const selected = draft.memberStates.includes(state);
                return (
                  <button
                    key={state}
                    type="button"
                    aria-pressed={selected}
                    className={cn(
                      "rounded-sm border px-2.5 py-1.5 text-xs transition",
                      selected
                        ? "border-cited-accent/40 bg-cited-accent-muted text-cited-ink-strong"
                        : "border-cited-line text-cited-ink-muted hover:border-cited-line-strong",
                    )}
                    onClick={() => toggleState(state)}
                  >
                    {STATE_LABELS[state]}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend className="type-micro text-cited-ink-faint">
              Has source citation
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {(
                [
                  { value: null, label: "Any" },
                  { value: true, label: "Yes" },
                  { value: false, label: "No" },
                ] as const
              ).map((opt) => {
                const selected = draft.hasSourceCitation === opt.value;
                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    aria-pressed={selected}
                    className={cn(
                      "rounded-sm border px-2.5 py-1.5 text-xs transition",
                      selected
                        ? "border-cited-accent/40 bg-cited-accent-muted text-cited-ink-strong"
                        : "border-cited-line text-cited-ink-muted hover:border-cited-line-strong",
                    )}
                    onClick={() =>
                      setDraft((prev) => ({
                        ...prev,
                        hasSourceCitation: opt.value,
                      }))
                    }
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-cited-line-subtle px-4 py-3">
          <Button type="button" variant="ghost" size="sm" onClick={clear}>
            Clear filters
          </Button>
          <Button type="button" variant="primary" size="sm" onClick={apply}>
            Apply filters
          </Button>
        </div>
      </div>
    </div>
  );
}

export function InboxFilterSheet({
  open,
  onOpenChange,
  filters,
  options,
}: InboxFilterSheetProps) {
  if (!open) return null;
  return (
    <InboxFilterSheetPanel
      filters={filters}
      options={options}
      onOpenChange={onOpenChange}
    />
  );
}
