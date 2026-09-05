import Link from "next/link";

import { AuthSignal } from "@/components/auth/auth-signal";
import { CitedLogo } from "@/components/shared/cited-logo";
import { cn } from "@/lib/utils";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  className,
}: AuthShellProps) {
  return (
    <div className="flex min-h-dvh w-full overflow-x-clip bg-cited-canvas">
      <aside className="relative hidden w-[44%] max-w-[640px] flex-col justify-between overflow-hidden border-r border-cited-line bg-cited-surface p-10 lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.55]"
          style={{
            backgroundImage:
              "linear-gradient(var(--cited-line) 1px, transparent 1px), linear-gradient(90deg, var(--cited-line) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            maskImage:
              "radial-gradient(110% 90% at 30% 10%, black 35%, transparent 78%)",
          }}
        />
        <CitedLogo href="/" markSize={32} className="relative z-10" />
        <div className="relative z-10">
          <AuthSignal className="mb-10" />
          <p className="type-micro text-cited-ink-faint">
            AI citation monitoring
          </p>
          <p className="mt-3 max-w-sm font-display text-2xl font-semibold tracking-[-0.02em] text-balance text-cited-ink-strong sm:text-[1.75rem]">
            Know when AI cites you. Keep the receipt.
          </p>
          <p className="mt-3 max-w-sm type-body text-cited-ink-muted">
            Workspaces, monitors, and citation notes. Secure by default, calm by
            design.
          </p>
        </div>
        <p className="relative z-10 font-mono text-[11px] tracking-[0.16em] text-cited-ink-faint uppercase">
          Cited · Workspace access
        </p>
      </aside>

      <main className="relative flex flex-1 flex-col pt-[env(safe-area-inset-top,0px)]">
        <div className="flex items-center p-5 lg:hidden">
          <CitedLogo href="/" markSize={28} />
        </div>
        <div className="flex flex-1 items-center justify-center px-5 pb-[calc(4rem+3.25rem+env(safe-area-inset-bottom,0px))] lg:pb-16">
          <div
            className={cn(
              "w-full max-w-[420px] min-w-0 motion-safe:animate-[cited-auth-compose_420ms_var(--cited-ease)]",
              className,
            )}
          >
            <div className="rounded-[var(--cited-radius-xl)] border border-cited-line bg-cited-surface px-6 py-7 cited-note-shadow sm:px-8 sm:py-8">
              <header className="text-center">
                <p className="type-micro text-cited-citation">{eyebrow}</p>
                <h1 className="mt-3 font-display text-[1.625rem] font-semibold tracking-[-0.02em] text-cited-ink-strong sm:text-[1.75rem]">
                  {title}
                </h1>
                {subtitle ? (
                  <p className="mx-auto mt-2 max-w-[28ch] type-body-sm text-cited-ink-muted sm:max-w-none">
                    {subtitle}
                  </p>
                ) : null}
              </header>

              <div className="mt-7">{children}</div>

              {footer ? (
                <div className="mt-6 border-t border-cited-line-subtle pt-5 text-center text-sm text-cited-ink-muted">
                  {footer}
                </div>
              ) : null}
            </div>

            <p className="mt-6 text-center type-meta text-cited-ink-faint lg:hidden">
              <Link href="/" className="underline-offset-4 hover:underline">
                Back to Cited
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
