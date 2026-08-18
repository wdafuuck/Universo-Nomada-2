import { tourToPublicContent } from "@/lib/tour-content";
import { resolveOfferPricing } from "@/lib/tour-pricing";
import { effectivePromoDiscountPercent } from "@/lib/promo-schedule";

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
  promoDiscountPercent?: number;
  promoStartsAt?: Date | string | null;
  promoEndsAt?: Date | string | null;
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
  const percent = effectivePromoDiscountPercent(tour);
  const offer = resolveOfferPricing(tour.price, tour.originalPrice, percent);
  const tag =
    percent > 0
      ? tour.tag
      : tour.tag.replace(/\s*\d{1,2}\s*%\s*OFF\s*/gi, " ").replace(/\s+/g, " ").trim();
  return {
    tourId: tour.tourId,
    name: tour.name,
    subtitle: tour.subtitle,
    description: tour.description,
    image: tour.image,
    tag,
    category: tour.category,
    price: offer.price,
    originalPrice: offer.originalPrice,
    duration: tour.duration,
    minDepositPerPerson: tour.minDepositPerPerson ?? 0,
    ...content,
  };
}
