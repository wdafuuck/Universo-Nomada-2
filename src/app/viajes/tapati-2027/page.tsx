import { SeasonalLandingPage } from "@/components/SeasonalLandingPage";
import { getSeasonalLanding } from "@/lib/seasonal-landings";
import { pageMetadata } from "@/lib/seo-metadata";

const landing = getSeasonalLanding("tapati-2027")!;

export const metadata = pageMetadata({
  path: "/viajes/tapati-2027",
  title: `${landing.title} | Universo Nómada`,
  description: landing.description,
  image: landing.image,
});

export default function Tapati2027Page() {
  return <SeasonalLandingPage landing={landing} />;
}
