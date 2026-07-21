import type { DefaultTour } from "@/lib/default-tours";
import { absoluteUrl, SITE_URL } from "@/lib/site-url";

type Props = { tour: DefaultTour };

export function ProductJsonLd({ tour }: Props) {
  const url = absoluteUrl(`/detalle-paquete/${tour.tourId}`);

  const data = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: tour.name,
    description: tour.description,
    image: [absoluteUrl(tour.image)],
    url,
    touristType: "Leisure",
    provider: { "@id": `${SITE_URL}/#organization` },
    itinerary: {
      "@type": "ItemList",
      name: tour.subtitle,
    },
    offers: {
      "@type": "Offer",
      price: tour.price,
      priceCurrency: "CLP",
      availability: "https://schema.org/InStock",
      url,
      seller: { "@id": `${SITE_URL}/#organization` },
      validFrom: new Date().toISOString().slice(0, 10),
      ...(tour.originalPrice && tour.originalPrice > tour.price
        ? {
            priceValidUntil: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
          }
        : {}),
    },
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
