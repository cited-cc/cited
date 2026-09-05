"use client";

import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { FieldError, FieldLabel, FormField } from "@/components/ui/field";
import { TextInput } from "@/components/ui/input";
import { trackMarketingEvent } from "@/lib/analytics/marketing";
import { HERO_DOMAIN } from "@/lib/content/marketing";
import { cn } from "@/lib/utils";

type HeroDomainCaptureProps = {
  className?: string;
  cta?: string;
};

export function HeroDomainCapture({
  className,
  cta = "hero_domain_submit",
}: HeroDomainCaptureProps) {
  const router = useRouter();
  const formId = useId();
  const [domain, setDomain] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = domain.trim();
    if (!trimmed) {
      setError(HERO_DOMAIN.emptyError);
      return;
    }

    trackMarketingEvent("marketing_cta_clicked", {
      cta,
      route: "/scan",
    });

    const params = new URLSearchParams();
    params.set("domain", trimmed);
    router.push(`/scan?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("w-full max-w-xl", className)}
      noValidate
    >
      <FormField>
        <FieldLabel htmlFor={`${formId}-domain`} className="sr-only">
          {HERO_DOMAIN.label}
        </FieldLabel>
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
          <TextInput
            id={`${formId}-domain`}
            name="domain"
            autoComplete="url"
            inputMode="url"
            placeholder={HERO_DOMAIN.placeholder}
            value={domain}
            onChange={(event) => {
              setDomain(event.target.value);
              if (error) setError(null);
            }}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${formId}-domain-err` : undefined}
            className="box-border h-12 min-h-12 w-full flex-1 px-3.5 text-[16px] leading-normal sm:text-[13px]"
            mono
          />
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="h-12 min-h-12 w-full shrink-0 px-6 text-[16px] sm:w-auto sm:text-[length:var(--text-body-lg)]"
          >
            {HERO_DOMAIN.submitLabel}
          </Button>
        </div>
        <FieldError id={`${formId}-domain-err`}>{error}</FieldError>
      </FormField>
      <p className="mt-3 type-body-sm text-cited-ink-subtle">
        {HERO_DOMAIN.helper}
      </p>
    </form>
  );
}
