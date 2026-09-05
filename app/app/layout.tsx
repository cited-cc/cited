import { redirect } from "next/navigation";

import { AppShellChrome } from "@/components/app/app-shell";
import type { CreateMonitorDialogConfig } from "@/components/app/create-monitor-dialog";
import { AuthProviderShell } from "@/components/auth/auth-provider-shell";
import { LocalSessionProvider } from "@/components/auth/local-session-provider";
import {
  destinationForAccessState,
  resolveCurrentAccessState,
  accessMemberSubject,
} from "@/lib/auth/access-state";
import { getCurrentWorkspace } from "@/lib/auth";
import { buildSignInHref } from "@/lib/auth/redirects";
import { createAdminSupabaseClient } from "@/lib/db/admin";
import { resolveActiveDomainContext } from "@/lib/domains/active-domain";
import {
  getEffectiveMaxDomains,
  getEffectiveWorkspaceLimits,
} from "@/lib/entitlements/effective-limits";
import { getPlanEntitlements } from "@/lib/entitlements/plan-entitlements";
import { getPlanRegistryEntry } from "@/lib/entitlements/plan-catalog";
import { getSelectableAiSurfacesForPlan } from "@/lib/monitoring/surfaces";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const access = await resolveCurrentAccessState();

  if (access.kind === "unauthenticated") {
    redirect(buildSignInHref("/app"));
  }

  if (access.kind === "authenticated_no_workspace") {
    redirect("/setup");
  }

  if (access.kind === "workspace_onboarding") {
    redirect("/onboarding");
  }

  if (
    access.kind !== "workspace_active" &&
    access.kind !== "workspace_suspended"
  ) {
    redirect(destinationForAccessState(access));
  }

  const membership = await getCurrentWorkspace();
  const planEntry = getPlanRegistryEntry(access.planKey);

  let domainContext = null;
  let canAddDomain = false;
  let createMonitorConfig: CreateMonitorDialogConfig | null = null;

  if (access.kind === "workspace_active") {
    const admin = createAdminSupabaseClient();
    const { data: workspaceBilling } = await admin
      .from("workspaces")
      .select("portfolio_extra_domains")
      .eq("id", access.workspaceId)
      .maybeSingle();

    domainContext = await resolveActiveDomainContext({
      workspaceId: access.workspaceId,
      clerkUserId: accessMemberSubject(access),
      planKey: access.planKey,
    });

    const maxDomains = getEffectiveMaxDomains({
      planKey: access.planKey,
      portfolioExtraDomains: workspaceBilling?.portfolio_extra_domains as
        | number
        | null,
    });
    canAddDomain =
      access.planKey === "portfolio" &&
      domainContext.domains.length < maxDomains;

    const limits = getEffectiveWorkspaceLimits({
      planKey: access.planKey,
      portfolioExtraDomains: workspaceBilling?.portfolio_extra_domains as
        | number
        | null,
    });
    const entitlements = getPlanEntitlements(access.planKey);
    const activeDomain = domainContext.activeDomain;

    let promptCount = 0;
    let defaultCountryCode = "US";
    let defaultLanguageCode = "en";
    let defaultCity: string | null = null;

    if (activeDomain) {
      let promptQuery = admin
        .from("monitored_prompts")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", access.workspaceId);

      if (limits.promptLimitScope === "domain") {
        promptQuery = promptQuery.eq("domain_id", activeDomain.id);
      }

      const { count } = await promptQuery;
      promptCount = count ?? 0;

      const { data: latestPrompt } = await admin
        .from("monitored_prompts")
        .select("country_code, language_code, city")
        .eq("workspace_id", access.workspaceId)
        .eq("domain_id", activeDomain.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      defaultCountryCode =
        (latestPrompt?.country_code as string | undefined) ?? "US";
      defaultLanguageCode =
        (latestPrompt?.language_code as string | undefined) ?? "en";
      defaultCity = (latestPrompt?.city as string | null) ?? null;
    } else {
      const { count } = await admin
        .from("monitored_prompts")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", access.workspaceId);
      promptCount = count ?? 0;
    }

    createMonitorConfig = {
      workspaceId: access.workspaceId,
      domainId: activeDomain?.id ?? null,
      domainHostname: activeDomain?.hostname ?? null,
      domainVerified: activeDomain?.verificationStatus === "verified",
      promptCount,
      maxPrompts: limits.maxPrompts,
      allowedSurfaces: getSelectableAiSurfacesForPlan(access.planKey),
      supportsCity: entitlements.supportsMultipleLocations,
      defaultCountryCode,
      defaultLanguageCode,
      defaultCity,
      defaultCadenceLabel:
        entitlements.monitoringCadence === "daily" ? "Daily" : "Twice-weekly",
      canManage:
        access.role === "owner" ||
        access.role === "admin" ||
        access.role === "member",
      promptLimitScope: limits.promptLimitScope,
    };
  }

  const chrome = (
    <AppShellChrome
      workspaceName={membership?.workspace.name ?? "Workspace"}
      planName={planEntry.publicName}
      planLabel="Self-hosted"
      billingStatusLabel={null}
      domains={domainContext?.domains.map((domain) => ({
        id: domain.id,
        hostname: domain.hostname,
        verificationStatus: domain.verificationStatus,
      })) ?? []}
      activeDomainId={domainContext?.activeDomainId ?? null}
      showDomainSwitcher={domainContext?.supportsDomainSwitching ?? false}
      canAddDomain={canAddDomain}
      createMonitorConfig={createMonitorConfig}
    >
      {children}
    </AppShellChrome>
  );

  return (
    <LocalSessionProvider>
      <AuthProviderShell>{chrome}</AuthProviderShell>
    </LocalSessionProvider>
  );
}
