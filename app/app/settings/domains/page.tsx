import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AppPageHeader } from "@/components/app/app-page-header";
import { AddDomainForm } from "@/components/settings/add-domain-form";
import { SettingsSubnav } from "@/components/settings/settings-subnav";
import {
  Button,
  ButtonRow,
  ButtonRowForm,
  buttonRowItemClassName,
} from "@/components/ui/button";
import { CopyableField } from "@/components/ui/copyable-field";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Callout } from "@/components/ui/callout";
import { FieldDescription, FieldLabel, FormField } from "@/components/ui/field";
import { TextInput } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { resolveCurrentAccessState, accessMemberSubject } from "@/lib/auth/access-state";
import {
  canManageBilling,
  canManageWorkspaceSettings,
} from "@/lib/auth/permissions";
import { getEffectiveMaxDomains } from "@/lib/entitlements/effective-limits";
import { createAdminSupabaseClient } from "@/lib/db/admin";
import {
  listWorkspaceDomains,
  resolveActiveDomainContext,
} from "@/lib/domains/active-domain";
import {
  getWorkspaceDomainSetup,
} from "@/lib/domains/domain-service";
import {
  disableDomainAction,
  regenerateDomainTokenAction,
  retryDomainVerificationAction,
  updateBrandAliasesAction,
} from "@/lib/settings/actions";
import { switchActiveDomainFormAction } from "@/lib/domains/actions";
import type { DomainVerificationStatus } from "@/types/product";

export const metadata: Metadata = {
  title: "Domain settings",
};

type DomainSettingsPageProps = {
  searchParams: Promise<{ add?: string; domain?: string; purchased?: string }>;
};

function statusBadge(status: DomainVerificationStatus) {
  if (status === "verified") {
    return <Badge variant="success">Verified</Badge>;
  }
  if (status === "pending") {
    return <Badge variant="warning">Pending</Badge>;
  }
  return <Badge variant="neutral">Disabled</Badge>;
}

