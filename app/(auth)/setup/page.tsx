import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { SetupForm } from "@/components/auth/setup-form";
import { canRunBrowserBootstrap } from "@/lib/auth/bootstrap";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const eligible = await canRunBrowserBootstrap();
  if (!eligible) {
    redirect("/sign-in");
  }

  return (
    <AuthShell
      eyebrow="Self-hosted setup"
      title="Create your workspace"
      subtitle="Set up the first owner account for this Cited deployment."
    >
      <SetupForm />
    </AuthShell>
  );
}
