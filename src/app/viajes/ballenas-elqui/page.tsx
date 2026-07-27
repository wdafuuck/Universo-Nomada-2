import { SeasonalLandingPage } from "@/components/SeasonalLandingPage";
import { ProductJsonLd } from "@/components/seo/ProductJsonLd";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { DEFAULT_TOURS } from "@/lib/default-tours";
import { getSeasonalLanding } from "@/lib/seasonal-landings";
import { pageMetadata } from "@/lib/seo-metadata";

const landing = getSeasonalLanding("ballenas-elqui")!;
const tour = DEFAULT_TOURS.find((t) => t.tourId === landing.tourId);

export const metadata = pageMetadata({
  path: "/viajes/ballenas-elqui",
  title: `${landing.title} | Universo Nómada®`,
  description: landing.description,
  image: landing.image,
  keywords: ["ballenas elqui", "viaje valle del elqui", "astroturismo chile", "viajes chile"],
});

export default function BallenasElquiPage() {
  return (
    <>
      {tour ? <ProductJsonLd tour={tour} /> : null}
      <BreadcrumbJsonLd
        items={[
          { name: "Inicio", path: "/" },
          { name: "Viajes", path: "/viajes" },
          { name: "Valle del Elqui", path: "/viajes/valle-del-elqui" },
          { name: landing.title, path: "/viajes/ballenas-elqui" },
        ]}
      />
      <SeasonalLandingPage landing={landing} />
    </>
  );
}
