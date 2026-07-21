import { db } from "@/lib/db";
import { blogPosts as defaultBlogPosts, type BlogPost } from "@/lib/blog-posts";
import {
  inputToDbData,
  rowToBlogPost,
  type BlogArticleInput,
  type BlogArticleRow,
} from "@/lib/blog-utils";

export type { BlogArticleInput } from "@/lib/blog-utils";
export {
  adminRowToForm,
  estimateReadTime,
  slugifyTitle,
} from "@/lib/blog-utils";

async function ensureBlogSeeded() {
  const count = await db.blogArticle.count();
  if (count > 0) return;

  for (let i = 0; i < defaultBlogPosts.length; i++) {
    const post = defaultBlogPosts[i];
    await db.blogArticle.create({
      data: {
        slug: post.slug,
        titleJson: JSON.stringify(post.title),
        excerptJson: JSON.stringify(post.excerpt),
        contentJson: JSON.stringify(post.content),
        categoryJson: JSON.stringify(post.category),
        image: post.image,
        date: post.date,
        readTime: post.readTime,
        active: true,
        sortOrder: defaultBlogPosts.length - i,
      },
    });
  }
}

export async function fetchBlogPosts(options?: { includeInactive?: boolean }): Promise<BlogPost[]> {
  try {
    await ensureBlogSeeded();
    const rows = await db.blogArticle.findMany({
      where: options?.includeInactive ? undefined : { active: true },
      orderBy: [{ sortOrder: "desc" }, { date: "desc" }],
    });
    if (rows.length > 0) return rows.map(rowToBlogPost);
  } catch (error) {
    console.warn("[blog-store] DB no disponible, usando posts por defecto:", error);
  }
  return defaultBlogPosts;
}

export async function fetchBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    await ensureBlogSeeded();
    const row = await db.blogArticle.findFirst({
      where: { slug, active: true },
    });
    if (row) return rowToBlogPost(row);
  } catch (error) {
    console.warn("[blog-store] DB no disponible para slug:", slug, error);
  }
  return defaultBlogPosts.find((p) => p.slug === slug) ?? null;
}

export async function fetchBlogArticlesAdmin(): Promise<BlogArticleRow[]> {
  await ensureBlogSeeded();
  return db.blogArticle.findMany({
    orderBy: [{ sortOrder: "desc" }, { date: "desc" }],
  });
}

export { inputToDbData };
