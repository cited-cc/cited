"use client";

import { forwardRef, useId, type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type SwitchProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onChange"
> & {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
};

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  function Switch(
    {
      checked = false,
      onCheckedChange,
      disabled,
      className,
      label,
      id,
      ...props
    },
    ref,
  ) {
    const generatedId = useId();
    const switchId = id ?? generatedId;

    const control = (
      <button
        ref={ref}
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange?.(!checked)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition focus-visible:outline-none disabled:opacity-50",
          checked
            ? "border-cited-accent-bright/60 bg-cited-accent-bright"
            : "border-cited-line bg-cited-surface-pressed",
          className,
        )}
        {...props}
      >
        <span
          className={cn(
            "pointer-events-none block h-3.5 w-3.5 rounded-full bg-cited-ink-strong shadow transition-transform",
            checked ? "translate-x-[18px]" : "translate-x-[3px]",
            !checked && "bg-cited-ink-muted",
            checked && "bg-cited-accent-ink",
          )}
          aria-hidden
        />
      </button>
    );

    if (!label) return control;

    return (
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={switchId} className="text-sm text-cited-ink">
          {label}
        </label>
        {control}
      </div>
    );
  },
);
