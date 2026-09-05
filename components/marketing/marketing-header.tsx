"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { CitedLogo } from "@/components/shared/cited-logo";
import { GitHubStarLink } from "@/components/marketing/github-star-link";
import { Button } from "@/components/ui/button";
import { trackMarketingEvent } from "@/lib/analytics/marketing";
import { MARKETING_NAV } from "@/lib/content/marketing";
import { cn } from "@/lib/utils";

type MarketingHeaderProps = {
  className?: string;
  /** Server-resolved session; avoids shipping Clerk client JS on marketing. */
  signedIn?: boolean;
  /** Live GitHub star count when the public repository is reachable. */
  githubStarCount?: number | null;
};

export function MarketingHeader({
  className,
  signedIn = false,
  githubStarCount = null,
}: MarketingHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mobileOpen) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false);
    }

    function onPointer(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMobileOpen(false);
      }
    }

    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [mobileOpen]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-cited-inverse-line bg-cited-inverse text-cited-on-inverse",
        "pt-[env(safe-area-inset-top,0px)]",
        className,
      )}
    >
      <div className="mx-auto flex h-14 max-w-[1240px] items-center justify-between gap-3 px-4 sm:gap-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-8">
          <CitedLogo
            href="/"
            markSize={22}
            className="shrink-0 text-cited-on-inverse"
          />
          {MARKETING_NAV.length > 0 ? (
            <nav
              className="hidden items-center gap-5 md:flex"
              aria-label="Marketing"
            >
              {MARKETING_NAV.map((link) => (
                <Link
                  key={`${link.href}-${link.label}`}
                  href={link.href}
                  className="text-[length:var(--text-body-sm)] font-medium text-cited-on-inverse-muted transition hover:text-cited-on-inverse"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <GitHubStarLink starCount={githubStarCount} />
          {signedIn ? (
            <Button
              variant="citation"
              size="sm"
              href="/app"
              className="min-h-9 px-2.5 text-[13px] sm:min-h-8 sm:px-3 sm:text-[length:var(--text-body-sm)]"
            >
              Open app
            </Button>
          ) : (
            <>
              <Link
                href="/sign-in"
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium text-cited-on-inverse-muted transition hover:bg-white/10 hover:text-cited-on-inverse",
                  MARKETING_NAV.length > 0 && "hidden sm:inline-flex",
                )}
                onClick={() =>
                  trackMarketingEvent("marketing_sign_in_clicked", {
                    route: "/sign-in",
                    cta: "header_sign_in",
                  })
                }
              >
                Sign in
              </Link>
              <Button
                variant="citation"
                size="sm"
                href="/scan"
                className="min-h-9 px-2.5 text-[13px] sm:min-h-8 sm:px-3 sm:text-[length:var(--text-body-sm)]"
                onClick={() =>
                  trackMarketingEvent("marketing_cta_clicked", {
                    route: "/scan",
                    cta: "header_check_domain",
                  })
                }
              >
                <span className="sm:hidden">Check domain</span>
                <span className="hidden sm:inline">Check a domain</span>
              </Button>
            </>
          )}
          {MARKETING_NAV.length > 0 ? (
            <div ref={menuRef} className="relative md:hidden">
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-white/15 text-cited-on-inverse-muted transition hover:bg-white/10 hover:text-cited-on-inverse"
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
                aria-controls={menuId}
                onClick={() => setMobileOpen((open) => !open)}
              >
                {mobileOpen ? (
                  <X className="h-4 w-4" aria-hidden />
                ) : (
                  <Menu className="h-4 w-4" aria-hidden />
                )}
              </button>
              {mobileOpen ? (
                <nav
                  id={menuId}
                  aria-label="Mobile marketing"
                  className="absolute right-0 top-full z-50 mt-2 w-[min(calc(100vw-2rem),240px)] overflow-hidden rounded-md border border-cited-inverse-line bg-cited-inverse py-1 cited-overlay-shadow"
                >
                  {MARKETING_NAV.map((link) => (
                    <Link
                      key={`mobile-${link.href}-${link.label}`}
                      href={link.href}
                      className="block px-3 py-2.5 text-sm text-cited-on-inverse-muted transition hover:bg-white/10 hover:text-cited-on-inverse"
                      onClick={() => setMobileOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                  <div className="my-1 border-t border-cited-inverse-line" />
                  {signedIn ? (
                    <Link
                      href="/app"
                      className="block px-3 py-2.5 text-sm text-cited-on-inverse-muted transition hover:bg-white/10 hover:text-cited-on-inverse"
                      onClick={() => setMobileOpen(false)}
                    >
                      Open app
                    </Link>
                  ) : (
                    <>
                      <Link
                        href="/sign-in"
                        className="block px-3 py-2.5 text-sm text-cited-on-inverse-muted transition hover:bg-white/10 hover:text-cited-on-inverse"
                        onClick={() => {
                          trackMarketingEvent("marketing_sign_in_clicked", {
                            route: "/sign-in",
                            cta: "mobile_sign_in",
                          });
                          setMobileOpen(false);
                        }}
                      >
                        Sign in
                      </Link>
                      <Link
                        href="/scan"
                        className="block px-3 py-2.5 text-sm font-medium text-cited-accent-bright transition hover:bg-white/10"
                        onClick={() => {
                          trackMarketingEvent("marketing_cta_clicked", {
                            route: "/scan",
                            cta: "mobile_check_domain",
                          });
                          setMobileOpen(false);
                        }}
                      >
                        Check a domain
                      </Link>
                    </>
                  )}
                </nav>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
