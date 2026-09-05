import { createBlogArticlePage } from "@/components/blog/create-blog-page";

const { generateMetadata, Page } = createBlogArticlePage(
  "are-you-showing-up-in-google-ai-overviews",
);

export { generateMetadata };
export default Page;
