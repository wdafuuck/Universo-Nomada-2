import type { DestinationHub } from "@/lib/destination-hubs";
import { absoluteUrl, SITE_URL } from "@/lib/site-url";

type Props = {
  hub: DestinationHub;
  priceFrom?: number;
};

/** TouristDestination + ItemList de paquetes para hubs /viajes/[slug]. */
export function DestinationHubJsonLd({ hub, priceFrom }: Props) {
  const url = absoluteUrl(`/viajes/${hub.slug}`);
  const data = {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    name: hub.title,
    description: hub.description,
    image: absoluteUrl(hub.image),
    url,
    touristType: "Leisure",
    provider: { "@id": `${SITE_URL}/#organization` },
    ...(priceFrom
      ? {
          offers: {
            "@type": "AggregateOffer",
            priceCurrency: "CLP",
            lowPrice: priceFrom,
            offerCount: hub.tourIds.length,
            url,
          },
        }
      : {}),
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}

type FaqProps = {
  faqs: { question: string; answer: string }[];
};

export function FaqPageJsonLd({ faqs }: FaqProps) {
  if (!faqs.length) return null;
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
