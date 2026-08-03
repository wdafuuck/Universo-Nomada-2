import { pageMetadata } from "@/lib/seo-metadata";

export const metadata = pageMetadata({
  path: "/blog",
  title: "Blog de viajes | Universo Nómada",
  description:
    "Historias, guías y reflexiones sobre turismo experiencial en Chile y Sudamérica. Comunidades locales, naturaleza y viajes con propósito.",
  image: "/images/experiencia_andes.webp",
});

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
