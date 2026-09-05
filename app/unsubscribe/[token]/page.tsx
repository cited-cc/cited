import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { lookupUnsubscribeToken } from "@/lib/notifications/unsubscribe";

export const metadata: Metadata = {
  title: "Notification preferences",
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ token: string }>;
};

function UnsubscribeShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center bg-cited-canvas px-6 py-16">
      {children}
    </main>
  );
}

export default async function UnsubscribePage({ params }: Props) {
  const { token } = await params;
  const lookup = await lookupUnsubscribeToken(token);

  if (!lookup.ok) {
    return (
      <UnsubscribeShell>
        <p className="type-micro text-cited-accent">Cited</p>
        <h1 className="mt-2 type-heading text-2xl text-cited-ink-strong">
          This notification link is no longer valid.
        </h1>
        <p className="mt-3 type-body-sm text-cited-ink-muted">
          You can sign in to manage notification preferences from your Cited
          settings.
        </p>
        <div className="mt-8">
          <Button href="/sign-in">Sign in</Button>
        </div>
      </UnsubscribeShell>
    );
  }

  if (lookup.usedAt) {
    return (
      <UnsubscribeShell>
        <p className="type-micro text-cited-accent">Cited</p>
        <h1 className="mt-2 type-heading text-2xl text-cited-ink-strong">
          Notification preference updated.
        </h1>
        <p className="mt-3 type-body-sm text-cited-ink-muted">
          You will no longer receive this type of Cited email. Your workspace
          data and monitoring settings were not changed.
        </p>
        <div className="mt-8">
          <Button href="/unsubscribe/success" variant="secondary">
            Done
          </Button>
        </div>
      </UnsubscribeShell>
    );
  }

  const scopeLabel = (() => {
    switch (lookup.scope) {
      case "all_email":
        return "all Cited email notifications";
      case "instant_alerts":
        return "instant citation alert emails";
      case "weekly_digest":
        return "weekly digest emails";
      case "monitor_issues":
        return "monitor issue emails";
      case "free_scan_followup":
        return "free scan follow-up emails";
      case "product_tips":
        return "product tips and welcome emails";
      default: {
        const _exhaustive: never = lookup.scope;
        return _exhaustive;
      }
    }
  })();

  return (
    <UnsubscribeShell>
      <p className="type-micro text-cited-accent">Cited</p>
      <h1 className="mt-2 type-heading text-2xl text-cited-ink-strong">
        Update email preferences
      </h1>
      <p className="mt-3 type-body-sm text-cited-ink-muted">
        Confirm to stop receiving {scopeLabel}. This does not change workspace
        monitoring or other email preferences you still want.
      </p>
      <form method="POST" action="/api/unsubscribe" className="mt-8">
        <input type="hidden" name="token" value={token} />
        <Button type="submit">Confirm unsubscribe</Button>
      </form>
      <p className="mt-6 type-body-sm text-cited-ink-muted">
        Or{" "}
        <Link
          href="/sign-in"
          className="text-cited-accent underline-offset-4 hover:underline"
        >
          sign in
        </Link>{" "}
        to manage preferences.
      </p>
    </UnsubscribeShell>
  );
}
