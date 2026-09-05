"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { AuthField } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";

type LocalSignInFormProps = {
  redirectUrl: string;
  showSetupLink?: boolean;
};

export function LocalSignInForm({
  redirectUrl,
  showSetupLink = false,
}: LocalSignInFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setError(null);
    setSubmitting(true);

    const result = await signIn("local-credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Incorrect email or password.");
      setSubmitting(false);
      return;
    }

    router.push(redirectUrl);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {error ? (
        <Callout tone="danger" title="Could not sign you in">
          {error}
        </Callout>
      ) : null}

      <AuthField
        label="Email address"
        type="email"
        name="email"
        autoComplete="email"
        inputMode="email"
        autoFocus
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email address"
      />
      <AuthField
        label="Password"
        type="password"
        name="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter your password"
      />

      <Button
        type="submit"
        size="lg"
        loading={submitting}
        className="w-full"
      >
        {submitting ? "Signing in…" : "Continue"}
      </Button>

      {showSetupLink ? (
        <p className="text-center text-sm text-cited-muted">
          First time here?{" "}
          <Link href="/setup" className="font-medium text-cited-ink underline-offset-4 hover:underline">
            Complete setup
          </Link>
        </p>
      ) : null}
    </form>
  );
}