export default async function DomainSettingsPage({
  searchParams,
}: DomainSettingsPageProps) {
  const access = await resolveCurrentAccessState();
  const params = await searchParams;

  if (

    access.kind === "workspace_suspended"
  ) {
    redirect("/app/billing?notice=access_limited");
  }

  if (access.kind !== "workspace_active") {
    redirect("/onboarding");
  }

  const admin = createAdminSupabaseClient();
  const { data: workspace } = await admin
    .from("workspaces")
    .select("portfolio_extra_domains")
    .eq("id", access.workspaceId)
    .maybeSingle();

  const portfolioExtraDomains = workspace?.portfolio_extra_domains as
    | number
    | null;
  const maxDomains = getEffectiveMaxDomains({
    planKey: access.planKey,
    portfolioExtraDomains,
  });

  const [domains, domainContext] = await Promise.all([
    listWorkspaceDomains(access.workspaceId),
    resolveActiveDomainContext({
      workspaceId: access.workspaceId,
      clerkUserId: accessMemberSubject(access),
      planKey: access.planKey,
    }),
  ]);

  const selectedDomainId =
    params.domain ??
    domainContext.activeDomainId ??
    domains[0]?.id ??
    null;

  const domainSetup = selectedDomainId
    ? await getWorkspaceDomainSetup(access.workspaceId, selectedDomainId)
    : null;

  const canManage = canManageWorkspaceSettings(access.role);
  const manageBilling = canManageBilling(access.role);
  const showToken = canManage && Boolean(domainSetup?.verificationToken);
  const atDomainLimit = domains.length >= maxDomains;
  const showAddForm = params.add === "1" && canManage && !atDomainLimit;
  const showPurchasedSetup = params.purchased === "1" && showAddForm;
  const isPortfolio = access.planKey === "portfolio";

  return (
    <>
      <AppPageHeader
        eyebrow="Settings"
        title="Domains"
        description={
          isPortfolio
            ? "Manage verified domains in your portfolio. Each domain has its own prompts, monitors, and citation evidence."
            : "Verify ownership, manage brand aliases, and keep monitoring attributed to domains you control."
        }
      />
      <SettingsSubnav canManageBilling={manageBilling} />

      <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {isPortfolio ? (
          <Card>
            <CardHeader>
              <h2 className="type-title">Portfolio domains</h2>
              <p className="type-body-sm text-cited-ink-muted">
                {domains.length} of {maxDomains} domain slots in use.
              </p>
            </CardHeader>
            <CardBody className="space-y-3">
              {domains.length === 0 ? (
                <Callout tone="warning" title="No domains configured">
                  Add your first domain to start monitoring this portfolio
                  workspace.
                </Callout>
              ) : (
                domains.map((domain) => {
                  const isActive = domain.id === domainContext.activeDomainId;
                  return (
                    <div
                      key={domain.id}
                      className="flex flex-col gap-3 rounded-md border border-cited-line-subtle bg-cited-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm text-cited-ink">
                            {domain.hostname}
                          </p>
                          {statusBadge(domain.verificationStatus)}
                          {isActive ? (
                            <Badge variant="neutral">Active</Badge>
                          ) : null}
                        </div>
                        {domain.brandName ? (
                          <p className="mt-1 type-meta text-cited-ink-subtle">
                            {domain.brandName}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {!isActive ? (
                          <ButtonRowForm action={switchActiveDomainFormAction}>
                            <input
                              type="hidden"
                              name="domainId"
                              value={domain.id}
                            />
                            <Button
                              type="submit"
                              size="sm"
                              variant="secondary"
                              className={buttonRowItemClassName}
                            >
                              Switch to domain
                            </Button>
                          </ButtonRowForm>
                        ) : null}
                        <Button
                          size="sm"
                          variant="ghost"
                          href={`/app/settings/domains?domain=${domain.id}`}
                          className={buttonRowItemClassName}
                        >
                          Manage
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}

              {canManage && !atDomainLimit && !showAddForm ? (
                <Button
                  size="sm"
                  variant="primary"
                  href="/app/settings/domains?add=1"
                  className={buttonRowItemClassName}
                >
                  Add domain
                </Button>
              ) : null}

              {canManage && atDomainLimit && isPortfolio ? (
                <Callout tone="info" title="Domain limit reached">
                  This workspace has reached its configured domain limit. Ask your
                  administrator to adjust self-hosted limits if you need more domains.
                </Callout>
              ) : null}
            </CardBody>
          </Card>
        ) : null}

        {showAddForm ? (
          <Card>
            <CardHeader>
              <h2 className="type-title">Add domain</h2>
              {showPurchasedSetup ? (
                <p className="type-body-sm text-cited-ink-muted">
                  Payment confirmed. Add your domain below, then complete DNS
                  verification to start monitoring.
                </p>
              ) : null}
            </CardHeader>
            <CardBody>
              {showPurchasedSetup ? (
                <Callout tone="accent" title="Next: verify your domain" className="mb-4">
                  After you add the domain, Cited will show DNS TXT records to
                  publish. Verification usually completes within a few minutes
                  once DNS propagates.
                </Callout>
              ) : null}
              <AddDomainForm redirectToVerification />
            </CardBody>
          </Card>
        ) : null}

        {!domainSetup ? (
          !showAddForm ? (
            <Callout tone="warning" title="No domain configured">
              Verify a domain before Cited can attribute citation evidence.{" "}
              {isPortfolio && canManage && !atDomainLimit ? (
                <Link href="/app/settings/domains?add=1" className="underline">
                  Add domain
                </Link>
              ) : (
                <a href="/onboarding?step=2" className="underline">
                  Add domain
                </a>
              )}
            </Callout>
          ) : null
        ) : (
          <>
            <Card>
              <CardHeader>
                <h2 className="type-title">
                  {isPortfolio ? "Domain details" : "Primary domain"}
                </h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <FormField>
                  <FieldLabel htmlFor="primary-domain">Domain</FieldLabel>
                  <TextInput
                    id="primary-domain"
                    defaultValue={domainSetup.normalizedHostname}
                    readOnly
                  />
                </FormField>
                <p className="type-meta text-cited-ink-subtle">
                  Status:{" "}
                  {domainSetup.verificationStatus === "verified"
                    ? "Verified"
                    : domainSetup.verificationStatus === "disabled"
                      ? "Disabled"
                      : "Pending"}
                </p>

                {showToken ? (
                  <div className="space-y-4">
                    <CopyableField
                      label="DNS TXT host"
                      value={domainSetup.txtHost}
                      copyLabel="Copy host"
                    />
                    <CopyableField
                      label="DNS TXT value"
                      value={domainSetup.txtValue}
                      copyLabel="Copy value"
                      multiline
                    />
                    <FieldDescription>
                      Never share this token except as the required DNS record.
                    </FieldDescription>
                  </div>
                ) : (
                  <p className="type-body-sm text-cited-ink-muted">
                    Verification token is visible to owners and admins only.
                  </p>
                )}

                {canManage ? (
                  <ButtonRow>
                    <ButtonRowForm action={retryDomainVerificationAction}>
                      <input
                        type="hidden"
                        name="domainId"
                        value={domainSetup.domainId}
                      />
                      <Button
                        type="submit"
                        size="sm"
                        variant="primary"
                        className={buttonRowItemClassName}
                      >
                        Retry verification
                      </Button>
                    </ButtonRowForm>
                    <ButtonRowForm action={regenerateDomainTokenAction}>
                      <input
                        type="hidden"
                        name="domainId"
                        value={domainSetup.domainId}
                      />
                      <input type="hidden" name="confirm" value="1" />
                      <Button
                        type="submit"
                        size="sm"
                        variant="secondary"
                        className={buttonRowItemClassName}
                      >
                        Regenerate token
                      </Button>
                    </ButtonRowForm>
                    {domainSetup.verificationStatus !== "disabled" ? (
                      <ButtonRowForm action={disableDomainAction}>
                        <input
                          type="hidden"
                          name="domainId"
                          value={domainSetup.domainId}
                        />
                        <input type="hidden" name="confirm" value="1" />
                        <Button
                          type="submit"
                          size="sm"
                          variant="ghost"
                          className={buttonRowItemClassName}
                        >
                          Disable domain
                        </Button>
                      </ButtonRowForm>
                    ) : null}
                  </ButtonRow>
                ) : null}

                <Callout tone="info" title="Historical evidence">
                  Disabling a domain does not delete historical citation
                  evidence.
                </Callout>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="type-title">Brand aliases</h2>
              </CardHeader>
              <CardBody>
                {canManage && domainSetup.brandId ? (
                  <form action={updateBrandAliasesAction} className="space-y-4">
                    <input
                      type="hidden"
                      name="brandId"
                      value={domainSetup.brandId}
                    />
                    <FormField>
                      <FieldLabel htmlFor="brand-name">Brand name</FieldLabel>
                      <TextInput
                        id="brand-name"
                        name="brandName"
                        defaultValue={domainSetup.brandName}
                        required
                      />
                    </FormField>
                    <FormField>
                      <FieldLabel htmlFor="alternate-names">
                        Alternate names
                      </FieldLabel>
                      <TextInput
                        id="alternate-names"
                        name="alternateNames"
                        defaultValue={domainSetup.alternateNames.join(", ")}
                        placeholder="Example Co, ExampleApp"
                      />
                      <FieldDescription>
                        Comma-separated brand names Cited should recognize in
                        mentions.
                      </FieldDescription>
                    </FormField>
                    <Button
                      type="submit"
                      size="sm"
                      variant="primary"
                      className={buttonRowItemClassName}
                    >
                      Save brand context
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-2">
                    <p className="type-body text-cited-ink">
                      {domainSetup.brandName || "No brand set"}
                    </p>
                    <p className="type-body-sm text-cited-ink-muted">
                      {domainSetup.alternateNames.length > 0
                        ? domainSetup.alternateNames.join(", ")
                        : "No alternate names"}
                    </p>
                  </div>
                )}
              </CardBody>
            </Card>
          </>
        )}

        <p className="type-body-sm text-cited-ink-muted">
          <a
            href="/docs/domain-verification"
            className="underline underline-offset-4"
            target="_blank"
            rel="noreferrer"
          >
            Domain verification docs
          </a>
        </p>
      </div>
    </>
  );
}
