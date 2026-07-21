import { db } from "@/lib/db";
import { ensureGroupTripsSeeded } from "@/lib/group-trips-seed";
import { isGroupTourId } from "@/lib/tour-pricing";

export { isGroupTourId };

export async function getActiveGroupTourIds(): Promise<Set<string>> {
  await ensureGroupTripsSeeded();
  const rows = await db.groupTrip.findMany({
    where: { active: true },
    select: { tourId: true },
  });
  return new Set(rows.map((r) => r.tourId));
}

export function filterToursByGroupVisibility<T extends { tourId: string }>(
  tours: T[],
  activeGroupIds: Set<string>,
): T[] {
  return tours.filter((t) => {
    if (!isGroupTourId(t.tourId)) return true;
    return activeGroupIds.has(t.tourId);
  });
}

export async function isGroupTourVisible(tourId: string): Promise<boolean> {
  if (!isGroupTourId(tourId)) return true;
  const active = await getActiveGroupTourIds();
  return active.has(tourId);
}
