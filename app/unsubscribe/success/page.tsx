import type { Metadata } from "next";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Preferences updated",
  robots: { index: false, follow: false },
};

export default function UnsubscribeSuccessPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center bg-cited-canvas px-6 py-16">
      <p className="type-micro text-cited-accent">Cited</p>
      <h1 className="mt-2 type-heading text-2xl text-cited-ink-strong">
        Notification preference updated.
      </h1>
      <p className="mt-3 type-body-sm text-cited-ink-muted">
        You will no longer receive this type of Cited email. Your workspace data
        and monitoring settings were not changed.
      </p>
      <div className="mt-8">
        <Button href="/sign-in" variant="secondary">
          Sign in
        </Button>
      </div>
    </main>
  );
}
