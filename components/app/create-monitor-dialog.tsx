"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

import { SURFACE_LABELS } from "@/components/shared/ai-surface-badge";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { checkboxControlClassName } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { FieldDescription, FieldLabel, FormField } from "@/components/ui/field";
import { TextInput } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createMonitorAction } from "@/lib/monitoring/monitor-actions";
import type { AiSurfaceKey } from "@/types/product";

export type CreateMonitorDialogConfig = {
  workspaceId: string;
  domainId: string | null;
  domainHostname: string | null;
  domainVerified: boolean;
  promptCount: number;
  maxPrompts: number;
  allowedSurfaces: AiSurfaceKey[];
  supportsCity: boolean;
  defaultCountryCode: string;
  defaultLanguageCode: string;
  defaultCity: string | null;
  defaultCadenceLabel: string;
  canManage: boolean;
  promptLimitScope: "workspace" | "domain";
};

type CreateMonitorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: CreateMonitorDialogConfig | null;
};

function defaultSelectedSurfaces(surfaces: AiSurfaceKey[]): AiSurfaceKey[] {
  if (surfaces.length === 0) return [];
  const preferred: AiSurfaceKey[] = ["chatgpt", "gemini"];
  const picked = preferred.filter((surface) => surfaces.includes(surface));
  return picked.length > 0 ? picked : [surfaces[0]!];
}

