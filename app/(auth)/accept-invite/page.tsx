import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { AcceptInviteForm } from "@/components/auth/accept-invite-form";
import { getSessionPrincipal } from "@/lib/auth/session";
import { buildSignInHref } from "@/lib/auth/redirects";

type AcceptInvitePageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function AcceptInvitePage({
  searchParams,
}: AcceptInvitePageProps) {
  const params = await searchParams;
  const token = params.token?.trim();

  if (!token) {
    redirect("/sign-in");
  }

  const principal = await getSessionPrincipal();
  if (!principal) {
    redirect(buildSignInHref(`/accept-invite?token=${encodeURIComponent(token)}`));
  }

  return (
    <AuthShell
      eyebrow="Workspace invitation"
      title="Accept invitation"
      subtitle="Join your team workspace on Cited."
    >
      <AcceptInviteForm token={token} />
    </AuthShell>
  );
}
