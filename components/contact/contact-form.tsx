"use client";

import { useId, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  FieldDescription,
  FieldError,
  FieldLabel,
  FormField,
} from "@/components/ui/field";
import { TextInput } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  CONTACT_TOPIC_LABELS,
  CONTACT_TOPICS,
} from "@/lib/contact/validation";
import { cn } from "@/lib/utils";

type ContactFormProps = {
  className?: string;
};

export function ContactForm({ className }: ContactFormProps) {
  const formId = useId();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState<(typeof CONTACT_TOPICS)[number]>("general");
  const [message, setMessage] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          topic,
          message,
          companyWebsite,
        }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
        fieldErrors?: Record<string, string>;
      };

      if (!response.ok) {
        setFieldErrors(data.fieldErrors ?? {});
        setError(data.error ?? "Please check the form and try again.");
        return;
      }

      setDone(true);
    } catch {
      setError(
        "Something went wrong. Try again shortly or email hello@cited.cc directly.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div
        className={cn(
          "rounded-lg border border-cited-line-subtle bg-cited-surface/40 p-5 sm:p-6",
          className,
        )}
      >
        <h2 className="type-title text-cited-ink">Message sent</h2>
        <p className="mt-2 type-body-sm text-cited-ink-muted">
          Thanks. We received your message and will reply by email.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={cn(
        "relative rounded-lg border border-cited-line-subtle bg-cited-surface/40 p-5 sm:p-6",
        className,
      )}
    >
      <h2 className="type-title text-cited-ink">Send a message</h2>
      <p className="mt-2 type-body-sm text-cited-ink-muted">
        Reach the Cited team at hello@cited.cc. Include what you were trying to
        do and the page or feature involved. Do not include secrets, webhook
        URLs, or verification tokens.
      </p>

      <div className="mt-6 space-y-5">
        <FormField>
          <FieldLabel htmlFor={`${formId}-name`}>Name</FieldLabel>
          <TextInput
            id={`${formId}-name`}
            name="name"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            invalid={Boolean(fieldErrors.name)}
            aria-describedby={`${formId}-name-err`}
          />
          <FieldError id={`${formId}-name-err`}>{fieldErrors.name}</FieldError>
        </FormField>

        <FormField>
          <FieldLabel htmlFor={`${formId}-email`}>Email</FieldLabel>
          <TextInput
            id={`${formId}-email`}
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            invalid={Boolean(fieldErrors.email)}
            aria-describedby={`${formId}-email-err`}
          />
          <FieldError id={`${formId}-email-err`}>{fieldErrors.email}</FieldError>
        </FormField>

        <FormField>
          <FieldLabel htmlFor={`${formId}-topic`}>Topic</FieldLabel>
          <Select
            id={`${formId}-topic`}
            name="topic"
            value={topic}
            onChange={(event) =>
              setTopic(event.target.value as (typeof CONTACT_TOPICS)[number])
            }
            invalid={Boolean(fieldErrors.topic)}
            aria-describedby={`${formId}-topic-err`}
          >
            {CONTACT_TOPICS.map((value) => (
              <option key={value} value={value}>
                {CONTACT_TOPIC_LABELS[value]}
              </option>
            ))}
          </Select>
          <FieldError id={`${formId}-topic-err`}>{fieldErrors.topic}</FieldError>
        </FormField>

        <FormField>
          <FieldLabel htmlFor={`${formId}-message`}>Message</FieldLabel>
          <Textarea
            id={`${formId}-message`}
            name="message"
            rows={6}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            invalid={Boolean(fieldErrors.message)}
            aria-describedby={`${formId}-message-desc ${formId}-message-err`}
            placeholder="What can we help with?"
          />
          <FieldDescription id={`${formId}-message-desc`}>
            For billing questions, include your workspace name and billing email.
          </FieldDescription>
          <FieldError id={`${formId}-message-err`}>
            {fieldErrors.message}
          </FieldError>
        </FormField>

        <div
          className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
          aria-hidden
        >
          <label htmlFor={`${formId}-company`}>Company website</label>
          <input
            id={`${formId}-company`}
            tabIndex={-1}
            autoComplete="off"
            value={companyWebsite}
            onChange={(event) => setCompanyWebsite(event.target.value)}
          />
        </div>
      </div>

      {error ? (
        <p className="mt-4 text-sm text-cited-danger" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-6">
        <Button type="submit" variant="primary" size="md" loading={submitting}>
          Send message
        </Button>
      </div>
    </form>
  );
}
