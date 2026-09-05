import { forwardRef, type TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  mono?: boolean;
  invalid?: boolean;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, mono = false, invalid = false, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          "min-h-24 w-full rounded-md border border-cited-line bg-cited-surface px-3 py-2.5 text-sm text-cited-ink shadow-[inset_0_1px_0_rgba(244,239,224,0.03)] transition-[border-color,background-color] placeholder:text-cited-ink-faint focus-visible:border-cited-citation focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cited-citation/35 disabled:cursor-not-allowed disabled:opacity-50",
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
