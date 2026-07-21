import { fetchBlogPosts } from "@/lib/blog-store";
import { BlogListClient } from "@/components/blog/BlogListClient";

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const posts = await fetchBlogPosts();
  return <BlogListClient posts={posts} />;
}
