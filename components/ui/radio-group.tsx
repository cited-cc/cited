"use client";

import { createContext, useContext, useId, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type RadioGroupContextValue = {
  name: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
};

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

type RadioGroupProps = {
  name?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
  label?: string;
};

export function RadioGroup({
  name,
  value,
  onChange,
  disabled,
  children,
  className,
  label,
}: RadioGroupProps) {
  const generated = useId();
  const groupName = name ?? generated;

  return (
    <fieldset className={cn("space-y-2", className)} disabled={disabled}>
      {label ? (
        <legend className="mb-2 text-sm font-medium text-cited-ink">
          {label}
        </legend>
      ) : null}
      <RadioGroupContext.Provider
        value={{ name: groupName, value, onChange, disabled }}
      >
        <div role="radiogroup" className="space-y-2">
          {children}
        </div>
      </RadioGroupContext.Provider>
    </fieldset>
  );
}

type RadioItemProps = {
  value: string;
  label: string;
  description?: string;
  className?: string;
};

export function RadioItem({
  value,
  label,
  description,
  className,
}: RadioItemProps) {
  const ctx = useContext(RadioGroupContext);
  if (!ctx) {
    throw new Error("RadioItem must be used within RadioGroup");
  }

  const checked = ctx.value === value;
  const id = `${ctx.name}-${value}`;

  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-2.5 rounded-md border border-cited-line-subtle bg-cited-surface px-3 py-2.5 transition hover:border-cited-line hover:bg-cited-surface-hover",
        checked && "border-cited-accent/30 bg-cited-accent-muted/40",
        className,
      )}
    >
      <input
        id={id}
        type="radio"
        name={ctx.name}
        value={value}
        checked={checked}
        disabled={ctx.disabled}
        onChange={() => ctx.onChange?.(value)}
        className="mt-1 h-4 w-4 shrink-0 appearance-none rounded-full border border-cited-line-strong bg-cited-canvas-elevated checked:border-cited-accent checked:bg-[radial-gradient(circle_at_center,#5ce1e6_0_35%,transparent_40%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cited-accent/40"
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-cited-ink">{label}</span>
        {description ? (
          <span className="mt-0.5 block type-body-sm">{description}</span>
        ) : null}
      </span>
    </label>
  );
}
