import { createBlogArticlePage } from "@/components/blog/create-blog-page";

const { generateMetadata, Page } = createBlogArticlePage(
  "how-to-check-if-perplexity-cites-your-website",
);

export { generateMetadata };
export default Page;
