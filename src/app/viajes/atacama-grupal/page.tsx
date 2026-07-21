import { SeasonalLandingPage } from "@/components/SeasonalLandingPage";
import { getSeasonalLanding } from "@/lib/seasonal-landings";
import { pageMetadata } from "@/lib/seo-metadata";

const landing = getSeasonalLanding("atacama-grupal")!;

export const metadata = pageMetadata({
  path: "/viajes/atacama-grupal",
  title: `${landing.title} | Universo Nómada`,
  description: landing.description,
  image: landing.image,
});

export default function AtacamaGrupalPage() {
  return <SeasonalLandingPage landing={landing} />;
}
