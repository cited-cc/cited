import type { Metadata } from "next";

import { LegalLayout } from "@/components/legal/legal-layout";
import { getLegalPage } from "@/lib/content/legal";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { BreadcrumbJsonLd } from "@/lib/seo/json-ld";

export const metadata: Metadata = buildPageMetadata("cookies");

export default function CookiesPage() {
  const page = getLegalPage("cookies");

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Cookies", path: "/cookies" },
        ]}
      />
      <LegalLayout page={page} />
    </>
  );
}
