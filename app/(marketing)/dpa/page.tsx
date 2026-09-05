import type { Metadata } from "next";

import { LegalLayout } from "@/components/legal/legal-layout";
import { getLegalPage } from "@/lib/content/legal";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { BreadcrumbJsonLd } from "@/lib/seo/json-ld";

export const metadata: Metadata = buildPageMetadata("dpa");

export default function DpaPage() {
  const page = getLegalPage("dpa");

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "DPA", path: "/dpa" },
        ]}
      />
      <LegalLayout page={page} />
    </>
  );
}
