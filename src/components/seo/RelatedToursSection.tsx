import Link from "next/link";
import { getRelatedTours } from "@/lib/related-tours";
import { UploadAwareImage } from "@/components/UploadAwareImage";

type Props = { tourId: string };

export async function RelatedToursSection({ tourId }: Props) {
  const related = await getRelatedTours(tourId, 4);
  if (related.length === 0) return null;

  return (
    <section
      aria-labelledby="related-tours-heading"
      className="border-t border-gray-800 bg-gray-900 py-12"
    >
      <div className="max-w-6xl mx-auto px-4">
        <h2 id="related-tours-heading" className="text-2xl font-bold text-white mb-6">
          También te puede interesar
        </h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 list-none p-0 m-0">
          {related.map((tour) => (
            <li key={tour.tourId}>
              <Link
                href={`/detalle-paquete/${tour.tourId}`}
                className="group block rounded-xl overflow-hidden border border-gray-700 hover:border-teal/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal"
              >
                <div className="relative h-36">
                  <UploadAwareImage
                    src={tour.image}
                    alt={tour.name}
                    fill
                    sizes="(max-width: 640px) 100vw, 280px"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-3">
                  <p className="font-bold text-white text-sm leading-tight">{tour.name}</p>
                  <p className="text-gray-400 text-xs mt-1">{tour.subtitle}</p>
                  <p className="text-teal text-sm font-semibold mt-2">
                    Desde ${tour.price.toLocaleString("es-CL")}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
