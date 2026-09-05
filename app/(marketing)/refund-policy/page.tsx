import type { Metadata } from "next";

import { LegalLayout } from "@/components/legal/legal-layout";
import { getLegalPage } from "@/lib/content/legal";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { BreadcrumbJsonLd } from "@/lib/seo/json-ld";

export const metadata: Metadata = buildPageMetadata("refundPolicy");

export default function RefundPolicyPage() {
  const page = getLegalPage("refund-policy");

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Refund Policy", path: "/refund-policy" },
        ]}
      />
      <LegalLayout page={page} />
    </>
  );
}
