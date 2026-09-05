"use client";

import { createContext, useContext, useId, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type TabsContextValue = {
  value: string;
  setValue: (value: string) => void;
  baseId: string;
};

const TabsContext = createContext<TabsContextValue | null>(null);

type TabsProps = {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
};

export function Tabs({
  defaultValue,
  value: controlled,
  onValueChange,
  children,
  className,
}: TabsProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const value = controlled ?? uncontrolled;
  const baseId = useId();

  function setValue(next: string) {
    if (controlled === undefined) setUncontrolled(next);
    onValueChange?.(next);
  }

  return (
    <TabsContext.Provider value={{ value, setValue, baseId }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex gap-1 rounded-md border border-cited-line-subtle bg-cited-canvas-elevated p-1",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  children,
  className,
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("TabsTrigger must be used within Tabs");
  const selected = ctx.value === value;

  return (
    <button
      type="button"
      role="tab"
      id={`${ctx.baseId}-tab-${value}`}
      aria-selected={selected}
      aria-controls={`${ctx.baseId}-panel-${value}`}
      tabIndex={selected ? 0 : -1}
      className={cn(
        "rounded-sm px-3 py-1.5 text-sm transition-[color,background-color,box-shadow] duration-150",
        selected
          ? "bg-cited-surface-raised text-cited-ink-strong shadow-[inset_0_-2px_0_0_var(--cited-citation)]"
          : "text-cited-ink-muted hover:text-cited-ink",
        className,
      )}
      onClick={() => ctx.setValue(value)}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  children,
  className,
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("TabsContent must be used within Tabs");
  if (ctx.value !== value) return null;

  return (
    <div
      role="tabpanel"
      id={`${ctx.baseId}-panel-${value}`}
      aria-labelledby={`${ctx.baseId}-tab-${value}`}
      className={cn("mt-4", className)}
    >
      {children}
    </div>
  );
}

type SegmentedControlOption = {
  value: string;
  label: string;
};

type SegmentedControlProps = {
  options: SegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  label?: string;
};

export function SegmentedControl({
  options,
  value,
  onChange,
  className,
  label,
}: SegmentedControlProps) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "inline-flex rounded-md border border-cited-line-subtle bg-cited-canvas-elevated p-0.5",
        className,
      )}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={selected}
            className={cn(
              "rounded-sm px-3 py-1.5 font-mono text-[11px] tracking-[0.06em] uppercase transition",
              selected
                ? "bg-cited-surface-raised text-cited-ink-strong"
                : "text-cited-ink-subtle hover:text-cited-ink",
            )}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

type PaginationShellProps = {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export function PaginationShell({
  page,
  pageCount,
  onPageChange,
  className,
}: PaginationShellProps) {
  return (
    <nav
      aria-label="Pagination"
      className={cn("flex items-center justify-between gap-3", className)}
    >
      <p className="type-meta">
        Page {page} of {pageCount}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          className="h-8 rounded-sm border border-cited-line px-3 text-sm text-cited-ink-muted transition hover:bg-cited-surface-hover disabled:opacity-40"
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </button>
        <button
          type="button"
          disabled={page >= pageCount}
          className="h-8 rounded-sm border border-cited-line px-3 text-sm text-cited-ink-muted transition hover:bg-cited-surface-hover disabled:opacity-40"
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </nav>
  );
}
