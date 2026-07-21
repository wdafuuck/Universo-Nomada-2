import { GOOGLE_REVIEWS_URL, googleReviews } from "@/lib/google-reviews";
import { absoluteUrl, SITE_URL } from "@/lib/site-url";

/** Schema AggregateRating + reseñas verificadas de Google Maps */
export function ReviewsJsonLd() {
  const rating = 5;
  const reviewCount = 28;

  const data = {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    "@id": `${SITE_URL}/#organization`,
    name: "Universo Nómada®",
    url: SITE_URL,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: rating,
      bestRating: 5,
      worstRating: 1,
      ratingCount: reviewCount,
      reviewCount,
    },
    review: googleReviews.slice(0, 5).map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.name },
      reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
      reviewBody: r.text.replace(/\n/g, " ").slice(0, 500),
      ...(r.authorUrl ? { url: r.authorUrl } : {}),
    })),
    sameAs: [GOOGLE_REVIEWS_URL, absoluteUrl("/#testimonios")],
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
