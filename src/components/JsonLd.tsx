import { FAQ_SCHEMA_ITEMS } from "@/lib/faq-schema";
import { DEFAULT_TOURS } from "@/lib/default-tours";
import { GOOGLE_REVIEWS_URL } from "@/lib/google-reviews";
import { absoluteUrl, SITE_URL } from "@/lib/site-url";

export function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["TravelAgency", "LocalBusiness"],
        "@id": `${SITE_URL}/#organization`,
        name: "Universo Nómada®",
        url: SITE_URL,
        logo: absoluteUrl("/images/logo-un.png"),
        image: absoluteUrl("/images/logo-un.png"),
        description:
          "Agencia de viajes boutique especializada en experiencias personalizadas y auténticas en Chile y Sudamérica. Rapa Nui, Atacama, Machu Picchu, Patagonia y más.",
        telephone: "+56974636396",
        email: "contacto@universonomada.cl",
        priceRange: "$$$",
        currenciesAccepted: "CLP",
        paymentAccepted: "Cash, Credit Card, Bank Transfer",
        address: {
          "@type": "PostalAddress",
          streetAddress: "Calle Reñaca Norte 265",
          addressLocality: "Viña del Mar",
          addressRegion: "Valparaíso",
          postalCode: "2520000",
          addressCountry: "CL",
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: -33.0246,
          longitude: -71.5518,
        },
        openingHoursSpecification: {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          opens: "09:00",
          closes: "18:00",
        },
        areaServed: [
          { "@type": "Country", name: "Chile" },
          { "@type": "Country", name: "Peru" },
          { "@type": "Country", name: "Argentina" },
          { "@type": "Country", name: "Brazil" },
          { "@type": "Country", name: "Bolivia" },
        ],
        sameAs: [
          "https://www.instagram.com/universo.nomadaa",
          "https://www.tiktok.com/@universo.nomadaa",
          "https://web.facebook.com/profile.php?id=61560104283524",
          "https://serviciosturisticos.sernatur.cl/63063-universo-nomada",
          GOOGLE_REVIEWS_URL,
        ],
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Paquetes turísticos Universo Nómada",
          itemListElement: DEFAULT_TOURS.slice(0, 12).map((tour, i) => ({
            "@type": "Offer",
            position: i + 1,
            itemOffered: {
              "@type": "TouristTrip",
              name: tour.name,
              description: tour.description,
              url: absoluteUrl(`/detalle-paquete/${tour.tourId}`),
            },
          })),
        },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "Universo Nómada®",
        inLanguage: ["es-CL", "en", "pt-BR", "fr", "zh-CN"],
        publisher: { "@id": `${SITE_URL}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${SITE_URL}/#destinos?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/#faq`,
        mainEntity: FAQ_SCHEMA_ITEMS.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
