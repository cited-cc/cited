import { createDocsArticlePage } from "@/components/docs/create-docs-page";

const { generateMetadata, Page } = createDocsArticlePage("changelog");

export { generateMetadata };
export default Page;
