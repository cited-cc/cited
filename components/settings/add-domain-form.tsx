"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button, buttonRowItemClassName } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { FieldDescription, FieldLabel, FormField } from "@/components/ui/field";
import { TextInput } from "@/components/ui/input";
import { addWorkspaceDomainAction } from "@/lib/domains/actions";

type AddDomainFormProps = {
  defaultBrandName?: string;
  redirectToVerification?: boolean;
};

export function AddDomainForm({
  defaultBrandName = "",
  redirectToVerification = false,
}: AddDomainFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await addWorkspaceDomainAction(formData);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      if (redirectToVerification && result.domainId) {
        router.push(`/app/settings/domains?domain=${result.domainId}`);
        router.refresh();
        return;
      }
      router.refresh();
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {error ? (
        <Callout tone="warning" title="Could not add domain">
          {error}
        </Callout>
      ) : null}

      <FormField>
        <FieldLabel htmlFor="add-domain">Domain</FieldLabel>
        <TextInput
          id="add-domain"
          name="domain"
          placeholder="example.com"
          required
          disabled={pending}
        />
        <FieldDescription>
          Enter the root domain you control. Subdomains are supported after
          verification.
        </FieldDescription>
      </FormField>

      <FormField>
        <FieldLabel htmlFor="add-brand-name">Brand name</FieldLabel>
        <TextInput
          id="add-brand-name"
          name="brandName"
          defaultValue={defaultBrandName}
          placeholder="Example Co"
          required
          disabled={pending}
        />
      </FormField>

      <FormField>
        <FieldLabel htmlFor="add-alternate-names">Alternate names</FieldLabel>
        <TextInput
          id="add-alternate-names"
          name="alternateNames"
          placeholder="Example Co, ExampleApp"
          disabled={pending}
        />
        <FieldDescription>
          Comma-separated names Cited should recognize in mentions.
        </FieldDescription>
      </FormField>

      <Button
        type="submit"
        size="sm"
        variant="primary"
        className={buttonRowItemClassName}
        disabled={pending}
      >
        {pending ? "Adding domain..." : "Add domain"}
      </Button>
    </form>
  );
}
