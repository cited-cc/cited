"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type RevealDelay = 0 | 1 | 2 | 3 | 4 | 5;

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  as?: "div" | "li";
  delay?: RevealDelay;
  /** When true, reveal once and stay. Default true. */
  once?: boolean;
  style?: CSSProperties;
};

type RevealEntry = {
  once: boolean;
  el: HTMLElement;
};

let sharedObserver: IntersectionObserver | null = null;
const observed = new WeakMap<Element, RevealEntry>();

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function elementInView(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect();
  return rect.top < window.innerHeight * 0.92 && rect.bottom > 0;
}

function reveal(el: HTMLElement) {
  el.classList.add("is-revealed");
  el.classList.remove("cited-reveal-armed");
}

function arm(el: HTMLElement) {
  el.classList.remove("is-revealed");
  el.classList.add("cited-reveal-armed");
}

function getSharedObserver(): IntersectionObserver {
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const meta = observed.get(entry.target);
          if (!meta) continue;
          if (entry.isIntersecting) {
            reveal(meta.el);
            if (meta.once) {
              sharedObserver?.unobserve(meta.el);
              observed.delete(meta.el);
            }
            continue;
          }
          if (!meta.once) {
            arm(meta.el);
          }
        }
      },
      { threshold: 0.14, rootMargin: "0px 0px -6% 0px" },
    );
  }
  return sharedObserver;
}

function useReveal(once: boolean) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      reveal(el);
      return;
    }

    if (elementInView(el)) {
      reveal(el);
      if (once) return;
    } else {
      // Arm only after mount so SSR / no-JS never hides content
      arm(el);
    }

    const observer = getSharedObserver();
    observed.set(el, { once, el });
    observer.observe(el);

    return () => {
      observer.unobserve(el);
      observed.delete(el);
    };
  }, [once]);

  return ref;
}

export function ScrollReveal({
  children,
  className,
  as = "div",
  delay = 0,
  once = true,
  style,
}: ScrollRevealProps) {
  const ref = useReveal(once);
  const classes = cn(
    "cited-reveal",
    delay > 0 && `cited-reveal-delay-${delay}`,
    className,
  );

  if (as === "li") {
    return (
      <li
        ref={ref as React.RefObject<HTMLLIElement>}
        style={style}
        className={classes}
      >
        {children}
      </li>
    );
  }

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      style={style}
      className={classes}
    >
      {children}
    </div>
  );
}
