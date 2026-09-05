"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

import { TextInput } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type CommandItem = {
  id: string;
  label: string;
  hint?: string;
  shortcut?: string;
  href?: string;
  action?: () => void;
  group?: string;
};

const DEFAULT_COMMANDS: CommandItem[] = [
  {
    id: "inbox",
    label: "Go to Inbox",
    href: "/app/inbox",
    group: "Navigate",
    shortcut: "G I",
  },
  {
    id: "monitors",
    label: "Go to Monitors",
    href: "/app/monitors",
    group: "Navigate",
    shortcut: "G M",
  },
  {
    id: "notebook",
    label: "Go to Notebook",
    href: "/app/notebook",
    group: "Navigate",
    shortcut: "G N",
  },
  {
    id: "settings",
    label: "Go to Settings",
    href: "/app/settings",
    group: "Navigate",
    shortcut: "G S",
  },
  {
    id: "billing",
    label: "Open Billing",
    href: "/app/billing",
    group: "Navigate",
  },
  {
    id: "home",
    label: "Go to Signal Desk",
    href: "/app",
    group: "Navigate",
  },
  {
    id: "create-monitor",
    label: "Create monitor",
    group: "Actions",
    hint: "Add a prompt and AI surfaces",
  },
];

type CommandMenuProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commands?: CommandItem[];
  onCreateMonitor?: () => void;
};

type CommandMenuPanelProps = {
  onOpenChange: (open: boolean) => void;
  commands: CommandItem[];
  onCreateMonitor?: () => void;
};

function CommandMenuPanel({
  onOpenChange,
  commands,
  onCreateMonitor,
}: CommandMenuPanelProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.hint?.toLowerCase().includes(q) ||
        c.group?.toLowerCase().includes(q),
    );
  }, [commands, query]);

  const groups = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    for (const item of filtered) {
      const key = item.group ?? "Commands";
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    return map;
  }, [filtered]);

  const flat = filtered;
  const safeActive = flat.length === 0 ? 0 : Math.min(active, flat.length - 1);

  useEffect(() => {
    const t = window.setTimeout(() => inputRef.current?.focus(), 10);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
      }
    }
    document.addEventListener("keydown", onKey);

    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [onOpenChange]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-command-index="${safeActive}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [safeActive]);

  const runCommand = useCallback(
    (item: CommandItem) => {
      onOpenChange(false);
      if (item.id === "create-monitor" && onCreateMonitor) {
        onCreateMonitor();
        return;
      }
      if (item.action) {
        item.action();
        return;
      }
      if (item.href) router.push(item.href);
    },
    [onCreateMonitor, onOpenChange, router],
  );

  function onKeyDown(e: ReactKeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, Math.max(flat.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = flat[safeActive];
      if (item) runCommand(item);
    }
  }

  let runningIndex = -1;

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[12vh]">
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        aria-label="Close command menu"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-lg border border-cited-line bg-cited-surface-raised cited-overlay-shadow"
      >
        <h2 id={titleId} className="sr-only">
          Command menu
        </h2>
        <div className="border-b border-cited-line-subtle px-3 py-2.5">
          <TextInput
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Search commands…"
            aria-label="Search commands"
            className="border-0 bg-transparent shadow-none focus-visible:ring-0"
            mono
          />
        </div>
        <div
          ref={listRef}
          className="max-h-[min(50vh,360px)] overflow-y-auto py-2"
          role="listbox"
          aria-label="Commands"
        >
          {flat.length === 0 ? (
            <p className="px-4 py-6 type-body-sm text-center">
              No matching commands.
            </p>
          ) : (
            Array.from(groups.entries()).map(([group, items]) => (
              <div key={group} className="mb-1">
                <p className="px-4 py-1.5 type-micro">{group}</p>
                {items.map((item) => {
                  runningIndex += 1;
                  const index = runningIndex;
                  const selected = index === safeActive;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      data-command-index={index}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition",
                        selected
                          ? "bg-cited-accent-muted text-cited-ink-strong"
                          : "text-cited-ink hover:bg-cited-surface-hover",
                      )}
                      onMouseEnter={() => setActive(index)}
                      onClick={() => runCommand(item)}
                    >
                      <span className="min-w-0">
                        <span className="block truncate">{item.label}</span>
                        {item.hint ? (
                          <span className="mt-0.5 block type-meta">
                            {item.hint}
                          </span>
                        ) : null}
                      </span>
                      {item.shortcut ? (
                        <kbd className="shrink-0 font-mono text-[10px] tracking-[0.08em] text-cited-ink-faint">
                          {item.shortcut}
                        </kbd>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
        <div className="flex items-center justify-between border-t border-cited-line-subtle px-4 py-2">
          <p className="type-meta">Navigate with ↑ ↓ · Enter to run</p>
          <kbd className="font-mono text-[10px] tracking-[0.08em] text-cited-ink-faint">
            esc
          </kbd>
        </div>
      </div>
    </div>
  );
}

export function CommandMenu({
  open,
  onOpenChange,
  commands = DEFAULT_COMMANDS,
  onCreateMonitor,
}: CommandMenuProps) {
  if (!open) return null;
  return (
    <CommandMenuPanel
      onOpenChange={onOpenChange}
      commands={commands}
      onCreateMonitor={onCreateMonitor}
    />
  );
}

export function useCommandMenuShortcut(onOpen: () => void) {
  useEffect(() => {
    function onKey(e: globalThis.KeyboardEvent) {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpen();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onOpen]);
}

export { DEFAULT_COMMANDS };
