import { createBlogArticlePage } from "@/components/blog/create-blog-page";

const { generateMetadata, Page } = createBlogArticlePage(
  "is-my-brand-cited-in-chatgpt",
);

export { generateMetadata };
export default Page;
