import { forwardRef, type InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  mono?: boolean;
  invalid?: boolean;
};

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  function TextInput(
    { className, mono = false, invalid = false, type = "text", ...props },
    ref,
  ) {
    return (
      <input
        ref={ref}
        type={type}
        aria-invalid={invalid || undefined}
        className={cn(
          "h-9 w-full rounded-md border border-cited-line bg-cited-surface px-3 text-sm text-cited-ink shadow-[inset_0_1px_0_rgba(244,239,224,0.03)] transition-[border-color,background-color] placeholder:text-cited-ink-faint focus-visible:border-cited-citation focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cited-citation/35 disabled:cursor-not-allowed disabled:opacity-50",
          mono && "font-mono text-[13px] tracking-[0.01em]",
          invalid &&
            "border-cited-danger/50 focus-visible:border-cited-danger focus-visible:ring-cited-danger/30",
          className,
        )}
        {...props}
      />
    );
  },
);
