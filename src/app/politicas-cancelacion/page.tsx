import type { Metadata } from "next";
import { LegalPolicyPage } from "@/components/LegalPolicyPage";
import { CANCELLATION_POLICIES } from "@/lib/legal-policies";
import { pageMetadata } from "@/lib/seo-metadata";

export const metadata: Metadata = pageMetadata({
  path: "/politicas-cancelacion",
  title: "Políticas de Cancelación | Universo Nómada®",
  description:
    "Políticas de cancelación, cambios y no-show para tours y experiencias reservadas con Universo Nómada®.",
});

export default function PoliticasCancelacionPage() {
  return <LegalPolicyPage doc={CANCELLATION_POLICIES} />;
}
