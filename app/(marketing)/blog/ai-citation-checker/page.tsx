import { createBlogArticlePage } from "@/components/blog/create-blog-page";

const { generateMetadata, Page } = createBlogArticlePage(
  "ai-citation-checker",
);

export { generateMetadata };
export default Page;
