import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppPageHeader } from "@/components/app/app-page-header";
import { SettingsSubnav } from "@/components/settings/settings-subnav";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { FieldDescription, FieldLabel, FormField } from "@/components/ui/field";
import { TextInput } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Callout } from "@/components/ui/callout";
import { resolveCurrentAccessState } from "@/lib/auth/access-state";
import {
  canManageBilling,
  canManageWorkspaceSettings,
} from "@/lib/auth/permissions";
import { getPlanRegistryEntry } from "@/lib/entitlements/plan-catalog";
import { createAdminSupabaseClient } from "@/lib/db/admin";
import { updateWorkspaceNameAction } from "@/lib/settings/actions";
import type { PlanKey } from "@/types/product";

export const metadata: Metadata = {
  title: "Workspace settings",
};

export default async function WorkspaceSettingsPage() {
  const access = await resolveCurrentAccessState();

  if (

    access.kind === "workspace_suspended"
  ) {
    redirect("/app/billing?notice=access_limited");
  }

  if (access.kind !== "workspace_active") {
    redirect("/onboarding");
  }

  const admin = createAdminSupabaseClient();
  const [{ data: workspace }, { count: memberCount }] = await Promise.all([
    admin
      .from("workspaces")
      .select("name, slug, plan_key, status, created_at")
      .eq("id", access.workspaceId)
      .single(),
    admin
      .from("workspace_members")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", access.workspaceId),
  ]);

  const plan = getPlanRegistryEntry(
    (workspace?.plan_key as PlanKey) ?? access.planKey,
  );
  const canEdit = canManageWorkspaceSettings(access.role);
  const manageBilling = canManageBilling(access.role);

  return (
    <>
      <AppPageHeader
        eyebrow="Settings"
        title="Workspace"
        description="Name, plan, and membership summary for this citation desk."
      />
      <SettingsSubnav canManageBilling={manageBilling} />

      <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <Card>
          <CardHeader>
            <h2 className="type-title">Workspace details</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            {canEdit ? (
              <form action={updateWorkspaceNameAction} className="space-y-3">
                <FormField>
                  <FieldLabel htmlFor="workspace-name">Workspace name</FieldLabel>
                  <TextInput
                    id="workspace-name"
                    name="name"
                    defaultValue={(workspace?.name as string) ?? ""}
                    required
                  />
                  <FieldDescription>
                    Visible to members of this workspace.
                  </FieldDescription>
                </FormField>
                <Button type="submit" size="sm" variant="primary">
                  Save name
                </Button>
              </form>
            ) : (
              <FormField>
                <FieldLabel htmlFor="workspace-name-ro">Workspace name</FieldLabel>
                <TextInput
                  id="workspace-name-ro"
                  defaultValue={(workspace?.name as string) ?? ""}
                  readOnly
                />
              </FormField>
            )}

            <FormField>
              <FieldLabel htmlFor="workspace-slug">Slug</FieldLabel>
              <TextInput
                id="workspace-slug"
                defaultValue={(workspace?.slug as string) ?? ""}
                readOnly
              />
            </FormField>

            <div className="flex flex-wrap items-center gap-3">
              <span className="type-meta">Plan</span>
              <Badge variant="neutral">{plan.name}</Badge>
              {manageBilling ? (
                <a
                  href="/app/billing"
                  className="text-sm text-cited-accent underline-offset-4 hover:underline"
                >
                  Manage billing
                </a>
              ) : null}
            </div>

            <p className="type-meta text-cited-ink-subtle">
              Created:{" "}
              {workspace?.created_at
                ? new Date(workspace.created_at as string).toLocaleDateString(
                    "en-US",
                    { year: "numeric", month: "short", day: "numeric" },
                  )
                : "-"}
            </p>
            <p className="type-meta text-cited-ink-subtle">
              Members: {memberCount ?? 1}
            </p>
          </CardBody>
        </Card>

        <Callout tone="info" title="Team invitations">
          Team invitations are not enabled in this build.
        </Callout>

        <p className="type-body-sm text-cited-ink-muted">
          Need help operating Cited?{" "}
          <a
            href="/docs/getting-started"
            className="underline underline-offset-4"
            target="_blank"
            rel="noreferrer"
          >
            Read getting started
          </a>
          .
        </p>
      </div>
    </>
  );
}
