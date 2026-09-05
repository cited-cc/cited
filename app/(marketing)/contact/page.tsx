import type { Metadata } from "next";
import Link from "next/link";

import { ContactForm } from "@/components/contact/contact-form";
import { LegalContactCard } from "@/components/legal/legal-contact-card";
import { LegalLayout } from "@/components/legal/legal-layout";
import {
  getLegalContactEmail,
  getLegalPage,
} from "@/lib/content/legal";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { BreadcrumbJsonLd } from "@/lib/seo/json-ld";

export const metadata: Metadata = buildPageMetadata("contact");

export default function ContactPage() {
  const page = getLegalPage("contact");
  const support = getLegalContactEmail("support");
  const security = getLegalContactEmail("security");
  const privacy = getLegalContactEmail("privacy");
  const billing = getLegalContactEmail("billing");

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ]}
      />
      <LegalLayout page={page} showToc={false}>
        <ContactForm className="mb-10" />
        <p className="mb-4 type-meta text-cited-ink-subtle">
          Or email a specific channel directly
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <LegalContactCard
            title="General support"
            email={support}
            guidance="Product questions, monitoring issues, and account help."
          />
          <LegalContactCard
            title="Billing"
            email={billing}
            guidance="Invoices, failed payments, cancellations, and plan questions."
          />
          <LegalContactCard
            title="Security"
            email={security}
            guidance="Suspected vulnerabilities and security reports."
          />
          <LegalContactCard
            title="Privacy"
            email={privacy}
            guidance="Access, correction, export, deletion, and DPA requests."
          />
        </div>
        <p className="mt-8 type-body-sm text-cited-ink-muted">
          Docs contact article:{" "}
          <Link href="/docs/contact" className="underline underline-offset-4">
            /docs/contact
          </Link>
        </p>
      </LegalLayout>
    </>
  );
}
