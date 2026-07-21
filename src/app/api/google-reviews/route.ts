import { NextResponse } from "next/server";
import {
  googleReviews as fallbackReviews,
  GOOGLE_PLACE_QUERY,
  reviewsPublicUrl,
} from "@/lib/google-reviews";
import type { GoogleReview, GoogleReviewsPayload } from "@/lib/google-reviews";

export const revalidate = 3600;

const API_KEY = process.env.GOOGLE_PLACES_API_KEY ?? "";
const REVIEWS_URL = reviewsPublicUrl();

function googleLanguageCode(lang?: string | null): string {
  switch (lang) {
    case "en":
      return "en";
    case "fr":
      return "fr";
    case "zh":
      return "zh-CN";
    case "pt":
      return "pt-BR";
    default:
      return "es";
  }
}

type PlacesReview = {
  name?: string;
  relativePublishTimeDescription?: string;
  rating?: number;
  text?: { text?: string };
  authorAttribution?: {
    displayName?: string;
    uri?: string;
    photoUri?: string;
  };
  googleMapsUri?: string;
};

type PlacesPhoto = {
  name?: string;
};

type LegacyReview = {
  author_name?: string;
  profile_photo_url?: string;
  rating?: number;
  relative_time_description?: string;
  text?: string;
  author_url?: string;
  time?: number;
};

type LegacyPhoto = {
  photo_reference?: string;
};

type LegacyPlaceResult = {
  name?: string;
  rating?: number;
  user_ratings_total?: number;
  reviews?: LegacyReview[];
  photos?: LegacyPhoto[];
};

function normalizePlaceId(id: string): string {
  return id.replace(/^places\//, "");
}

async function resolvePlaceId(languageCode: string): Promise<string | null> {
  const configured = process.env.GOOGLE_PLACE_ID?.trim();
  if (configured) return configured;

  const query = process.env.GOOGLE_PLACE_QUERY?.trim() ?? GOOGLE_PLACE_QUERY;
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask": "places.id,places.displayName",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      textQuery: query,
      languageCode,
      regionCode: "CL",
    }),
    next: { revalidate: 86400 },
  });

  if (!res.ok) {
    console.error("Google Places searchText error:", res.status, await res.text());
    return null;
  }

  const data = await res.json();
  const first = data.places?.[0];
  if (!first?.id) return null;

  return normalizePlaceId(first.id);
}

