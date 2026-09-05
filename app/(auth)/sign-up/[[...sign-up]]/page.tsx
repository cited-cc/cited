import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { isRegistrationAllowed } from "@/lib/auth/config";
import { parsePublicPlanKey } from "@/lib/content/plans";

type SignUpPageProps = {
  searchParams: Promise<{ plan?: string; redirect_url?: string }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  if (!isRegistrationAllowed()) {
    redirect("/setup");
  }

  const params = await searchParams;
  const plan = parsePublicPlanKey(params.plan);
  const setupHref = plan ? `/setup?plan=${plan}` : "/setup";

  return (
    <AuthShell
      eyebrow="Cited"
      title="Create your workspace"
      subtitle="Self-hosted Cited uses the setup flow to create the first workspace owner."
      footer={
        <p>
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-cited-ink underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <p className="type-body text-cited-ink-subtle">
        Continue to{" "}
        <Link href={setupHref} className="font-medium text-cited-ink underline-offset-4 hover:underline">
          workspace setup
        </Link>
        .
      </p>
    </AuthShell>
  );
}
