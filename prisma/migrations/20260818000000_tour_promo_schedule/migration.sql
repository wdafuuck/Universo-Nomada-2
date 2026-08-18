-- Programación de ofertas (inicio / término)
ALTER TABLE "Tour" ADD COLUMN IF NOT EXISTS "promoStartsAt" TIMESTAMP(3);
ALTER TABLE "Tour" ADD COLUMN IF NOT EXISTS "promoEndsAt" TIMESTAMP(3);
