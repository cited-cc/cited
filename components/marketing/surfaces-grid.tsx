import { ScrollReveal } from "@/components/marketing/scroll-reveal";
import { SURFACES_SECTION } from "@/lib/content/marketing";
import { cn } from "@/lib/utils";

type SurfacesGridProps = {
  className?: string;
};

export function SurfacesGrid({ className }: SurfacesGridProps) {
  return (
    <div className={cn(className)}>
      <ScrollReveal className="max-w-2xl">
        <h2 className="type-heading">{SURFACES_SECTION.heading}</h2>
        <p className="mt-4 max-w-xl type-body text-cited-ink-muted">
          {SURFACES_SECTION.body}
        </p>
      </ScrollReveal>

      <ul className="mt-10 grid list-none grid-cols-2 gap-x-6 gap-y-8 p-0 sm:grid-cols-3 lg:gap-x-10 lg:gap-y-12">
        {SURFACES_SECTION.items.map((item, index) => (
          <ScrollReveal
            key={item.key}
            as="li"
            delay={(Math.min(index + 1, 5) as 1 | 2 | 3 | 4 | 5)}
            className="flex flex-col items-start border-t border-cited-line-subtle pt-5"
          >
            <div className="flex h-10 w-10 items-center justify-center text-cited-ink">
              {/* Decorative mark; visible label provides the name */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.markSrc}
                alt=""
                width={28}
                height={28}
                className="h-7 w-7"
                loading="lazy"
                decoding="async"
                aria-hidden
              />
            </div>
            <p className="mt-3 type-meta tracking-[0.02em] text-cited-ink-muted">
              {item.label}
            </p>
          </ScrollReveal>
        ))}
      </ul>
    </div>
  );
}
