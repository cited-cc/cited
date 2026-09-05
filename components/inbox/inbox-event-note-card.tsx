"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { AiSurfaceBadge } from "@/components/shared/ai-surface-badge";
import { EventTypeMarker } from "@/components/inbox/event-type-marker";
import { InboxStatusActions } from "@/components/inbox/inbox-status-actions";
import { MemberStateMarker } from "@/components/inbox/member-state-marker";
import { Checkbox } from "@/components/ui/checkbox";
import { NoteCard, type NoteCardVariant } from "@/components/ui/note-card";
import { markEventSeenAction } from "@/lib/inbox/actions";
import { buildInboxHref } from "@/lib/inbox/filters";
import {
  buildEventSummary,
  formatRelativeUtc,
} from "@/lib/inbox/serializers";
import type { InboxEventListItem, InboxFilters } from "@/lib/inbox/types";
import { cn } from "@/lib/utils";

function noteVariantFor(item: InboxEventListItem): NoteCardVariant {
  switch (item.eventType) {
    case "citation":
      return "citation";
    case "mention":
      return "mention";
    case "recommendation":
      return "default";
    case "competitor_citation":
      return "competitor";
    case "missed_opportunity":
      return "opportunity";
    default: {
      const _exhaustive: never = item.eventType;
      return _exhaustive;
    }
  }
}

type InboxEventNoteCardProps = {
  item: InboxEventListItem;
  filters: InboxFilters;
  selected: boolean;
  selectable: boolean;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  canArchive: boolean;
  canResolve: boolean;
  canSave: boolean;
  desktopPreview: boolean;
};

export function InboxEventNoteCard({
  item,
  filters,
  selected,
  selectable,
  checked,
  onCheckedChange,
  canArchive,
  canResolve,
  canSave,
  desktopPreview,
}: InboxEventNoteCardProps) {
  const router = useRouter();
  const [memberState, setMemberState] = useState(item.memberState);
  const [, startTransition] = useTransition();

  const summary = buildEventSummary({ ...item, memberState });
  const listQuery = buildInboxHref(filters)
    .replace(/^\/app\/inbox\??/, "");
  const focusedHref = listQuery
    ? `/app/inbox/${item.id}?${listQuery}`
    : `/app/inbox/${item.id}`;
  const previewHref = buildInboxHref(filters, { selectedEventId: item.id });

  function openEvent() {
    const preferPreview =
      desktopPreview &&
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 1024px)").matches;
    const target = preferPreview ? previewHref : focusedHref;

    startTransition(async () => {
      if (!memberState.seenAt) {
        const result = await markEventSeenAction(item.id);
        if (result.ok) setMemberState(result.memberState);
      }
    });
    router.push(target, { scroll: false });
  }

  return (
    <div
      className={cn(
        "relative",
        selected && "rounded-md ring-1 ring-cited-accent/40",
        selectable && "pl-7",
      )}
    >
      {selectable ? (
        <div className="absolute left-0 top-3.5 z-10">
          <Checkbox
            aria-label={`Select ${summary}`}
            checked={checked}
            onChange={(e) => onCheckedChange(e.target.checked)}
          />
        </div>
      ) : null}

      <NoteCard
        variant={noteVariantFor(item)}
        title={summary}
        className="cursor-pointer"
        meta={
          <time
            dateTime={item.lastSeenAt}
            className="font-mono text-[11px] text-cited-ink-faint"
          >
            {formatRelativeUtc(item.lastSeenAt)}
          </time>
        }
        footer={
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            <p className="type-meta text-cited-ink-faint">
              First seen {formatRelativeUtc(item.firstSeenAt)}
              {" · "}
              Observed {item.occurrenceCount}×
            </p>
            <InboxStatusActions
              eventId={item.id}
              memberState={memberState}
              canArchive={canArchive}
              canResolve={canResolve}
              canSave={canSave}
              onStateChange={setMemberState}
              compact
            />
          </div>
        }
      >
        <div
          role="link"
          tabIndex={0}
          aria-current={selected ? "true" : undefined}
          aria-label={`Open evidence: ${summary}`}
          className="space-y-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cited-accent/50"
          onClick={openEvent}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openEvent();
            }
          }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <EventTypeMarker type={item.eventType} />
            {item.aiSurface ? (
              <AiSurfaceBadge surface={item.aiSurface} showMark={false} />
            ) : null}
            <MemberStateMarker state={memberState} />
          </div>

          {item.promptText ? (
            <p className="type-body-sm line-clamp-2 text-cited-ink-muted">
              <span className="type-micro text-cited-ink-faint">Prompt </span>
              {item.promptText}
            </p>
          ) : null}

          {item.sourceSnippet || item.citedHostname || item.sourceTitle ? (
            <p className="type-body-sm line-clamp-2 text-cited-ink-subtle">
              {item.sourceSnippet ?? item.sourceTitle ?? item.citedHostname}
            </p>
          ) : null}
        </div>

        <p className="sr-only">
          <Link href={focusedHref}>Open focused note</Link>
        </p>
      </NoteCard>
    </div>
  );
}
