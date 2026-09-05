import { createDocsArticlePage } from "@/components/docs/create-docs-page";

const { generateMetadata, Page } = createDocsArticlePage("domain-verification");

export { generateMetadata };
export default Page;
