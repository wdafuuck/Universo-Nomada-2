import type { BlogPost } from "@/lib/blog-posts";
import { getBlogField } from "@/lib/blog-posts";
import { absoluteUrl } from "@/lib/site-url";

type Props = { post: BlogPost };

export function ArticleJsonLd({ post }: Props) {
  const title = getBlogField(post, "es", "title");
  const description = getBlogField(post, "es", "excerpt");
  const url = absoluteUrl(`/blog/${post.slug}`);

  const data = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    image: absoluteUrl(post.image),
    datePublished: post.date,
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

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
