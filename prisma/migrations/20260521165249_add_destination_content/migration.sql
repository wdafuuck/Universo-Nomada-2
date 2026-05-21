-- AlterTable
ALTER TABLE "Destination" ADD COLUMN     "highlights" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "includes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "notIncludes" TEXT[] DEFAULT ARRAY[]::TEXT[];
