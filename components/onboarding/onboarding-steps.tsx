"use client";

import { useState } from "react";

import { Button, ButtonRow, ButtonRowForm, buttonRowItemClassName } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { checkboxControlClassName } from "@/components/ui/checkbox";
import { CopyableField, ReadonlyField } from "@/components/ui/copyable-field";
import { FieldDescription, FieldLabel, FormField } from "@/components/ui/field";
import { TextInput } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  finishOnboardingAction,
  regenerateDnsRecordAction,
  saveDomainStepAction,
  savePromptsStepAction,
  saveVerifyLaterAction,
  saveWorkspaceStepAction,
  verifyDomainAction,
} from "@/lib/onboarding/actions";
import { PROMPT_IDEA_TEMPLATES } from "@/lib/onboarding/constants";
import type { AiSurfaceKey } from "@/types/product";

type SharedProps = {
  error?: string | null;
  notice?: string | null;
};

export function WorkspaceStepForm({
  defaultName,
  error,
}: SharedProps & { defaultName: string }) {
  return (
    <form action={saveWorkspaceStepAction} className="space-y-6">
      <div>
        <h2 className="font-display text-3xl text-cited-ink-strong">
          Name your workspace.
        </h2>
        <p className="mt-3 type-body text-cited-ink-muted">
          This is where your citation evidence, monitors, and notes will live.
        </p>
      </div>
      {error ? (
        <Callout tone="danger" title="Could not save">
          {error}
        </Callout>
      ) : null}
      <FormField>
        <FieldLabel htmlFor="workspace-name">Workspace name</FieldLabel>
        <TextInput
          id="workspace-name"
          name="name"
          defaultValue={defaultName}
          required
          maxLength={80}
          autoComplete="organization"
        />
        <FieldDescription>
          A short name is enough. You can change it later.
        </FieldDescription>
      </FormField>
      <Button type="submit" variant="primary" className={buttonRowItemClassName}>
        Continue
      </Button>
    </form>
  );
}

export function DomainStepForm({
  defaultDomain,
  defaultBrand,
  defaultAlternates,
  normalizedPreview,
  error,
}: SharedProps & {
  defaultDomain: string;
  defaultBrand: string;
  defaultAlternates: string;
  normalizedPreview?: string | null;
}) {
  return (
    <form action={saveDomainStepAction} className="space-y-6">
      <div>
        <h2 className="font-display text-3xl text-cited-ink-strong">
          What should Cited watch?
        </h2>
        <p className="mt-3 type-body text-cited-ink-muted">
          Start with one website and the brand names AI answers might use.
        </p>
      </div>
      {error ? (
        <Callout tone="danger" title="Could not save">
          {error}
        </Callout>
      ) : null}
      <FormField>
        <FieldLabel htmlFor="domain">Primary domain</FieldLabel>
        <TextInput
          id="domain"
          name="domain"
          placeholder="example.com"
          defaultValue={defaultDomain}
          required
        />
        <FieldDescription>
          Enter a hostname only. Paths are removed when Cited saves the domain.
        </FieldDescription>
      </FormField>
      {normalizedPreview ? (
        <p className="type-meta text-cited-ink-subtle">
          Normalized: <span className="font-mono">{normalizedPreview}</span>
        </p>
      ) : null}
      <FormField>
        <FieldLabel htmlFor="brandName">Brand or product name</FieldLabel>
        <TextInput
          id="brandName"
          name="brandName"
          placeholder="Example"
          defaultValue={defaultBrand}
          required
        />
      </FormField>
      <FormField>
        <FieldLabel htmlFor="alternateNames">
          Alternative names (optional)
        </FieldLabel>
        <TextInput
          id="alternateNames"
          name="alternateNames"
          placeholder="Example.com, Example Platform"
          defaultValue={defaultAlternates}
        />
        <FieldDescription>
          Comma-separated. Cited uses this to distinguish direct source
          citations from unlinked brand mentions.
        </FieldDescription>
      </FormField>
      <Button type="submit" variant="primary" className={buttonRowItemClassName}>
        Continue
      </Button>
    </form>
  );
}

