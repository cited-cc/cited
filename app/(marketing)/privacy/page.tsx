import type { Metadata } from "next";

import { LegalLayout } from "@/components/legal/legal-layout";
import { getLegalPage } from "@/lib/content/legal";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { BreadcrumbJsonLd } from "@/lib/seo/json-ld";

export const metadata: Metadata = buildPageMetadata("privacy");

export default function PrivacyPage() {
  const page = getLegalPage("privacy");

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Privacy", path: "/privacy" },
        ]}
      />
      <LegalLayout page={page} />
    </>
  );
}
