"use client";

import Link from "next/link";
import { useState } from "react";
import { CircleHelp, Keyboard } from "lucide-react";

import { Popover } from "@/components/ui/tooltip";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HELP_MENU_ITEMS, KEYBOARD_SHORTCUTS } from "@/lib/content/help";
import { APP_VERSION_LABEL } from "@/lib/content/support";

type AppHelpMenuProps = {
  supportSummary?: string;
  canCopyWorkspaceId?: boolean;
  workspaceSupportId?: string | null;
};

export function AppHelpMenu({
  supportSummary,
  canCopyWorkspaceId = false,
  workspaceSupportId = null,
}: AppHelpMenuProps) {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copySupportSummary() {
    if (!supportSummary) return;
    await navigator.clipboard.writeText(supportSummary);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  async function copyWorkspaceId() {
    if (!workspaceSupportId) return;
    await navigator.clipboard.writeText(workspaceSupportId);
  }

  return (
    <>
      <Popover
        align="end"
        className="min-w-[220px] p-2"
        trigger={
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-cited-ink-muted transition hover:bg-cited-surface-hover hover:text-cited-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cited-accent"
            aria-label="Help menu"
          >
            <CircleHelp className="h-4 w-4" aria-hidden />
          </button>
        }
      >
        <ul className="space-y-0.5">
          {HELP_MENU_ITEMS.map((item) => {
            if (item.href === "#keyboard-shortcuts") {
              return (
                <li key={item.label}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-cited-ink-muted transition hover:bg-cited-surface-hover hover:text-cited-ink"
                    onClick={() => setShortcutsOpen(true)}
                  >
                    <Keyboard className="h-3.5 w-3.5" aria-hidden />
                    {item.label}
                  </button>
                </li>
              );
            }
            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  target={item.external ? "_blank" : undefined}
                  rel={item.external ? "noreferrer" : undefined}
                  className="block rounded-md px-2 py-1.5 text-sm text-cited-ink-muted transition hover:bg-cited-surface-hover hover:text-cited-ink"
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
        {supportSummary ? (
          <div className="mt-2 border-t border-cited-line-subtle pt-2">
            <Button
              type="button"
              size="xs"
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                void copySupportSummary();
              }}
            >
              {copied ? "Copied support summary" : "Copy support summary"}
            </Button>
            {canCopyWorkspaceId && workspaceSupportId ? (
              <Button
                type="button"
                size="xs"
                variant="ghost"
                className="mt-1 w-full justify-start"
                onClick={() => {
                  void copyWorkspaceId();
                }}
              >
                Copy workspace support ID
              </Button>
            ) : null}
            <p className="mt-2 px-2 type-meta text-cited-ink-faint">
              Build {APP_VERSION_LABEL}
            </p>
          </div>
        ) : null}
      </Popover>

      <Dialog
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
        title="Keyboard shortcuts"
        description="Only shortcuts that exist in the current app."
        footer={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShortcutsOpen(false)}
          >
            Close
          </Button>
        }
      >
        <ul className="space-y-3">
          {KEYBOARD_SHORTCUTS.map((shortcut) => (
            <li key={shortcut.id} className="flex items-start justify-between gap-4">
              <span className="type-body-sm text-cited-ink-muted">
                {shortcut.description}
              </span>
              <kbd className="rounded-sm border border-cited-line bg-cited-surface px-2 py-0.5 font-mono text-[11px] text-cited-ink">
                {shortcut.keys}
              </kbd>
            </li>
          ))}
        </ul>
      </Dialog>
    </>
  );
}
