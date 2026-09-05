"use client";

import { Eye, EyeOff } from "lucide-react";
import {
  forwardRef,
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

import { TextInput } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type AuthFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  label: string;
  error?: string | null;
  hint?: string;
  labelAccessory?: ReactNode;
  id?: string;
};

export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(
  function AuthField(
    {
      label,
      error,
      hint,
      labelAccessory,
      id,
      type = "text",
      className,
      ...props
    },
    ref,
  ) {
    const generatedId = useId();
    const fieldId = id ?? `auth-field-${generatedId}`;
    const errorId = `${fieldId}-error`;
    const hintId = `${fieldId}-hint`;
    const isPassword = type === "password";
    const [visible, setVisible] = useState(false);
    const resolvedType = isPassword ? (visible ? "text" : "password") : type;

    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <div className="flex min-h-5 items-center justify-between gap-3">
          <label
            htmlFor={fieldId}
            className="text-sm font-medium leading-none text-cited-ink"
          >
            {label}
          </label>
          {labelAccessory}
        </div>
        <div className="relative">
          <TextInput
            ref={ref}
            id={fieldId}
            type={resolvedType}
            invalid={Boolean(error)}
            aria-describedby={
              [error ? errorId : null, hint ? hintId : null]
                .filter(Boolean)
                .join(" ") || undefined
            }
            className={cn(
              "h-12 rounded-[var(--cited-radius-md)] px-3.5 text-[length:var(--text-body-md)] shadow-none",
              isPassword && "pr-11",
            )}
            {...props}
          />
          {isPassword ? (
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              aria-label={visible ? "Hide password" : "Show password"}
              aria-pressed={visible}
              className="absolute top-1/2 right-2.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-[var(--cited-radius-sm)] text-cited-ink-faint transition hover:text-cited-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cited-accent/50"
            >
              {visible ? (
                <EyeOff className="size-4" aria-hidden />
              ) : (
                <Eye className="size-4" aria-hidden />
              )}
            </button>
          ) : null}
        </div>
        {hint ? (
          <p id={hintId} className="type-body-sm text-cited-ink-muted">
            {hint}
          </p>
        ) : null}
        {error ? (
          <p
            id={errorId}
            role="alert"
            className="text-sm leading-snug text-cited-danger"
          >
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);
