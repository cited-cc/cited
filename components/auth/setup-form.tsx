"use client";

import { useState, type FormEvent } from "react";

import { AuthField } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { bootstrapSelfHostedAction } from "@/lib/auth/actions";

export function SetupForm() {
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setError(null);
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const result = await bootstrapSelfHostedAction(formData);
    if (!result.ok) {
      setError(result.error);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {error ? (
        <Callout tone="danger" title="Setup could not complete">
          {error}
        </Callout>
      ) : null}

      <AuthField
        label="Setup token"
        type="password"
        name="bootstrapToken"
        autoComplete="off"
        required
        placeholder="Paste the server setup token"
        hint="Configure the one-time setup token in your server environment. It is never stored."
      />
      <AuthField
        label="Owner email"
        type="email"
        name="email"
        autoComplete="email"
        required
        placeholder="owner@example.com"
      />
      <AuthField
        label="Display name"
        type="text"
        name="displayName"
        autoComplete="name"
        placeholder="Optional"
      />
      <AuthField
        label="Workspace name"
        type="text"
        name="workspaceName"
        placeholder="My Cited workspace"
      />
      <AuthField
        label="Password"
        type="password"
        name="password"
        autoComplete="new-password"
        required
        placeholder="At least 12 characters"
        hint="Minimum 12 characters. Passwords are hashed with scrypt."
      />

      <Button type="submit" size="lg" loading={submitting} className="w-full">
        {submitting ? "Creating workspace…" : "Create owner workspace"}
      </Button>
    </form>
  );
}
