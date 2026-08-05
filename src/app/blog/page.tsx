import { Suspense } from "react";
import { fetchBlogPosts } from "@/lib/blog-store";
import { BlogListClient } from "@/components/blog/BlogListClient";

export const dynamic = "force-dynamic";

function BlogListFallback() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <p className="text-slate-500 text-sm">Cargando blog…</p>
    </div>
  );
}

export default async function BlogPage() {
  const posts = await fetchBlogPosts();
  return (
    <Suspense fallback={<BlogListFallback />}>
      <BlogListClient posts={posts} />
    </Suspense>
  );
}
