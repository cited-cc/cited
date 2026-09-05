import Link from "next/link";

import { CitedLogo } from "@/components/shared/cited-logo";
import { MARKETING_FOOTER } from "@/lib/content/marketing";
import { cn } from "@/lib/utils";

type MarketingFooterProps = {
  className?: string;
};

export function MarketingFooter({ className }: MarketingFooterProps) {
  return (
    <footer
      className={cn(
        "mt-auto border-t border-cited-inverse-line bg-cited-inverse text-cited-on-inverse",
        className,
      )}
    >
      <div className="mx-auto max-w-[1240px] px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.35fr_repeat(5,minmax(0,0.7fr))]">
          <div className="sm:col-span-2 lg:col-span-1">
            <CitedLogo href="/" markSize={22} className="text-cited-on-inverse" />
            <p className="mt-4 max-w-sm text-[length:var(--text-body-sm)] leading-[var(--leading-relaxed)] text-cited-on-inverse-muted">
              Cited is a citation inbox for AI search. Monitor selected
              prompts, preserve evidence, and know when your website becomes
              part of the answer.
            </p>
          </div>
          {MARKETING_FOOTER.map((group) => (
            <div key={group.title}>
              <p className="type-micro mb-3 text-cited-on-inverse-faint">
                {group.title}
              </p>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={`${group.title}-${link.href}-${link.label}`}>
                    <Link
                      href={link.href}
                      className="text-sm text-cited-on-inverse-muted transition-colors duration-150 hover:text-cited-on-inverse focus-visible:text-cited-on-inverse"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
