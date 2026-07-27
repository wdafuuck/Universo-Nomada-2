import { SeasonalLandingPage } from "@/components/SeasonalLandingPage";
import { ProductJsonLd } from "@/components/seo/ProductJsonLd";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { DEFAULT_TOURS } from "@/lib/default-tours";
import { getSeasonalLanding } from "@/lib/seasonal-landings";
import { pageMetadata } from "@/lib/seo-metadata";

const landing = getSeasonalLanding("tapati-2027")!;
const tour = DEFAULT_TOURS.find((t) => t.tourId === landing.tourId);

export const metadata = pageMetadata({
  path: "/viajes/tapati-2027",
  title: `${landing.title} | Universo Nómada®`,
  description: landing.description,
  image: landing.image,
  keywords: ["Tapati Rapa Nui 2027", "viaje isla de pascua", "viajes a rapa nui", "viajes chile"],
});

export default function Tapati2027Page() {
  return (
    <>
      {tour ? <ProductJsonLd tour={tour} /> : null}
      <BreadcrumbJsonLd
        items={[
          { name: "Inicio", path: "/" },
          { name: "Viajes", path: "/viajes" },
          { name: "Rapa Nui", path: "/viajes/rapa-nui" },
          { name: landing.title, path: "/viajes/tapati-2027" },
        ]}
      />
      <SeasonalLandingPage landing={landing} />
    </>
  );
}