async function resolvePhotoUrl(photoName: string): Promise<string | null> {
  if (!API_KEY || !photoName) return null;
  try {
    const url = new URL(`https://places.googleapis.com/v1/${photoName}/media`);
    url.searchParams.set("maxHeightPx", "600");
    url.searchParams.set("maxWidthPx", "800");
    url.searchParams.set("skipHttpRedirect", "true");
    const res = await fetch(url.toString(), {
      headers: { "X-Goog-Api-Key": API_KEY },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.photoUri === "string" ? data.photoUri : null;
  } catch {
    return null;
  }
}

function legacyPhotoUrl(photoReference: string): string {
  const url = new URL("https://maps.googleapis.com/maps/api/place/photo");
  url.searchParams.set("maxwidth", "800");
  url.searchParams.set("photo_reference", photoReference);
  url.searchParams.set("key", API_KEY);
  return url.toString();
}

function mapNewReviews(rawReviews: PlacesReview[]): GoogleReview[] {
  return rawReviews
    .filter((r) => r.text?.text && r.authorAttribution?.displayName)
    .map((r, i) => ({
      id: r.name ?? `review-${i}`,
      name: r.authorAttribution!.displayName!,
      photo: r.authorAttribution?.photoUri ?? "",
      rating: r.rating ?? 5,
      date: r.relativePublishTimeDescription ?? "",
      text: r.text?.text ?? "",
      authorUrl: r.authorAttribution?.uri,
      reviewUrl: r.googleMapsUri ?? REVIEWS_URL,
    }));
}

function mapLegacyReviews(rawReviews: LegacyReview[]): GoogleReview[] {
  return rawReviews
    .filter((r) => r.text?.trim() && r.author_name)
    .map((r, i) => ({
      id: `legacy-${r.time ?? i}`,
      name: r.author_name!,
      photo: r.profile_photo_url ?? "",
      rating: r.rating ?? 5,
      date: r.relative_time_description ?? "",
      text: r.text ?? "",
      authorUrl: r.author_url,
      reviewUrl: REVIEWS_URL,
    }));
}

async function fetchLegacyPlaceDetails(
  placeId: string,
  languageCode: string
): Promise<LegacyPlaceResult | null> {
  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "name,rating,user_ratings_total,reviews,photos");
  url.searchParams.set("language", languageCode);
  url.searchParams.set("key", API_KEY);

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
  const data = await res.json();

  if (data.status !== "OK" || !data.result) {
    if (data.status !== "OK") {
      console.warn("Legacy Places API:", data.status, data.error_message ?? "");
    }
    return null;
  }

  return data.result as LegacyPlaceResult;
}

function fallbackPayload(): GoogleReviewsPayload {
  return {
    reviews: fallbackReviews,
    placePhotos: [],
    rating: 5,
    totalReviews: 28,
    placeName: "Universo Nómada",
    googleMapsUrl: REVIEWS_URL,
    source: "fallback",
  };
}

async function fetchFromGoogle(languageCode: string): Promise<GoogleReviewsPayload | null> {
  if (!API_KEY) return null;

  const placeId = await resolvePlaceId(languageCode);
  if (!placeId) return null;

  const placeUrl = new URL(`https://places.googleapis.com/v1/places/${placeId}`);
  placeUrl.searchParams.set("languageCode", languageCode);

  const res = await fetch(placeUrl.toString(), {
    headers: {
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask":
        "rating,userRatingCount,reviews,photos,displayName,googleMapsLinks",
    },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    console.error("Google Places API error:", res.status, await res.text());
    return null;
  }

  const data = await res.json();
  let reviews = mapNewReviews((data.reviews ?? []) as PlacesReview[]);
  let placePhotos = (
    await Promise.all(
      ((data.photos ?? []) as PlacesPhoto[])
        .slice(0, 30)
        .map((p) => p.name)
        .filter(Boolean)
        .map((name) => resolvePhotoUrl(name as string))
    )
  ).filter((u): u is string => Boolean(u));

  if (reviews.length === 0) {
    const legacy = await fetchLegacyPlaceDetails(placeId, languageCode);
    if (legacy?.reviews?.length) {
      reviews = mapLegacyReviews(legacy.reviews);
    }
    if (placePhotos.length === 0 && legacy?.photos?.length) {
      placePhotos = legacy.photos
        .slice(0, 30)
        .map((p) => p.photo_reference)
        .filter(Boolean)
        .map((ref) => legacyPhotoUrl(ref as string));
    }
  }

  const gotGoogleReviews = reviews.length > 0;

  const toSameOriginPhoto = (uri: string) =>
    `/api/google-photo?u=${encodeURIComponent(uri)}`;

  return {
    reviews: (gotGoogleReviews ? reviews : fallbackReviews).map((r) => ({
      ...r,
      photo: r.photo ? toSameOriginPhoto(r.photo) : "",
    })),
    placePhotos: placePhotos.map(toSameOriginPhoto),
    rating: typeof data.rating === "number" ? data.rating : 5,
    totalReviews:
      typeof data.userRatingCount === "number" ? data.userRatingCount : reviews.length,
    placeName: data.displayName?.text ?? "Universo Nómada",
    googleMapsUrl: REVIEWS_URL,
    source: gotGoogleReviews ? "google" : "fallback",
  };
}

export async function GET(request: Request) {
  const lang = new URL(request.url).searchParams.get("lang");
  const languageCode = googleLanguageCode(lang);

  try {
    const live = await fetchFromGoogle(languageCode);
    if (live) {
      return NextResponse.json(live);
    }

    return NextResponse.json(fallbackPayload());
  } catch (error) {
    console.error("Google reviews fetch error:", error);
    return NextResponse.json(fallbackPayload());
  }
}
