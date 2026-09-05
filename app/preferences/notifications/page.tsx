import { redirect } from "next/navigation";

import { resolveCurrentAccessState } from "@/lib/auth/access-state";

/**
 * Authenticated preference deep-link. Unauthenticated users go to sign-in.
 */
export default async function PreferencesNotificationsRedirect() {
  const access = await resolveCurrentAccessState();

  if (access.kind === "unauthenticated") {
    redirect("/sign-in?redirect_url=/app/settings/notifications");
  }

  redirect("/app/settings/notifications");
}
