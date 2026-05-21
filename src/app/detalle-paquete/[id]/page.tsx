import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import DetalleContent from "./detalle-content";

type Params = Promise<{ id: string }>;

export async function generateStaticParams() {
  const destinations = await db.destination.findMany({
    where: { active: true },
    select: { id: true },
  });
  return destinations.map((d) => ({ id: d.id }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const destination = await db.destination.findUnique({ where: { id } });
  if (!destination || !destination.active) {
    return { title: "Paquete no encontrado · Universo Nomada" };
  }

  return {
    title: `${destination.name} · Universo Nomada`,
    description: destination.description.slice(0, 160),
    openGraph: {
      title: `${destination.name} · Universo Nomada`,
      description: destination.description.slice(0, 200),
      images: destination.image ? [{ url: destination.image }] : undefined,
      type: "article",
    },
  };
}

export default async function DetallePaquetePage({ params }: { params: Params }) {
  const { id } = await params;
  const destination = await db.destination.findUnique({ where: { id } });
  if (!destination || !destination.active) notFound();

  return <DetalleContent dbDestination={destination} />;
}