export function CreateMonitorDialog({
  open,
  onOpenChange,
  config,
}: CreateMonitorDialogProps) {
  const router = useRouter();
  const [promptText, setPromptText] = useState("");
  const [selectedSurfaces, setSelectedSurfaces] = useState<AiSurfaceKey[]>([]);
  const [countryCode, setCountryCode] = useState("US");
  const [languageCode, setLanguageCode] = useState("en");
  const [city, setCity] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const remainingPrompts = useMemo(() => {
    if (!config) return 0;
    return Math.max(0, config.maxPrompts - config.promptCount);
  }, [config]);

  /* eslint-disable react-hooks/set-state-in-effect -- reset form when dialog opens */
  useEffect(() => {
    if (!open || !config) return;
    setPromptText("");
    setSelectedSurfaces(defaultSelectedSurfaces(config.allowedSurfaces));
    setCountryCode(config.defaultCountryCode);
    setLanguageCode(config.defaultLanguageCode);
    setCity(config.defaultCity ?? "");
    setError(null);
  }, [open, config]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function toggleSurface(surface: AiSurfaceKey) {
    setSelectedSurfaces((current) =>
      current.includes(surface)
        ? current.filter((item) => item !== surface)
        : [...current, surface],
    );
  }

  function handleSubmit() {
    if (!config?.domainId) return;
    setError(null);
    startTransition(async () => {
      const outcome = await createMonitorAction({
        workspaceId: config.workspaceId,
        domainId: config.domainId!,
        promptText,
        surfaces: selectedSurfaces,
        countryCode,
        languageCode,
        city: city.trim() || null,
      });

      if (!outcome.ok) {
        setError(outcome.error);
        return;
      }

      onOpenChange(false);
      router.refresh();
      router.push("/app/monitors");
    });
  }

  const limitLabel =
    config?.promptLimitScope === "domain"
      ? `for ${config.domainHostname ?? "this domain"}`
      : "on this plan";

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create monitor"
      description="Add a prompt and choose where Cited should check it."
      className="max-w-xl"
      footer={
        config?.canManage && config.domainId && config.domainVerified ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={pending}
              disabled={
                pending ||
                remainingPrompts <= 0 ||
                !promptText.trim() ||
                selectedSurfaces.length === 0
              }
              onClick={handleSubmit}
            >
              Create monitor
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        )
      }
    >
      {!config ? (
        <p className="type-body-sm text-cited-ink-muted">
          Monitor setup is unavailable for this workspace.
        </p>
      ) : !config.canManage ? (
        <p className="type-body-sm text-cited-ink-muted">
          Your role can view monitors but cannot create them.
        </p>
      ) : !config.domainId ? (
        <div className="space-y-3">
          <p className="type-body-sm text-cited-ink-muted">
            Add a domain to your workspace before creating monitors.
          </p>
          <Button variant="secondary" size="sm" href="/app/settings/domains">
            Open domains
          </Button>
        </div>
      ) : !config.domainVerified ? (
        <div className="space-y-3">
          <Callout tone="warning" title="Domain not verified">
            Cited only monitors verified domains. Finish DNS verification, then
            return here to add prompts.
          </Callout>
          <Button variant="secondary" size="sm" href="/app/settings/domains">
            Verify domain
          </Button>
        </div>
      ) : remainingPrompts <= 0 ? (
        <div className="space-y-3">
          <Callout tone="warning" title="Prompt limit reached">
            You’ve used all {config.maxPrompts} prompts {limitLabel}.
          </Callout>
          <Button variant="secondary" size="sm" href="/app/billing">
            Review plan
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          <p className="type-meta text-cited-ink-subtle">
            Monitoring{" "}
            <span className="font-mono text-cited-ink">
              {config.domainHostname}
            </span>
            {" · "}
            {remainingPrompts} prompt{remainingPrompts === 1 ? "" : "s"} remaining{" "}
            {limitLabel}
          </p>

          {error ? (
            <Callout tone="danger" title="Could not create monitor">
              {error}
            </Callout>
          ) : null}

          <FormField>
            <FieldLabel htmlFor="create-monitor-prompt">Prompt</FieldLabel>
            <TextInput
              id="create-monitor-prompt"
              value={promptText}
              onChange={(event) => setPromptText(event.target.value)}
              placeholder="What are the best tools for…"
              maxLength={500}
              autoFocus
            />
            <FieldDescription>
              The question buyers or prospects might ask AI about your category.
            </FieldDescription>
          </FormField>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-cited-ink">
              AI surfaces
            </legend>
            <p className="type-meta text-cited-ink-subtle">
              Choose where Cited should check this prompt when monitoring runs.
            </p>
            <div className="flex flex-wrap gap-2">
              {config.allowedSurfaces.map((surface) => {
                const checked = selectedSurfaces.includes(surface);
                return (
                  <label
                    key={surface}
                    className="inline-flex min-h-10 min-w-0 cursor-pointer items-center gap-2.5 rounded-md border border-cited-line-subtle px-3 py-2.5 text-sm leading-snug text-cited-ink transition hover:border-cited-line-strong"
                  >
                    <input
                      type="checkbox"
                      className={checkboxControlClassName}
                      checked={checked}
                      onChange={() => toggleSurface(surface)}
                    />
                    <span className="min-w-0">
                      {SURFACE_LABELS[surface] ?? surface}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField>
              <FieldLabel htmlFor="create-monitor-country">Country</FieldLabel>
              <Select
                id="create-monitor-country"
                value={countryCode}
                onChange={(event) => setCountryCode(event.target.value)}
              >
                <option value="US">United States</option>
                <option value="GB">United Kingdom</option>
                <option value="CA">Canada</option>
                <option value="AU">Australia</option>
              </Select>
            </FormField>
            <FormField>
              <FieldLabel htmlFor="create-monitor-language">Language</FieldLabel>
              <Select
                id="create-monitor-language"
                value={languageCode}
                onChange={(event) => setLanguageCode(event.target.value)}
              >
                <option value="en">English</option>
              </Select>
            </FormField>
          </div>

          {config.supportsCity ? (
            <FormField>
              <FieldLabel htmlFor="create-monitor-city">City (optional)</FieldLabel>
              <TextInput
                id="create-monitor-city"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="San Francisco"
                maxLength={80}
              />
            </FormField>
          ) : null}

          <Callout tone="info" title="Cadence">
            Monitoring cadence for this plan: {config.defaultCadenceLabel}. Cited
            activates checks after save.
          </Callout>

          <p className="type-meta text-cited-ink-faint">
            Need more prompts or surfaces?{" "}
            <Link
              href="/app/billing"
              className="text-cited-ink-subtle underline-offset-4 hover:underline"
            >
              Review your plan
            </Link>
            .
          </p>
        </div>
      )}
    </Dialog>
  );
}