export function DnsVerificationStepForm({
  txtHost,
  txtValue,
  verified,
  error,
  notice,
}: SharedProps & {
  txtHost: string;
  txtValue: string;
  verified: boolean;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl text-cited-ink-strong">
          Verify your domain.
        </h2>
        <p className="mt-3 type-body text-cited-ink-muted">
          Add one DNS TXT record so Cited can confirm you control this website.
        </p>
      </div>

      {verified ? (
        <Callout tone="accent" title="Domain verified">
          Ownership confirmed. Continue to choose the questions worth watching.
        </Callout>
      ) : null}

      {error ? (
        <Callout tone="danger" title="Not verified yet">
          {error}
        </Callout>
      ) : null}

      {notice === "regenerated" ? (
        <Callout tone="info" title="Record regenerated">
          The previous verification value is no longer valid. Update DNS with
          the new value below.
        </Callout>
      ) : null}

      <div className="rounded-lg border border-cited-line bg-cited-surface p-5">
        <ReadonlyField label="Type" value="TXT" />
        <div className="mt-5 border-t border-cited-line-subtle pt-5">
          <CopyableField label="Host" value={txtHost} copyLabel="Copy host" />
        </div>
        <div className="mt-5 border-t border-cited-line-subtle pt-5">
          <CopyableField
            label="Value"
            value={txtValue}
            copyLabel="Copy value"
            multiline
          />
        </div>
      </div>

      <details className="rounded-lg border border-cited-line-subtle px-4 py-3.5">
        <summary className="cursor-pointer text-sm font-medium text-cited-ink">
          How to add this
        </summary>
        <p className="mt-3 type-body-sm leading-relaxed text-cited-ink-muted">
          Open your DNS provider, create a TXT record for the host above, paste
          the value, and save. DNS changes can take time to propagate. Cited
          checks the record when you choose Verify domain.
        </p>
      </details>

      <ButtonRow>
        {!verified ? (
          <ButtonRowForm action={verifyDomainAction}>
            <Button
              type="submit"
              variant="primary"
              className={buttonRowItemClassName}
            >
              Verify domain
            </Button>
          </ButtonRowForm>
        ) : (
          <ButtonRowForm action={saveVerifyLaterAction}>
            <Button
              type="submit"
              variant="primary"
              className={buttonRowItemClassName}
            >
              Continue
            </Button>
          </ButtonRowForm>
        )}
        <ButtonRowForm action={regenerateDnsRecordAction}>
          <Button
            type="submit"
            variant="secondary"
            className={buttonRowItemClassName}
          >
            Regenerate record
          </Button>
        </ButtonRowForm>
        {!verified ? (
          <ButtonRowForm action={saveVerifyLaterAction}>
            <Button
              type="submit"
              variant="ghost"
              className={buttonRowItemClassName}
            >
              Save and verify later
            </Button>
          </ButtonRowForm>
        ) : null}
      </ButtonRow>
    </div>
  );
}

