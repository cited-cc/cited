import type { Metadata } from "next";
import Link from "next/link";

import { LegalLayout } from "@/components/legal/legal-layout";
import {
  getLegalContactEmail,
  getLegalPage,
} from "@/lib/content/legal";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { BreadcrumbJsonLd } from "@/lib/seo/json-ld";

export const metadata: Metadata = buildPageMetadata("status");

export default function StatusPage() {
  const page = getLegalPage("status");
  const supportEmail = getLegalContactEmail("support");

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Status", path: "/status" },
        ]}
      />
      <LegalLayout page={page} showToc={false}>
        <p className="type-body-sm text-cited-ink-muted">
          Support:{" "}
          <a
            href={`mailto:${supportEmail}`}
            className="underline underline-offset-4"
          >
            {supportEmail}
          </a>
          {" · "}
          <Link href="/docs/troubleshooting" className="underline underline-offset-4">
            Troubleshooting
          </Link>
          {" · "}
          <Link href="/contact" className="underline underline-offset-4">
            Contact
          </Link>
        </p>
      </LegalLayout>
    </>
  );
}
