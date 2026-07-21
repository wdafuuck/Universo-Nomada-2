import { pageMetadata } from "@/lib/seo-metadata";

export const metadata = pageMetadata({
  path: "/reserva/confirmacion",
  title: "Confirmación de reserva | Universo Nómada",
  description: "Detalle de tu reserva con Universo Nómada.",
  noindex: true,
});

export default function ConfirmacionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
