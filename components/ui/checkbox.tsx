import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Shared control class for labeled and raw checkboxes.
 * Checked styles live in `.cited-checkbox` so a tick is visible without
 * relying on Tailwind compiling a data-URI background.
 */
export const checkboxControlClassName = "cited-checkbox";

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: ReactNode;
  description?: string;
};

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox({ className, label, description, id, ...props }, ref) {
    const input = (
      <input
        ref={ref}
        id={id}
        type="checkbox"
        className={cn(checkboxControlClassName, className)}
        {...props}
      />
    );

    if (!label) return input;

    return (
      <label
        htmlFor={id}
        className="flex cursor-pointer items-start gap-2.5 text-sm text-cited-ink"
      >
        <span className="mt-0.5">{input}</span>
        <span className="min-w-0">
          <span className="block font-medium">{label}</span>
          {description ? (
            <span className="mt-0.5 block type-body-sm">{description}</span>
          ) : null}
        </span>
      </label>
    );
  },
);
