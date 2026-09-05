import { createBlogArticlePage } from "@/components/blog/create-blog-page";

const { generateMetadata, Page } = createBlogArticlePage("llm-visibility-audit");

export { generateMetadata };
export default Page;
