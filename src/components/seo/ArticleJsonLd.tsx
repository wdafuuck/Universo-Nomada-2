import type { BlogPost } from "@/lib/blog-posts";
import { getBlogField } from "@/lib/blog-posts";
import { cleanBlogTitle } from "@/lib/related-blog-posts";
import { absoluteUrl } from "@/lib/site-url";

type RelatedSummary = { slug: string; title: string };

type Props = { post: BlogPost; relatedPosts?: RelatedSummary[] };

export function ArticleJsonLd({ post, relatedPosts = [] }: Props) {
  const title = cleanBlogTitle(getBlogField(post, "es", "title"));
  const description = getBlogField(post, "es", "excerpt");
  const url = absoluteUrl(`/blog/${post.slug}`);

  const article = {
    "@type": "Article",
    headline: title,
    description,
    image: absoluteUrl(post.image),
    datePublished: post.date,
    dateModified: post.date,
    author: {
      "@type": "Organization",
      name: "Universo Nómada®",
      url: absoluteUrl("/"),
    },
    publisher: {
      "@type": "Organization",
      name: "Universo Nómada®",
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/images/logo-un.png"),
      },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
  };

  const graph: Record<string, unknown>[] = [article];

  if (relatedPosts.length > 0) {
    graph.push({
      "@type": "ItemList",
      name: "Artículos relacionados",
      itemListElement: relatedPosts.map((r, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: absoluteUrl(`/blog/${r.slug}`),
        name: r.title,
      })),
    });
  }

  const data = {
    "@context": "https://schema.org",
    "@graph": graph,
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
