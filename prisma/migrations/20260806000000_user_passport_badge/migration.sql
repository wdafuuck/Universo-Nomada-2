-- Insignias de pasaporte ganadas por miembros

CREATE TABLE IF NOT EXISTS "UserPassportBadge" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" INTEGER NOT NULL,
    "leadId" INTEGER,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserPassportBadge_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserPassportBadge_userId_badgeId_key"
  ON "UserPassportBadge"("userId", "badgeId");

CREATE INDEX IF NOT EXISTS "UserPassportBadge_userId_idx" ON "UserPassportBadge"("userId");
CREATE INDEX IF NOT EXISTS "UserPassportBadge_badgeId_idx" ON "UserPassportBadge"("badgeId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'UserPassportBadge_userId_fkey'
  ) THEN
    ALTER TABLE "UserPassportBadge"
      ADD CONSTRAINT "UserPassportBadge_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'UserPassportBadge_badgeId_fkey'
  ) THEN
    ALTER TABLE "UserPassportBadge"
      ADD CONSTRAINT "UserPassportBadge_badgeId_fkey"
      FOREIGN KEY ("badgeId") REFERENCES "PassportBadge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
