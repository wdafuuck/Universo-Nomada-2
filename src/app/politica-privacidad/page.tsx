import type { Metadata } from "next";
import { LegalPolicyPage } from "@/components/LegalPolicyPage";
import { PRIVACY_POLICY } from "@/lib/legal-policies";
import { pageMetadata } from "@/lib/seo-metadata";

export const metadata: Metadata = pageMetadata({
  path: "/politica-privacidad",
  title: "Política de Privacidad | Universo Nómada®",
  description:
    "Cómo Universo Nómada® recopila, usa y protege tus datos personales. Tus derechos según la ley chilena.",
});

export default function PoliticaPrivacidadPage() {
  return <LegalPolicyPage doc={PRIVACY_POLICY} />;
}
