import HomePageClient from "@/components/HomePageClient";
import { getLandingInitialData } from "@/lib/landing-data-server";

/** Revalidar home cada 30s para reflejar cambios del admin sin redeploy. */
export const revalidate = 30;

export default async function Page() {
  const { heroImages, tours, promotions } = await getLandingInitialData();
  const firstHero = heroImages[0];
  const preloadHref =
    firstHero && (firstHero.startsWith("/uploads/") || firstHero.startsWith("/images/"))
      ? `/api/img?src=${encodeURIComponent(firstHero)}&w=828&q=62`
      : firstHero;

  return (
    <>
      {preloadHref ? (
        <link rel="preload" as="image" href={preloadHref} fetchPriority="high" type="image/webp" />
      ) : null}
      <HomePageClient
        initialHeroImages={heroImages}
        initialTours={tours}
        initialPromotions={promotions}
      />
    </>
  );
}
