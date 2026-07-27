import { SeasonalLandingPage } from "@/components/SeasonalLandingPage";
import { ProductJsonLd } from "@/components/seo/ProductJsonLd";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { DEFAULT_TOURS } from "@/lib/default-tours";
import { getSeasonalLanding } from "@/lib/seasonal-landings";
import { pageMetadata } from "@/lib/seo-metadata";

const landing = getSeasonalLanding("atacama-grupal")!;
const tour = DEFAULT_TOURS.find((t) => t.tourId === landing.tourId);

export const metadata = pageMetadata({
  path: "/viajes/atacama-grupal",
  title: `${landing.title} | Universo Nómada®`,
  description: landing.description,
  image: landing.image,
  keywords: ["viaje grupal atacama", "san pedro de atacama", "viajes a atacama", "viajes chile"],
});

export default function AtacamaGrupalPage() {
  return (
    <>
      {tour ? <ProductJsonLd tour={tour} /> : null}
      <BreadcrumbJsonLd
        items={[
          { name: "Inicio", path: "/" },
          { name: "Viajes", path: "/viajes" },
          { name: "Atacama", path: "/viajes/atacama" },
          { name: landing.title, path: "/viajes/atacama-grupal" },
        ]}
      />
      <SeasonalLandingPage landing={landing} />
    </>
  );
}
