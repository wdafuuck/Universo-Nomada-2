import { db } from "@/lib/db";
import LandingPage from "./landing-page";

// Read fresh on every request — the admin updates destinos/promos and we
// already revalidatePath('/') on save, but this guarantees no stale snapshot
// during development.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [destinations, promotions] = await Promise.all([
    db.destination.findMany({
      where: { active: true },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    }),
    db.promotion.findMany({
      where: { active: true },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    }),
  ]);

  return <LandingPage destinations={destinations} promotions={promotions} />;
}
