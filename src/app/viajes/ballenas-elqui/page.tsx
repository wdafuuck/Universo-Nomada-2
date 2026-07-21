import { SeasonalLandingPage } from "@/components/SeasonalLandingPage";
import { getSeasonalLanding } from "@/lib/seasonal-landings";
import { pageMetadata } from "@/lib/seo-metadata";

const landing = getSeasonalLanding("ballenas-elqui")!;

export const metadata = pageMetadata({
  path: "/viajes/ballenas-elqui",
  title: `${landing.title} | Universo Nómada`,
  description: landing.description,
  image: landing.image,
});

export default function BallenasElquiPage() {
  return <SeasonalLandingPage landing={landing} />;
}
