import { createBlogArticlePage } from "@/components/blog/create-blog-page";

const { generateMetadata, Page } = createBlogArticlePage(
  "how-to-know-if-chatgpt-cites-your-website",
);

export { generateMetadata };
export default Page;
