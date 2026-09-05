"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const READONLY_FIELD_CLASS =
  "box-border min-w-0 rounded-md border border-cited-line-subtle bg-cited-canvas/80 px-3 text-sm text-cited-ink shadow-[inset_0_1px_0_rgba(244,239,224,0.03)]";

type CopyableFieldProps = {
  label: string;
  value: string;
  copyLabel: string;
  mono?: boolean;
  multiline?: boolean;
  className?: string;
};

/** Label + read-only value with a copy action aligned to the field. */
export function CopyableField({
  label,
  value,
  copyLabel,
  mono = true,
  multiline = false,
  className,
}: CopyableFieldProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <p className="type-micro text-cited-ink-subtle">{label}</p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <div
          className={cn(
            READONLY_FIELD_CLASS,
            multiline
              ? "min-h-9 flex-1 py-2"
              : "flex h-9 flex-1 items-center",
          )}
        >
          <p
            className={cn(
              "w-full break-all leading-normal",
              mono && "font-mono text-[13px] tracking-[0.01em]",
            )}
          >
            {value}
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-9 w-full shrink-0 sm:w-[8.75rem]"
          onClick={handleCopy}
        >
          {copied ? "Copied" : copyLabel}
        </Button>
      </div>
    </div>
  );
}

/** Read-only field styled like TextInput (no copy action). */
export function ReadonlyField({
  label,
  value,
  mono = false,
  className,
}: {
  label: string;
  value: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <p className="type-micro text-cited-ink-subtle">{label}</p>
      <div className={cn(READONLY_FIELD_CLASS, "flex h-9 items-center")}>
        <p
          className={cn(
            "w-full truncate leading-normal",
            mono && "font-mono text-[13px] tracking-[0.01em]",
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
