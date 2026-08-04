import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { DEFAULT_TOURS } from "@/lib/default-tours";
import { getHubForTourId } from "@/lib/destination-hubs";
import { ProductJsonLd } from "@/components/seo/ProductJsonLd";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { RelatedToursSection } from "@/components/seo/RelatedToursSection";
import { pageMetadata } from "@/lib/seo-metadata";
import { tourKeywords } from "@/lib/seo-config";

type Props = { params: Promise<{ id: string }>; children: React.ReactNode };

async function tourExists(id: string): Promise<boolean> {
  try {
    const row = await db.tour.findUnique({
      where: { tourId: id },
      select: { active: true },
    });
    if (row) return row.active;
    return false;
  } catch {
    return DEFAULT_TOURS.some((t) => t.tourId === id);
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const tour = DEFAULT_TOURS.find((t) => t.tourId === id);

  if (!tour || !(await tourExists(id))) {
    return {
      title: "Paquete no encontrado | Universo Nómada®",
      robots: { index: false, follow: false },
    };
  }

  const desde = tour.price.toLocaleString("es-CL");

  return pageMetadata({
    path: `/detalle-paquete/${id}`,
    title: `${tour.name} desde $${desde} | Universo Nómada®`,
    description: `${tour.description} ${tour.subtitle}. Reserva con asesoría personalizada. Paquete desde $${desde} CLP por persona.`,
    image: tour.image,
    keywords: tourKeywords(id, tour.name),
  });
}

export default async function DetallePaqueteLayout({ children, params }: Props) {
  const { id } = await params;
  if (!(await tourExists(id))) notFound();

  const tour = DEFAULT_TOURS.find((t) => t.tourId === id);
  const hub = getHubForTourId(id);

  const crumbs = [
    { name: "Inicio", path: "/" },
    { name: "Viajes", path: "/viajes" },
    ...(hub
      ? [{ name: hub.title, path: `/viajes/${hub.slug}` }]
      : [{ name: "Destinos", path: "/#destinos" }]),
    ...(tour ? [{ name: tour.name, path: `/detalle-paquete/${id}` }] : []),
  ];

  return (
    <>
      {tour ? <ProductJsonLd tour={tour} /> : null}
      <BreadcrumbJsonLd items={crumbs} />
      {children}
      {tour ? <RelatedToursSection tourId={id} /> : null}
    </>
  );
}
