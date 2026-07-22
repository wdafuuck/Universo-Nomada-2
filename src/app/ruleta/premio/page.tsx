import { Suspense } from "react";
import RuletaPremioClient from "./PremioClient";

export default function RuletaPremioPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[100dvh] grid place-items-center bg-[#0D1B2A] text-white">
          Cargando…
        </main>
      }
    >
      <RuletaPremioClient />
    </Suspense>
  );
}
