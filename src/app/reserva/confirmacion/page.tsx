"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { ReservationConfirmationView } from "@/components/ReservationConfirmationView";
import type { ReservationConfirmation } from "@/lib/reservation-confirmation";

const STORAGE_KEY = "un-last-reservation";

function ConfirmacionContent() {
  const searchParams = useSearchParams();
  const reservaId = searchParams.get("reserva");
  const [data, setData] = useState<ReservationConfirmation | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ReservationConfirmation;
        if (!reservaId || parsed.leadId === reservaId) {
          setData(parsed);
          sessionStorage.removeItem(STORAGE_KEY);
          return;
        }
      } catch {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }

    if (!reservaId) {
      setError("No encontramos los datos de tu reserva.");
      return;
    }

    fetch(`/api/reservations/${encodeURIComponent(reservaId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.confirmation) setData(d.confirmation);
        else setError(d.error ?? "Reserva no encontrada");
      })
      .catch(() => setError("Error al cargar la confirmación"));
  }, [reservaId]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-slate-600 mb-4">{error}</p>
          <a href="/" className="text-teal font-semibold hover:underline">Volver al inicio</a>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal" />
      </div>
    );
  }

  return <ReservationConfirmationView data={data} />;
}

export default function ConfirmacionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal" />
      </div>
    }>
      <ConfirmacionContent />
    </Suspense>
  );
}
