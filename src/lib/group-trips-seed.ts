import { db } from "@/lib/db";
import { GROUP_TRIPS } from "@/lib/group-trips";

export async function ensureGroupTripsSeeded() {
  const count = await db.groupTrip.count();
  if (count > 0) return;

  for (const [i, trip] of GROUP_TRIPS.entries()) {
    await db.groupTrip.create({
      data: {
        tourId: trip.tourId,
        name: trip.name,
        duration: trip.duration,
        image: trip.image,
        gradient: trip.gradient,
        reservation: trip.reservation,
        price: trip.price,
        includesJson: JSON.stringify(trip.includes),
        sortOrder: i,
        departures: {
          create: trip.departures.map((d) => ({
            date: d.date,
            availabilityStatus: d.availabilityStatus,
            spotsLeft: 0,
            totalSpots: 0,
          })),
        },
      },
    });
  }
}
