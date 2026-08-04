import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchBlogPostBySlug, fetchBlogPosts } from "@/lib/blog-store";
import { getBlogField } from "@/lib/blog-posts";
import { BlogPostClient } from "@/components/blog/BlogPostClient";
import { ArticleJsonLd } from "@/components/seo/ArticleJsonLd";
import { absoluteUrl } from "@/lib/site-url";
import {
  blogSerpDescription,
  blogSerpTitle,
  getRelatedBlogPosts,
} from "@/lib/related-blog-posts";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  try {
    const posts = await fetchBlogPosts();
    return posts.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchBlogPostBySlug(slug);
  if (!post) {
    return { title: "Artículo no encontrado | Universo Nómada" };
  }

  const titleEs = getBlogField(post, "es", "title");
  const excerpt = getBlogField(post, "es", "excerpt");
  const title = blogSerpTitle(titleEs);
  const description = blogSerpDescription(excerpt);
  const url = absoluteUrl(`/blog/${slug}`);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: titleEs,
      description,
      url,
      type: "article",
      publishedTime: post.date,
      locale: "es_CL",
      images: [{ url: absoluteUrl(post.image), alt: titleEs }],
    },
    twitter: {
      card: "summary_large_image",
      title: titleEs,
      description,
      images: [absoluteUrl(post.image)],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await fetchBlogPostBySlug(slug);
  if (!post) notFound();

  const related = await getRelatedBlogPosts(slug, 3);
  const relatedPosts = related.map((p) => ({
    slug: p.slug,
    title: getBlogField(p, "es", "title"),
    image: p.image,
    readTime: p.readTime,
  }));

  return (
    <>
      <ArticleJsonLd post={post} />
      <BlogPostClient post={post} relatedPosts={relatedPosts} />
    </>
  );
}
