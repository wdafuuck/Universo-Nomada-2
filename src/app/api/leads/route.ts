import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { nombre, email, telefono, destino, mensaje } = body;

    if (!nombre || !email || !telefono) {
      return NextResponse.json(
        { error: "Nombre, email y teléfono son obligatorios" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "El email no es válido" },
        { status: 400 }
      );
    }

    const lead = await db.lead.create({
      data: {
        nombre,
        email,
        telefono,
        destino: destino || null,
        mensaje: mensaje || null,
      },
    });

    return NextResponse.json(
      { message: "Cotización solicitada exitosamente", lead },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}
