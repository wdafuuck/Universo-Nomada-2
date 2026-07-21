import type { BlogLocaleFields, BlogPost } from "@/lib/blog-posts";

export type BlogArticleRow = {
  id: number;
  slug: string;
  titleJson: string;
  excerptJson: string;
  contentJson: string;
  categoryJson: string;
  image: string;
  date: string;
  readTime: number;
  active: boolean;
  sortOrder: number;
};

export function parseLocaleJson(raw: string): BlogLocaleFields {
  try {
    return JSON.parse(raw) as BlogLocaleFields;
  } catch {
    return { es: "", en: "", fr: "", zh: "", pt: "" };
  }
}

export function localeFromSpanish(text: string): BlogLocaleFields {
  const value = text.trim();
  return { es: value, en: value, fr: value, zh: value, pt: value };
}

export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function estimateReadTime(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function rowToBlogPost(row: BlogArticleRow): BlogPost {
  return {
    slug: row.slug,
    title: parseLocaleJson(row.titleJson),
    excerpt: parseLocaleJson(row.excerptJson),
    content: parseLocaleJson(row.contentJson),
    category: parseLocaleJson(row.categoryJson),
    image: row.image || "/images/atacama-new.png",
    date: row.date,
    readTime: row.readTime,
  };
}

export type BlogArticleInput = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  image: string;
  date: string;
  readTime: number;
  active: boolean;
};

export function inputToDbData(input: BlogArticleInput, existing?: BlogArticleRow) {
  const mergeField = (existingJson: string | undefined, es: string): BlogLocaleFields => {
    const prev = existingJson ? parseLocaleJson(existingJson) : localeFromSpanish("");
    return { ...prev, es: es.trim() };
  };

  return {
    slug: input.slug.trim(),
    titleJson: JSON.stringify(mergeField(existing?.titleJson, input.title)),
    excerptJson: JSON.stringify(mergeField(existing?.excerptJson, input.excerpt)),
    contentJson: JSON.stringify(mergeField(existing?.contentJson, input.content)),
    categoryJson: JSON.stringify(mergeField(existing?.categoryJson, input.category)),
    image: input.image.trim() || "/images/atacama-new.png",
    date: input.date,
    readTime: input.readTime || estimateReadTime(input.content),
    active: input.active !== false,
  };
}

export function adminRowToForm(row: BlogArticleRow) {
  const title = parseLocaleJson(row.titleJson);
  const excerpt = parseLocaleJson(row.excerptJson);
  const content = parseLocaleJson(row.contentJson);
  const category = parseLocaleJson(row.categoryJson);
  return {
    id: row.id,
    slug: row.slug,
    title: title.es,
    excerpt: excerpt.es,
    content: content.es,
    category: category.es,
    image: row.image,
    date: row.date,
    readTime: row.readTime,
    active: row.active,
  };
}
