import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { normalizeEmail } from "@/lib/normalize-email";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import {
  pickRandomRouletteOutcome,
  rouletteExpiresAt,
  roulettePrizeLabel,
  roulettePurchaseTimeLabel,
  segmentIndexForPrize,
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
      const active = !existing.redeemed && existing.expiresAt.getTime() > Date.now();
      const msg = "Ya estás registrado";
      const segmentIndex = segmentIndexForPrize(existing.prize as RoulettePrizeId);

      return NextResponse.json(
        {
          ok: false,
          alreadyRegistered: true,
          alreadySpun: active,
          error: msg,
          message: msg,
          ...(active
            ? {
                spinId: existing.id,
                prize: existing.prize,
                prizeLabel: roulettePrizeLabel(existing.prize as RoulettePrizeId),
                expiresAt: existing.expiresAt.toISOString(),
                segmentIndex,
                nombre: existing.nombre,
                telefono: existing.telefono,
              }
            : {}),
        },
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
    const code = (e as { code?: string })?.code;
    if (code === "P2002") {
      return NextResponse.json(
        {
          error: "Ya estás registrado",
          alreadyRegistered: true,
        },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "Error al girar la ruleta" }, { status: 500 });
  }
}