export function PromptsStepForm({
  maxPrompts,
  allowedSurfaces,
  surfaceLabels,
  defaultPrompts,
  defaultSurfaces,
  defaultCadenceLabel,
  supportsCity,
  error,
}: SharedProps & {
  maxPrompts: number;
  allowedSurfaces: AiSurfaceKey[];
  surfaceLabels: Record<string, string>;
  defaultPrompts: string[];
  defaultSurfaces: AiSurfaceKey[];
  defaultCadenceLabel: string;
  supportsCity: boolean;
}) {
  const initial =
    defaultPrompts.length > 0
      ? defaultPrompts
      : ["", "", ""];
  const [rows, setRows] = useState<string[]>(initial);
  const remaining = Math.max(0, maxPrompts - rows.filter((r) => r.trim()).length);

  return (
    <form action={savePromptsStepAction} className="space-y-6">
      <div>
        <h2 className="font-display text-3xl text-cited-ink-strong">
          Choose the questions worth watching.
        </h2>
        <p className="mt-3 type-body text-cited-ink-muted">
          Add the questions your buyers, prospects, or market are likely to ask
          AI.
        </p>
      </div>

      {error ? (
        <Callout tone="danger" title="Could not save">
          {error}
        </Callout>
      ) : null}

      <p className="type-meta text-cited-ink-subtle">
        {remaining} prompt{remaining === 1 ? "" : "s"} remaining on this plan
        (max {maxPrompts}).
      </p>

      <div className="space-y-3">
        {rows.map((value, index) => (
          <FormField key={`prompt-row-${index}`}>
            <FieldLabel htmlFor={`prompt_${index}`}>
              Prompt {index + 1}
            </FieldLabel>
            <TextInput
              id={`prompt_${index}`}
              name={`prompt_${index}`}
              value={value}
              onChange={(event) => {
                const next = [...rows];
                next[index] = event.target.value;
                setRows(next);
              }}
              maxLength={500}
            />
          </FormField>
        ))}
      </div>

      <ButtonRow>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className={buttonRowItemClassName}
          disabled={rows.length >= maxPrompts}
          onClick={() => setRows((prev) => [...prev, ""])}
        >
          Add prompt
        </Button>
        {rows.length > 1 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={buttonRowItemClassName}
            onClick={() => setRows((prev) => prev.slice(0, -1))}
          >
            Remove last
          </Button>
        ) : null}
      </ButtonRow>

      <details className="rounded-lg border border-cited-line-subtle px-4 py-3.5">
        <summary className="cursor-pointer text-sm font-medium text-cited-ink">
          Prompt ideas
        </summary>
        <ul className="mt-3 space-y-2">
          {PROMPT_IDEA_TEMPLATES.map((idea) => (
            <li key={idea} className="type-body-sm leading-relaxed text-cited-ink-muted">
              {idea}
            </li>
          ))}
        </ul>
      </details>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-cited-ink">
          Selected AI surfaces
        </legend>
        <p className="type-meta text-cited-ink-subtle">
          Choose where Cited should check these prompts when monitoring is
          active.
        </p>
        <div className="flex flex-wrap gap-2">
          {allowedSurfaces.map((surface) => (
            <label
              key={surface}
              className="inline-flex min-h-10 min-w-0 items-center gap-2.5 rounded-md border border-cited-line-subtle px-3 py-2.5 text-sm leading-snug text-cited-ink"
            >
              <input
                type="checkbox"
                name="surfaces"
                value={surface}
                className={checkboxControlClassName}
                defaultChecked={
                  defaultSurfaces.length > 0
                    ? defaultSurfaces.includes(surface)
                    : surface === "chatgpt" || surface === "gemini"
                }
              />
              <span className="min-w-0">{surfaceLabels[surface] ?? surface}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField>
          <FieldLabel htmlFor="countryCode">Country</FieldLabel>
          <Select id="countryCode" name="countryCode" defaultValue="US">
            <option value="US">United States</option>
            <option value="GB">United Kingdom</option>
            <option value="CA">Canada</option>
            <option value="AU">Australia</option>
          </Select>
        </FormField>
        <FormField>
          <FieldLabel htmlFor="languageCode">Language</FieldLabel>
          <Select id="languageCode" name="languageCode" defaultValue="en">
            <option value="en">English</option>
          </Select>
        </FormField>
      </div>

      {supportsCity ? (
        <FormField>
          <FieldLabel htmlFor="city">City (optional)</FieldLabel>
          <TextInput id="city" name="city" placeholder="San Francisco" />
        </FormField>
      ) : null}

      <Callout tone="info" title="Cadence">
        Monitoring cadence for this plan: {defaultCadenceLabel}. Status after
        save: Configured. Monitoring activates after setup is complete.
      </Callout>

      <Button type="submit" variant="primary" className={buttonRowItemClassName}>
        Continue
      </Button>
    </form>
  );
}

export function ReviewStepForm({
  workspaceName,
  domain,
  brandName,
  alternateNames,
  promptCount,
  surfaces,
  cadence,
  planName,
  error,
  canFinish,
}: SharedProps & {
  workspaceName: string;
  domain: string;
  brandName: string;
  alternateNames: string[];
  promptCount: number;
  surfaces: string[];
  cadence: string;
  planName: string;
  canFinish: boolean;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl text-cited-ink-strong">
          Review your citation desk.
        </h2>
        <p className="mt-3 type-body text-cited-ink-muted">
          Your setup is ready. Cited will use these settings when monitoring is
          active. Your Inbox will become the record of citations, mentions,
          recommendations, and missed opportunities it finds.
        </p>
      </div>

      {error ? (
        <Callout tone="danger" title="Cannot finish yet">
          {error}
        </Callout>
      ) : null}

      <dl className="space-y-4 rounded-lg border border-cited-line bg-cited-surface p-5">
        {[
          ["Workspace", workspaceName],
          ["Verified domain", domain],
          ["Brand names", [brandName, ...alternateNames].filter(Boolean).join(", ")],
          ["Prompt count", String(promptCount)],
          ["Selected AI surfaces", surfaces.join(", ")],
          ["Monitoring cadence", cadence],
          ["Plan", planName],
        ].map(([label, value]) => (
          <div
            key={label}
            className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
          >
            <dt className="type-meta shrink-0 text-cited-ink-subtle">{label}</dt>
            <dd className="min-w-0 text-sm leading-relaxed text-cited-ink sm:max-w-[65%] sm:text-right">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <Callout tone="info" title="Before live monitoring">
        Cited will begin collecting citation evidence once monitoring is
        activated. This phase saves your configuration without claiming scans
        are already running.
      </Callout>

      <form action={finishOnboardingAction}>
        <Button
          type="submit"
          variant="primary"
          disabled={!canFinish}
          className={buttonRowItemClassName}
        >
          Finish setup
        </Button>
      </form>
    </div>
  );
}
