import type { Metadata } from "next";
import { LegalPolicyPage } from "@/components/LegalPolicyPage";
import { TERMS_CONDITIONS } from "@/lib/legal-policies";
import { pageMetadata } from "@/lib/seo-metadata";

export const metadata: Metadata = pageMetadata({
  path: "/terminos-condiciones",
  title: "Términos y Condiciones | Universo Nómada®",
  description:
    "Términos generales de uso del sitio, reservas, pagos y cuenta Nómada de Universo Nómada®.",
});

export default function TerminosCondicionesPage() {
  return <LegalPolicyPage doc={TERMS_CONDITIONS} />;
}
