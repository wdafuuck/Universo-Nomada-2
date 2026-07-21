import { MemberAccountView } from "@/components/MemberAccountView";
import { pageMetadata } from "@/lib/seo-metadata";

export const metadata = pageMetadata({
  path: "/mi-cuenta",
  title: "Mi cuenta | Universo Nómada",
  description: "Tus viajes, beneficios exclusivos y pasaporte nómada.",
  noindex: true,
});

export default function MiCuentaPage() {
  return <MemberAccountView />;
}
