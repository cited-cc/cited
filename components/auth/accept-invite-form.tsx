"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { acceptInvitationAction } from "@/lib/auth/actions";

type AcceptInviteFormProps = {
  token: string;
};

export function AcceptInviteForm({ token }: AcceptInviteFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setError(null);
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);
    formData.set("token", token);

    const result = await acceptInvitationAction(formData);
    if (!result.ok) {
      setError(result.error);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {error ? (
        <Callout tone="danger" title="Invitation could not be accepted">
          {error}
        </Callout>
      ) : null}

      <p className="type-body-sm text-cited-ink-muted">
        Sign in with the invited email, then accept to join the workspace.
      </p>

      <Button type="submit" size="lg" loading={submitting} className="w-full">
        {submitting ? "Accepting…" : "Accept invitation"}
      </Button>
    </form>
  );
}
