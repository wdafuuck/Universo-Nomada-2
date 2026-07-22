"use client";

import { useState } from "react";
import { Heart, Mail, Phone, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ROULETTE_PURCHASE_HOURS,
  type RoulettePrizeId,
} from "@/lib/roulette-shared";
import { saveStoredRoulettePrize } from "@/lib/roulette-client";

/**
 * Ruleta en página propia (liviana).
 * El modal en el home crasheaba Safari/Chrome al enviar el formulario.
 */
export default function RuletaPage() {
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.email.trim() || !form.telefono.trim()) {
      toast.error("Completa todos los campos");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/roulette/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          email: form.email.trim(),
          telefono: form.telefono.trim(),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        spinId?: number;
        prize?: RoulettePrizeId;
        prizeLabel?: string;
        expiresAt?: string;
        segmentIndex?: number;
      };
      if (!res.ok || !data.prize || !data.spinId) {
        toast.error(data.error ?? "No se pudo girar la ruleta");
        setSubmitting(false);
        return;
      }

      try {
        saveStoredRoulettePrize(
          {
            spinId: data.spinId,
            prize: data.prize,
            email: form.email.trim(),
            nombre: form.nombre.trim(),
            telefono: form.telefono.trim(),
            expiresAt: data.expiresAt ?? new Date().toISOString(),
            segmentIndex: data.segmentIndex ?? 0,
          },
          { silent: true },
        );
        sessionStorage.setItem(
          "un_roulette_result",
          JSON.stringify({
            spinId: data.spinId,
            prize: data.prize,
            prizeLabel: data.prizeLabel ?? "",
            expiresAt: data.expiresAt,
          }),
        );
      } catch {
        // ignore storage errors
      }

      // Navegación completa: sale del home pesado (evita crash del renderer)
      window.location.assign(
        `/ruleta/premio?spinId=${encodeURIComponent(String(data.spinId))}&email=${encodeURIComponent(form.email.trim())}`,
      );
    } catch {
      toast.error("Error de conexión. Intenta de nuevo.");
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-gradient-to-br from-[#0D1B2A] via-teal to-amber-600 text-white px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <a href="/" className="text-white/80 text-sm underline underline-offset-2">
          ← Volver al inicio
        </a>

        <div className="mt-8 rounded-3xl bg-black/25 p-6 shadow-xl backdrop-blur-0">
          <div className="flex items-start gap-2 mb-3">
            <Heart className="h-6 w-6 text-pink-200 shrink-0 mt-0.5" />
            <h1 className="text-2xl font-black leading-tight">
              Únete a la familia Nómada
            </h1>
          </div>
          <p className="text-white/90 text-sm mb-6 leading-relaxed">
            Completa tus datos y descubre tu premio. Tienes {ROULETTE_PURCHASE_HOURS} horas
            para usarlo al reservar.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3" noValidate>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Tu nombre"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="rounded-full h-12 pl-10 bg-white border-0 text-slate-900"
                required
                autoComplete="name"
              />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="rounded-full h-12 pl-10 bg-white border-0 text-slate-900"
                required
                autoComplete="email"
              />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="tel"
                placeholder="+56 9 ..."
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                className="rounded-full h-12 pl-10 bg-white border-0 text-slate-900"
                required
                autoComplete="tel"
              />
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#0f172a] hover:bg-black text-white font-bold rounded-full h-12 mt-2"
            >
              {submitting ? "Revelando premio…" : "Girar la ruleta"}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
