"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Circle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DocsLink } from "@/components/guidance/help";
import { SETUP_CHECKLIST_ITEMS } from "@/lib/content/help";
import { cn } from "@/lib/utils";

export type SetupChecklistState = {
  workspace: boolean;
  domain: boolean;
  verify: boolean;
  brand: boolean;
  prompts: boolean;
  surfaces: boolean;
  activate: boolean;
  notifications: boolean;
  first_note: boolean;
};

type SetupChecklistProps = {
  state: SetupChecklistState;
  canManageSetup: boolean;
  dismissed: boolean;
  onDismissAction?: () => Promise<void>;
  onRestoreAction?: () => Promise<void>;
};

export function SetupChecklist({
  state,
  canManageSetup,
  dismissed,
  onDismissAction,
  onRestoreAction,
}: SetupChecklistProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [localDismissed, setLocalDismissed] = useState(dismissed);

  const items = SETUP_CHECKLIST_ITEMS.filter((item) => {
    if (item.ownerOnly && !canManageSetup) return false;
    return true;
  });

  const completedCount = items.filter(
    (item) => state[item.id as keyof SetupChecklistState],
  ).length;
  const allComplete = completedCount === items.length;

  if (allComplete && localDismissed) {
    return null;
  }

  if (localDismissed) {
    return (
      <div className="rounded-md border border-cited-line-subtle px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <p className="type-body-sm text-cited-ink-muted">
            Setup checklist hidden.
          </p>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                await onRestoreAction?.();
                setLocalDismissed(false);
                router.refresh();
              });
            }}
          >
            Show checklist
          </Button>
        </div>
      </div>
    );
  }

  if (allComplete) {
    return (
      <div className="rounded-md border border-cited-citation/30 bg-cited-citation-muted px-4 py-4">
        <p className="type-title text-base">Setup complete</p>
        <p className="mt-1 type-body-sm text-cited-ink-muted">
          Your workspace is ready to collect citation evidence.
        </p>
        <div className="mt-3">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                await onDismissAction?.();
                setLocalDismissed(true);
                router.refresh();
              });
            }}
          >
            Dismiss
          </Button>
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-md border border-cited-line bg-cited-surface px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="type-micro text-cited-accent">Setup</p>
          <h2 className="mt-1 type-title text-base">Get Cited ready</h2>
          <p className="mt-1 type-body-sm text-cited-ink-muted">
            {completedCount} of {items.length} complete
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              await onDismissAction?.();
              setLocalDismissed(true);
              router.refresh();
            });
          }}
        >
          Dismiss
        </Button>
      </div>
      <ul className="mt-4 space-y-2">
        {items.map((item) => {
          const done = state[item.id as keyof SetupChecklistState];
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-start gap-3 rounded-md px-2 py-2 transition hover:bg-cited-surface-hover",
                  done && "opacity-70",
                )}
              >
                {done ? (
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-cited-citation"
                    aria-hidden
                  />
                ) : (
                  <Circle
                    className="mt-0.5 h-4 w-4 shrink-0 text-cited-ink-subtle"
                    aria-hidden
                  />
                )}
                <span className="min-w-0">
                  <span className="block text-sm text-cited-ink">
                    {item.label}
                  </span>
                  <DocsLink
                    href={item.docsHref}
                    className="type-meta text-cited-ink-faint"
                  >
                    Docs
                  </DocsLink>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
