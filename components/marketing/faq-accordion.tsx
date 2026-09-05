"use client";

import { useId, useState } from "react";

import { ScrollReveal } from "@/components/marketing/scroll-reveal";
import type { FaqItem } from "@/lib/content/faq";
import { cn } from "@/lib/utils";

type FaqAccordionProps = {
  items: FaqItem[];
  className?: string;
};

export function FaqAccordion({ items, className }: FaqAccordionProps) {
  const baseId = useId();
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  return (
    <div
      className={cn(
        "divide-y divide-cited-line-subtle border-y border-cited-line",
        className,
      )}
    >
      {items.map((item, index) => {
        const isOpen = openId === item.id;
        const panelId = `${baseId}-${item.id}-panel`;
        const buttonId = `${baseId}-${item.id}-button`;
        const delay = (Math.min(index + 1, 5) as 1 | 2 | 3 | 4 | 5);

        return (
          <ScrollReveal key={item.id} delay={delay}>
            <h3>
              <button
                id={buttonId}
                type="button"
                className={cn(
                  "group flex w-full items-start justify-between gap-4 py-5 text-left transition-colors duration-150 ease-[var(--cited-ease)]",
                  "hover:text-cited-ink-strong focus-visible:outline-none",
                )}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenId(isOpen ? null : item.id)}
              >
                <span
                  className={cn(
                    "type-title text-[1rem] transition-colors duration-150",
                    isOpen ? "text-cited-ink-strong" : "text-cited-ink",
                  )}
                >
                  {item.question}
                </span>
                <span
                  className={cn(
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border border-cited-line-subtle font-mono text-sm transition-[border-color,color,background-color] duration-150",
                    isOpen
                      ? "border-cited-citation/40 bg-cited-accent-muted text-cited-citation"
                      : "text-cited-ink-faint group-hover:border-cited-line-strong group-hover:text-cited-ink-muted",
                  )}
                  aria-hidden
                >
                  {isOpen ? "−" : "+"}
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!isOpen}
              className="pb-5"
            >
              <p className="max-w-2xl type-body-sm text-cited-ink-muted">
                {item.answer}
              </p>
            </div>
          </ScrollReveal>
        );
      })}
    </div>
  );
}
