import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getDestinationHub,
  listDestinationHubSlugs,
} from "@/lib/destination-hubs";
import { DEFAULT_TOURS } from "@/lib/default-tours";
import { DestinationHubPage } from "@/components/DestinationHubPage";
import { DestinationHubJsonLd, FaqPageJsonLd } from "@/components/seo/DestinationHubJsonLd";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { pageMetadata } from "@/lib/seo-metadata";
import { getRelatedBlogPostsForHub } from "@/lib/related-blog-posts";
import { getBlogField } from "@/lib/blog-posts";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return listDestinationHubSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const hub = getDestinationHub(slug);
  if (!hub) {
    return { title: "Destino | Universo Nómada®" };
  }
  const desc =
    hub.description.length > 140
      ? hub.description
      : `${hub.description} Cotiza paquetes con Universo Nómada®.`;
  return pageMetadata({
    path: `/viajes/${hub.slug}`,
    title: `${hub.title}: paquetes y guías | Universo Nómada®`,
    description: desc.slice(0, 160),
    image: hub.image,
    keywords: hub.keywords,
  });
}

export default async function DestinationHubRoute({ params }: Props) {
  const { slug } = await params;
  const hub = getDestinationHub(slug);
  if (!hub) notFound();

  const tours = hub.tourIds
    .map((id) => DEFAULT_TOURS.find((t) => t.tourId === id))
    .filter(Boolean);
  const priceFrom = tours.length ? Math.min(...tours.map((t) => t!.price)) : undefined;
  const relatedRaw = await getRelatedBlogPostsForHub(hub, 4);
  const relatedBlogs = relatedRaw.map((p) => ({
    slug: p.slug,
    title: getBlogField(p, "es", "title"),
    excerpt: getBlogField(p, "es", "excerpt"),
    image: p.image,
  }));

  return (
    <>
      <DestinationHubJsonLd hub={hub} priceFrom={priceFrom} />
      {hub.faqs?.length ? <FaqPageJsonLd faqs={hub.faqs} /> : null}
      <BreadcrumbJsonLd
        items={[
          { name: "Inicio", path: "/" },
          { name: "Viajes", path: "/viajes" },
          { name: hub.title, path: `/viajes/${hub.slug}` },
        ]}
      />
      <DestinationHubPage hub={hub} relatedBlogs={relatedBlogs} />
    </>
  );
}

/** Solo hubs conocidos; landings estacionales usan rutas estáticas propias. */
export const dynamicParams = false;
