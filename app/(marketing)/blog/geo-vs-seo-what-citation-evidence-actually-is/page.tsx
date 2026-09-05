import { createBlogArticlePage } from "@/components/blog/create-blog-page";

const { generateMetadata, Page } = createBlogArticlePage(
  "geo-vs-seo-what-citation-evidence-actually-is",
);

export { generateMetadata };
export default Page;
