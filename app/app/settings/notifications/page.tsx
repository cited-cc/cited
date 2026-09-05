import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AppPageHeader } from "@/components/app/app-page-header";
import { SettingsSubnav } from "@/components/settings/settings-subnav";
import { NotificationSettingsForm } from "@/components/notifications/notification-settings-form";
import { resolveCurrentAccessState } from "@/lib/auth/access-state";
import { requireWorkspaceRole } from "@/lib/auth";
import { canManageBilling } from "@/lib/auth/permissions";
import {
  ensureUserNotificationPreferences,
  getWorkspaceNotificationPreferences,
} from "@/lib/notifications/preferences";

export const metadata: Metadata = {
  title: "Notifications",
};

export default async function NotificationSettingsPage() {
  const access = await resolveCurrentAccessState();

  if (

    access.kind === "workspace_suspended"
  ) {
    redirect("/app/billing?notice=access_limited");
  }

  if (access.kind !== "workspace_active") {
    redirect("/onboarding");
  }

  const membership = await requireWorkspaceRole(access.workspaceId, [
    "owner",
    "admin",
    "member",
    "viewer",
  ]);

  const workspace = await getWorkspaceNotificationPreferences(
    membership.workspaceId,
  );
  const personal = await ensureUserNotificationPreferences({
    workspaceId: membership.workspaceId,
    clerkUserId: membership.clerkUserId,
    role: membership.role,
  });

  return (
    <>
      <AppPageHeader
        eyebrow="Workspace"
        title="Notifications"
        description="Quiet citation notes by email. Evidence first, never noisy."
        meta={
          <Link
            href="/app/settings"
            className="text-sm text-cited-ink-muted underline-offset-4 hover:text-cited-ink hover:underline"
          >
            All settings
          </Link>
        }
      />
      <SettingsSubnav canManageBilling={canManageBilling(membership.role)} />

      <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <NotificationSettingsForm
          workspace={workspace}
          personal={personal}
          canEditWorkspace={canManageBilling(membership.role)}
        />
      </div>
    </>
  );
}
