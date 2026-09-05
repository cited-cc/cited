import { forwardRef, type SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  invalid?: boolean;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ className, invalid = false, children, ...props }, ref) {
    return (
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          "h-9 w-full appearance-none rounded-md border border-cited-line bg-cited-surface bg-[length:12px] bg-[right_12px_center] bg-no-repeat px-3 pr-8 text-sm text-cited-ink shadow-[inset_0_1px_0_rgba(244,239,224,0.03)] transition-[border-color] focus-visible:border-cited-citation focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cited-citation/35 disabled:cursor-not-allowed disabled:opacity-50",
          invalid &&
            "border-cited-danger/50 focus-visible:border-cited-danger focus-visible:ring-cited-danger/30",
          className,
        )}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M2.5 4.5L6 8L9.5 4.5' stroke='%238A8474' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
        }}
        {...props}
      >
        {children}
      </select>
    );
  },
);
