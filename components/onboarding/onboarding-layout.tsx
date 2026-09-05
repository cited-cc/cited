import Link from "next/link";

import { CitedLogo } from "@/components/shared/cited-logo";
import { ONBOARDING_STEPS } from "@/lib/onboarding/constants";
import { cn } from "@/lib/utils";

type OnboardingLayoutShellProps = {
  currentStep: number;
  planName: string;
  planLabel: string;
  children: React.ReactNode;
};

const HELP_LINKS = [
  { href: "/docs/domain-verification", label: "How domain verification works" },
  { href: "/docs/monitored-prompts", label: "How to choose prompts" },
  { href: "/docs/what-cited-monitors", label: "What Cited monitors" },
  { href: "/docs/ai-surfaces", label: "AI surface availability" },
] as const;

export function OnboardingLayoutShell({
  currentStep,
  planName,
  planLabel,
  children,
}: OnboardingLayoutShellProps) {
  return (
    <div className="cited-atmosphere cited-grain min-h-screen bg-cited-canvas text-cited-ink">
      <div className="mx-auto grid min-h-screen max-w-6xl lg:grid-cols-[280px_1fr]">
        <aside className="min-w-0 border-b border-cited-line px-6 py-8 lg:border-b-0 lg:border-r">
          <CitedLogo href="/" markSize={24} />
          <p className="mt-8 type-micro text-cited-accent">Setup</p>
          <h1 className="mt-2 font-display text-2xl text-cited-ink-strong">
            Citation desk
          </h1>
          <p className="mt-3 type-body-sm text-cited-ink-muted">
            Configure the domain and questions Cited will watch. Monitoring
            activates after setup is complete. Results can vary by provider,
            model, location, timing, and prompt wording.
          </p>

          <ol className="mt-8 space-y-2">
            {ONBOARDING_STEPS.map((step) => {
              const active = step.step === currentStep;
              const done = step.step < currentStep;
              return (
                <li
                  key={step.key}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-2 py-1.5",
                    active && "bg-cited-surface",
                  )}
                >
                  <span
                    className={cn(
                      "font-mono text-[11px] tracking-[0.08em]",
                      active
                        ? "text-cited-accent"
                        : done
                          ? "text-cited-ink-muted"
                          : "text-cited-ink-faint",
                    )}
                  >
                    {String(step.step).padStart(2, "0")}
                  </span>
                  <span
                    className={cn(
                      "text-sm",
                      active
                        ? "text-cited-ink-strong"
                        : "text-cited-ink-muted",
                    )}
                  >
                    {step.label}
                  </span>
                </li>
              );
            })}
          </ol>

          <div className="mt-10 rounded-md border border-cited-line-subtle bg-cited-surface/60 px-3 py-3">
            <p className="type-micro">Plan</p>
            <p className="mt-1 text-sm text-cited-ink">{planName}</p>
            <p className="mt-1 type-meta text-cited-ink-subtle">{planLabel}</p>
          </div>

          <div className="mt-6 rounded-md border border-cited-line-subtle bg-cited-surface/40 px-3 py-3">
            <p className="type-micro">Need help?</p>
            <ul className="mt-3 space-y-2">
              {HELP_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="type-body-sm text-cited-ink-muted underline-offset-4 hover:text-cited-ink hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/docs/contact"
                  className="type-body-sm text-cited-ink-muted underline-offset-4 hover:text-cited-ink hover:underline"
                >
                  Contact support
                </Link>
              </li>
            </ul>
          </div>
        </aside>

        <main className="min-w-0 px-6 py-8 sm:px-8 lg:py-12">
          <div className="mx-auto w-full max-w-xl min-w-0">{children}</div>
        </main>
      </div>
    </div>
  );
}
