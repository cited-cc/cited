import type { Metadata } from "next";

import { LegalLayout } from "@/components/legal/legal-layout";
import { getLegalPage } from "@/lib/content/legal";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { BreadcrumbJsonLd } from "@/lib/seo/json-ld";

export const metadata: Metadata = buildPageMetadata("security");

export default function SecurityPage() {
  const page = getLegalPage("security");

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Security", path: "/security" },
        ]}
      />
      <LegalLayout page={page} />
    </>
  );
}
