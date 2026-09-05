"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { DemoAlertPreview } from "@/components/demo/demo-alert-preview";
import { DemoEvidenceNote } from "@/components/demo/demo-evidence-note";
import { DemoEventCard } from "@/components/demo/demo-event-card";
import { DemoOccurrenceSelector } from "@/components/demo/demo-occurrence-selector";
import { TrackCta } from "@/components/marketing/track-cta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { DEMO_CTA, DEMO_LABEL } from "@/lib/content/demo-marketing";
import {
  DEMO_EVENTS,
  DEMO_WORKSPACE,
  demoEventTypeLabel,
  type DemoEvent,
} from "@/lib/demo/demo-events";
import { DEMO_MONITORS, DEMO_SIGNAL_DESK } from "@/lib/demo/demo-monitors";
import {
  DEMO_ANNOTATIONS,
  DEMO_BILLING_PREVIEW,
  DEMO_NOTEBOOK_NOTES,
  DEMO_OCCURRENCES,
} from "@/lib/demo/demo-notes";
import { cn } from "@/lib/utils";

type DemoTab =
  | "desk"
  | "inbox"
  | "note"
  | "notebook"
  | "alerts"
  | "billing";

const TABS: { id: DemoTab; label: string }[] = [
  { id: "desk", label: "Signal Desk" },
  { id: "inbox", label: "Inbox" },
  { id: "note", label: "Evidence" },
  { id: "notebook", label: "Notebook" },
  { id: "alerts", label: "Alerts" },
  { id: "billing", label: "Plan" },
];

type DemoShellProps = {
  screenshot?: boolean;
  initialFrame?: string;
  className?: string;
};

function frameToTab(frame?: string): DemoTab {
  switch (frame) {
    case "inbox":
      return "inbox";
    case "note":
    case "occurrences":
      return "note";
    case "notebook":
      return "notebook";
    case "alerts":
      return "alerts";
    case "pricing":
      return "billing";
    case "hero":
    case "desk":
    default:
      return "desk";
  }
}

