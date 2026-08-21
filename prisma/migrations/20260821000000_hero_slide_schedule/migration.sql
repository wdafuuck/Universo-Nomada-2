-- Programación de banners del hero
ALTER TABLE "HeroSlide" ADD COLUMN IF NOT EXISTS "startsAt" TIMESTAMP(3);
ALTER TABLE "HeroSlide" ADD COLUMN IF NOT EXISTS "endsAt" TIMESTAMP(3);
