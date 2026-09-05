import { cn } from "@/lib/utils";

type CitedWordmarkProps = {
  className?: string;
  as?: "span" | "p" | "div";
};

export function CitedWordmark({
  className,
  as: Comp = "span",
}: CitedWordmarkProps) {
  return (
    <Comp
      className={cn(
        "font-display text-[length:var(--text-heading-sm)] font-semibold tracking-[-0.01em] text-current",
        className,
      )}
    >
      cited
    </Comp>
  );
}
