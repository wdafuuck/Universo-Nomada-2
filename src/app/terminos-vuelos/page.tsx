import type { Metadata } from "next";
import { LegalPolicyPage } from "@/components/LegalPolicyPage";
import { FLIGHT_TERMS } from "@/lib/legal-policies";

export const metadata: Metadata = {
  title: "Términos y Condiciones sobre Vuelos | Universo Nómada®",
  description:
    "Condiciones para la compra e intermediación de pasajes aéreos a través de Universo Nómada.",
};

export default function TerminosVuelosPage() {
  return <LegalPolicyPage doc={FLIGHT_TERMS} />;
}
