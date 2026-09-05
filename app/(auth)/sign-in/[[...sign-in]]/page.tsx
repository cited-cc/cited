import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { SignInFormSwitcher } from "@/components/auth/sign-in-form-switcher";
import { trackProductEvent } from "@/lib/analytics/product";
import {
  getDefaultPostAuthDestination,
  sanitizeReturnPath,
} from "@/lib/auth/redirects";
import { canRunBrowserBootstrap } from "@/lib/auth/bootstrap";
import { parsePublicPlanKey } from "@/lib/content/plans";

type SignInPageProps = {
  searchParams: Promise<{ redirect_url?: string; plan?: string }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const plan = parsePublicPlanKey(params.plan);
  const fallback = getDefaultPostAuthDestination(plan ?? undefined);
  const redirectUrl = sanitizeReturnPath(params.redirect_url, fallback);
  const showSetupLink = await canRunBrowserBootstrap();

  trackProductEvent("auth_sign_in_viewed", {
    route: "/sign-in",
    plan: plan ?? undefined,
  });

  const signUpParams = new URLSearchParams();
  if (plan) signUpParams.set("plan", plan);
  const signUpHref = signUpParams.toString()
    ? `/sign-up?${signUpParams.toString()}`
    : "/sign-up";

  return (
    <AuthShell
      eyebrow="Cited"
      title="Welcome back"
      subtitle="Sign in to pick up your citation monitoring."
      footer={
        showSetupLink ? (
          <p>
            First time here?{" "}
            <Link
              href="/setup"
              className="font-medium text-cited-ink underline-offset-4 hover:underline"
            >
              Complete setup
            </Link>
          </p>
        ) : (
          <p>
            Need an account?{" "}
            <Link
              href={signUpHref}
              className="font-medium text-cited-ink underline-offset-4 hover:underline"
            >
              Create an account
            </Link>
          </p>
        )
      }
    >
      <SignInFormSwitcher redirectUrl={redirectUrl} showSetupLink={showSetupLink} />
    </AuthShell>
  );
}
