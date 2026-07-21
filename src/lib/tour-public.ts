import { tourToPublicContent } from "@/lib/tour-content";

type DbTour = {
  tourId: string;
  name: string;
  subtitle: string;
  description: string;
  image: string;
  tag: string;
  category: string;
  price: number;
  originalPrice: number | null;
  duration: string;
  includesText?: string;
  excludesText?: string;
  highlightsText?: string;
  pdfUrl?: string;
  galleryJson?: string;
  faqJson?: string;
  optionalToursJson?: string;
  flightBudgetMax?: number | null;
  minDepositPerPerson?: number;
  active?: boolean;
  sortOrder?: number;
};

export function toPublicTour(tour: DbTour) {
  const content = tourToPublicContent(tour);
  return {
    tourId: tour.tourId,
    name: tour.name,
    subtitle: tour.subtitle,
    description: tour.description,
    image: tour.image,
    tag: tour.tag,
    category: tour.category,
    price: tour.price,
    originalPrice: tour.originalPrice,
    duration: tour.duration,
    minDepositPerPerson: tour.minDepositPerPerson ?? 0,
    ...content,
  };
}
