import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { normalizeEmail } from "@/lib/normalize-email";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import {
  pickRandomRouletteOutcome,
  rouletteExpiresAt,
  roulettePrizeLabel,
  roulettePurchaseTimeLabel,
  type RoulettePrizeId,
} from "@/lib/roulette";

export async function POST(request: NextRequest) {
  try {
    if (!rateLimit(`roulette:${clientIp(request)}`, 5, 60_000)) {
      return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429 });
    }

    const body = await request.json();
    const nombre = String(body.nombre ?? "").trim();
    const email = normalizeEmail(String(body.email ?? ""));
    const telefono = String(body.telefono ?? "").trim();

    if (!nombre || !email || !telefono) {
      return NextResponse.json({ error: "Completa nombre, email y teléfono" }, { status: 400 });
    }

    const existing = await db.rouletteSpin.findUnique({ where: { email } });
    if (existing) {
      if (!existing.redeemed && existing.expiresAt.getTime() > Date.now()) {
        const segmentIndex = [0, 1, 2, 3, 4, 5, 6, 7].find((i) => {
          const prizes: RoulettePrizeId[] = [
            "discount_5", "kit_viajero", "tour_regalo", "discount_50000",
            "regalo_sorpresa", "discount_7", "no_luck", "no_luck",
          ];
          return prizes[i] === existing.prize;
        }) ?? 0;
        return NextResponse.json({
          ok: true,
          alreadySpun: true,
          spinId: existing.id,
          prize: existing.prize,
          prizeLabel: roulettePrizeLabel(existing.prize as RoulettePrizeId),
          expiresAt: existing.expiresAt.toISOString(),
          segmentIndex,
          nombre: existing.nombre,
          telefono: existing.telefono,
        });
      }
      return NextResponse.json(
        { error: "Ya participaste en la ruleta con este correo" },
        { status: 409 },
      );
    }

    const { prize, segmentIndex } = pickRandomRouletteOutcome();
    const expiresAt = rouletteExpiresAt();

    const spin = await db.rouletteSpin.create({
      data: { nombre, email, telefono, prize, expiresAt },
    });

    void db.lead.create({
      data: {
        nombre,
        email,
        telefono,
        mensaje: `[FAMILIA NÓMADA · RULETA] Premio: ${roulettePrizeLabel(prize)} — válido ${roulettePurchaseTimeLabel()} para comprar`,
        source: "ruleta-familia",
        status: "nuevo",
      },
    }).catch(() => {});

    return NextResponse.json({
      ok: true,
      spinId: spin.id,
      prize,
      prizeLabel: roulettePrizeLabel(prize),
      expiresAt: expiresAt.toISOString(),
      segmentIndex,
      nombre,
      telefono,
    });
  } catch (e) {
    console.error("[roulette/spin]", e);
    return NextResponse.json({ error: "Error al girar la ruleta" }, { status: 500 });
  }
}