export function DemoShell({
  screenshot = false,
  initialFrame,
  className,
}: DemoShellProps) {
  const [tab, setTab] = useState<DemoTab>(frameToTab(initialFrame));
  const [selectedId, setSelectedId] = useState(DEMO_EVENTS[0]!.id);
  const [savedIds, setSavedIds] = useState<Set<string>>(
    () =>
      new Set(
        DEMO_EVENTS.filter((event) => event.status === "saved").map(
          (event) => event.id,
        ),
      ),
  );
  const [occurrenceId, setOccurrenceId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const selected = useMemo(
    () => DEMO_EVENTS.find((event) => event.id === selectedId) ?? DEMO_EVENTS[0]!,
    [selectedId],
  );

  const occurrences = DEMO_OCCURRENCES[selected.id] ?? [];
  const activeOccurrenceId = occurrenceId ?? occurrences[0]?.id ?? null;

  function selectEvent(event: DemoEvent) {
    setSelectedId(event.id);
    setOccurrenceId(null);
    setTab("note");
  }

  function toggleSaved(id: string) {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function copyDemoLink() {
    try {
      await navigator.clipboard.writeText(
        typeof window !== "undefined"
          ? `${window.location.origin}/demo`
          : "https://cited.cc/demo",
      );
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-cited-line border-t-cited-citation/35 bg-cited-canvas text-cited-ink cited-note-shadow",
        screenshot && "screenshot-frame",
        className,
      )}
      data-testid="demo-shell"
      data-fictional="true"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-cited-line-subtle bg-cited-canvas-elevated px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm tracking-tight text-cited-ink">
            cited
          </span>
          <Badge variant="warning">{DEMO_LABEL}</Badge>
          <span className="type-meta text-cited-ink-faint">
            {DEMO_WORKSPACE.domain}
          </span>
        </div>
        {!screenshot ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={copyDemoLink}>
              {copied ? "Link copied" : "Copy demo link"}
            </Button>
            <TrackCta href={DEMO_CTA.primaryCta.href} cta="demo_check_domain" size="sm">
              {DEMO_CTA.primaryCta.label}
            </TrackCta>
          </div>
        ) : null}
      </header>

      <nav
        className="flex gap-1 overflow-x-auto border-b border-cited-line-subtle px-2 py-2"
        aria-label="Demo sections"
      >
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "relative min-h-11 shrink-0 rounded-sm px-3 py-2 font-mono text-[12px] tracking-[0.04em] uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cited-citation",
              tab === item.id
                ? "bg-cited-surface-raised text-cited-ink after:absolute after:inset-x-3 after:bottom-1 after:h-px after:bg-cited-citation"
                : "text-cited-ink-muted hover:bg-cited-surface hover:text-cited-ink",
            )}
            aria-current={tab === item.id ? "page" : undefined}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 sm:p-5">
        {tab === "desk" ? (
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="bg-cited-surface lg:col-span-2">
              <CardBody>
                <p className="type-micro mb-2">Monitoring status</p>
                <h2 className="type-title">Your citation desk is ready.</h2>
                <p className="mt-2 type-body-sm text-cited-ink-muted">
                  {DEMO_SIGNAL_DESK.nextStep}
                </p>
                <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div>
                    <dt className="type-meta">Domain</dt>
                    <dd className="type-body-sm">{DEMO_SIGNAL_DESK.domain}</dd>
                  </div>
                  <div>
                    <dt className="type-meta">Verification</dt>
                    <dd className="type-body-sm">
                      {DEMO_SIGNAL_DESK.verificationStatus}
                    </dd>
                  </div>
                  <div>
                    <dt className="type-meta">Active monitors</dt>
                    <dd className="type-body-sm">
                      {DEMO_SIGNAL_DESK.activeMonitors}
                    </dd>
                  </div>
                  <div>
                    <dt className="type-meta">Recent evidence</dt>
                    <dd className="type-body-sm">
                      {DEMO_SIGNAL_DESK.recentEvidenceCount} notes
                    </dd>
                  </div>
                </dl>
              </CardBody>
            </Card>
            <Card className="bg-cited-surface">
              <CardBody>
                <p className="type-micro mb-2">Alerts</p>
                <p className="type-body-sm text-cited-ink-muted">
                  {DEMO_SIGNAL_DESK.alertsSummary}
                </p>
                <Button
                  className="mt-4"
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={() => setTab("inbox")}
                >
                  Open Inbox
                </Button>
              </CardBody>
            </Card>
            <div className="lg:col-span-3">
              <p className="type-micro mb-3">Monitors (fictional)</p>
              <div className="grid gap-3 md:grid-cols-2">
                {DEMO_MONITORS.map((monitor) => (
                  <Card key={monitor.id} className="bg-cited-surface">
                    <CardBody>
                      <div className="flex items-start justify-between gap-2">
                        <p className="type-body-sm text-cited-ink">
                          {monitor.prompt}
                        </p>
                        <Badge
                          variant={
                            monitor.status === "active" ? "success" : "neutral"
                          }
                        >
                          {monitor.status}
                        </Badge>
                      </div>
                      <p className="mt-2 type-meta text-cited-ink-subtle">
                        {monitor.surface} · {monitor.locationLabel} ·{" "}
                        {monitor.cadenceLabel}
                      </p>
                      <p className="mt-1 type-meta text-cited-ink-faint">
                        Next: {monitor.nextCheckLabel}
                      </p>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {tab === "inbox" ? (
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-3">
              {DEMO_EVENTS.map((event) => (
                <DemoEventCard
                  key={event.id}
                  event={event}
                  selected={event.id === selected.id}
                  saved={savedIds.has(event.id)}
                  onSelect={() => selectEvent(event)}
                  onToggleSaved={() => toggleSaved(event.id)}
                />
              ))}
            </div>
            <aside className="rounded-md border border-cited-line-subtle bg-cited-surface p-4">
              <p className="type-micro mb-2">Selected</p>
              <h3 className="type-title text-[1rem]">{selected.title}</h3>
              <p className="mt-2 type-body-sm text-cited-ink-muted">
                {demoEventTypeLabel(selected.eventType)} · {selected.surface}
              </p>
              <Button
                className="mt-4"
                variant="primary"
                size="sm"
                type="button"
                onClick={() => setTab("note")}
              >
                Open evidence note
              </Button>
            </aside>
          </div>
        ) : null}

        {tab === "note" ? (
          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <DemoEvidenceNote
              event={selected}
              saved={savedIds.has(selected.id)}
              onToggleSaved={() => toggleSaved(selected.id)}
              annotations={DEMO_ANNOTATIONS}
            />
            <div className="space-y-4">
              {occurrences.length > 0 ? (
                <DemoOccurrenceSelector
                  occurrences={occurrences}
                  selectedId={activeOccurrenceId}
                  onSelect={setOccurrenceId}
                />
              ) : (
                <Card className="bg-cited-surface">
                  <CardBody>
                    <p className="type-body-sm text-cited-ink-muted">
                      Single occurrence for this fictional note.
                    </p>
                  </CardBody>
                </Card>
              )}
            </div>
          </div>
        ) : null}

        {tab === "notebook" ? (
          <div className="grid gap-4 md:grid-cols-2">
            {DEMO_NOTEBOOK_NOTES.map((note) => (
              <Card key={note.id} className="bg-cited-surface">
                <CardBody>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="type-title text-[1rem]">{note.title}</h3>
                    {note.pinned ? <Badge variant="neutral">Pinned</Badge> : null}
                  </div>
                  <p className="mt-3 type-body-sm text-cited-ink-muted">
                    {note.body}
                  </p>
                  <button
                    type="button"
                    className="mt-4 type-meta text-cited-accent underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cited-accent"
                    onClick={() => {
                      setSelectedId(note.linkedEventId);
                      setTab("note");
                    }}
                  >
                    Open linked evidence
                  </button>
                  <p className="mt-2 type-meta text-cited-ink-faint">
                    Updated {note.updatedAtLabel}
                  </p>
                </CardBody>
              </Card>
            ))}
          </div>
        ) : null}

        {tab === "alerts" ? <DemoAlertPreview /> : null}

        {tab === "billing" ? (
          <Card className="bg-cited-surface" data-testid="demo-billing-preview">
            <CardBody>
              <p className="type-micro mb-2">Plan preview</p>
              <h2 className="type-title">{DEMO_BILLING_PREVIEW.planName}</h2>
              <p className="mt-2 font-mono text-2xl">
                {DEMO_BILLING_PREVIEW.priceLabel}
              </p>
              <dl className="mt-5 space-y-2">
                <div className="flex justify-between gap-3">
                  <dt className="type-meta">Prompts</dt>
                  <dd className="type-body-sm">{DEMO_BILLING_PREVIEW.promptsUsed}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="type-meta">Surfaces</dt>
                  <dd className="type-body-sm">{DEMO_BILLING_PREVIEW.surfaces}</dd>
                </div>
              </dl>
              <p className="mt-4 type-body-sm text-cited-ink-subtle">
                {DEMO_BILLING_PREVIEW.note}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <TrackCta href="/pricing" cta="demo_see_pricing" size="sm">
                  See pricing
                </TrackCta>
                <TrackCta
                  href="/scan"
                  cta="demo_billing_check_domain"
                  variant="secondary"
                  size="sm"
                >
                  Check a domain
                </TrackCta>
              </div>
            </CardBody>
          </Card>
        ) : null}
      </div>

      {!screenshot ? (
        <footer className="border-t border-cited-line-subtle px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="type-title text-[1rem]">{DEMO_CTA.heading}</p>
              <p className="mt-1 type-meta text-cited-ink-subtle">
                Fictional evidence only. No account required for this demo.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <TrackCta href={DEMO_CTA.primaryCta.href} cta="demo_footer_check">
                {DEMO_CTA.primaryCta.label}
              </TrackCta>
              <TrackCta
                href={DEMO_CTA.secondaryCta.href}
                cta="demo_footer_pricing"
                variant="secondary"
              >
                {DEMO_CTA.secondaryCta.label}
              </TrackCta>
            </div>
          </div>
          <p className="mt-3 type-meta text-cited-ink-faint">
            Prefer docs first?{" "}
            <Link
              href="/docs/getting-started"
              className="underline-offset-4 hover:underline"
            >
              Getting started
            </Link>
          </p>
        </footer>
      ) : null}
    </div>
  );
}
