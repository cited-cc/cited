import { createDocsArticlePage } from "@/components/docs/create-docs-page";

const { generateMetadata, Page } = createDocsArticlePage("llms");

export { generateMetadata };
export default Page;
