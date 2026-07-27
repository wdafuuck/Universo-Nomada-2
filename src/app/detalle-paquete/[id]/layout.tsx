import type { Metadata } from "next";
import { DEFAULT_TOURS } from "@/lib/default-tours";
import { getHubForTourId } from "@/lib/destination-hubs";
import { ProductJsonLd } from "@/components/seo/ProductJsonLd";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { RelatedToursSection } from "@/components/seo/RelatedToursSection";
import { pageMetadata } from "@/lib/seo-metadata";
import { tourKeywords } from "@/lib/seo-config";

type Props = { params: Promise<{ id: string }>; children: React.ReactNode };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const tour = DEFAULT_TOURS.find((t) => t.tourId === id);

  if (!tour) {
    return pageMetadata({
      path: `/detalle-paquete/${id}`,
      title: "Paquete turístico | Universo Nómada®",
      description: "Paquete de viaje con Universo Nómada® — agencia boutique en Chile.",
    });
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
