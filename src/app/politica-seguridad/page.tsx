import type { Metadata } from "next";
import { LegalPolicyPage } from "@/components/LegalPolicyPage";
import { SECURITY_POLICY } from "@/lib/legal-policies";
import { pageMetadata } from "@/lib/seo-metadata";

export const metadata: Metadata = pageMetadata({
  path: "/politica-seguridad",
  title: "Política de Seguridad | Universo Nómada®",
  description:
    "Medidas de seguridad de la información, protección de datos, pagos y respuesta a incidentes en Universo Nómada®.",
});

export default function PoliticaSeguridadPage() {
  return <LegalPolicyPage doc={SECURITY_POLICY} />;
}
