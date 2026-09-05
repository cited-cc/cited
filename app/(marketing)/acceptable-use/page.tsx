import type { Metadata } from "next";

import { LegalLayout } from "@/components/legal/legal-layout";
import { getLegalPage } from "@/lib/content/legal";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { BreadcrumbJsonLd } from "@/lib/seo/json-ld";

export const metadata: Metadata = buildPageMetadata("acceptableUse");

export default function AcceptableUsePage() {
  const page = getLegalPage("acceptable-use");

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Acceptable Use", path: "/acceptable-use" },
        ]}
      />
      <LegalLayout page={page} />
    </>
  );
}
