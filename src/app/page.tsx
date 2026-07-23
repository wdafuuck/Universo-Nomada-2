import HomePageClient from "@/components/HomePageClient";
import { getLandingInitialData } from "@/lib/landing-data-server";

/** Revalidar home cada 30s para reflejar cambios del admin sin redeploy. */
export const revalidate = 30;

export default async function Page() {
  const { heroImages, tours, promotions } = await getLandingInitialData();
  const firstHero = heroImages[0];

  return (
    <>
      {firstHero ? (
        <link rel="preload" as="image" href={firstHero} fetchPriority="high" />
      ) : null}
      <HomePageClient
        initialHeroImages={heroImages}
        initialTours={tours}
        initialPromotions={promotions}
      />
    </>
  );
}
