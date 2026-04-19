import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const promotions = await db.promotion.findMany({
      where: { active: true },
      orderBy: { createdAt: "desc" },
    });

    // If no promotions in DB, seed defaults
    if (promotions.length === 0) {
      const defaults = [
        { title: "Semana Santa", subtitle: "Rapa Nui", discount: "20% OFF", destination: "Rapa Nui", validUntil: "2026-04-30", originalPrice: 890000, discountPrice: 712000, emoji: "🐣" },
        { title: "Verano Chile", subtitle: "Atacama + Uyuni", discount: "15% OFF", destination: "Atacama", validUntil: "2026-03-31", originalPrice: 650000, discountPrice: 552500, emoji: "☀️" },
        { title: "Parejas", subtitle: "Cusco + Machu Picchu", discount: "2x1", destination: "Cusco", validUntil: "2026-06-30", originalPrice: 1200000, discountPrice: 600000, emoji: "💕" },
        { title: "Temporada Ballenas", subtitle: "Ballenas + Elqui", discount: "25% OFF", destination: "Ballenas", validUntil: "2026-09-30", originalPrice: 450000, discountPrice: 337500, emoji: "🐋" },
        { title: "Aventura Amazonas", subtitle: "Bolivia Amazonica", discount: "10% OFF", destination: "Bolivia", validUntil: "2026-07-31", originalPrice: 980000, discountPrice: 882000, emoji: "🌿" },
        { title: "Patagonia Extrema", subtitle: "Catedrales + Carretera", discount: "20% OFF", destination: "Patagonia", validUntil: "2026-12-31", originalPrice: 1500000, discountPrice: 1200000, emoji: "🏔️" },
      ];

      for (const p of defaults) {
        await db.promotion.create({ data: p });
      }

      const seeded = await db.promotion.findMany({
        where: { active: true },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ promotions: seeded });
    }

    return NextResponse.json({ promotions });
  } catch {
    return NextResponse.json(
      { error: "Error al obtener promociones" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, subtitle, discount, destination, validUntil, originalPrice, discountPrice, emoji } = body;

    if (!title || !discount || !destination) {
      return NextResponse.json(
        { error: "Título, descuento y destino son obligatorios" },
        { status: 400 }
      );
    }

    const promotion = await db.promotion.create({
      data: {
        title,
        subtitle: subtitle || "",
        discount,
        destination,
        validUntil: validUntil || "",
        originalPrice: originalPrice || 0,
        discountPrice: discountPrice || 0,
        emoji: emoji || "🔥",
      },
    });

    return NextResponse.json({ promotion }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Error al crear promoción" },
      { status: 500 }
    );
  }
}
