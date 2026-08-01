-- CreateEnum
CREATE TYPE "UnitSystem" AS ENUM ('METRIC', 'IMPERIAL');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PRIVATE', 'FOLLOWERS', 'PUBLIC');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "bio" VARCHAR(300),
ADD COLUMN     "defaultRestSec" INTEGER NOT NULL DEFAULT 120,
ADD COLUMN     "defaultVisibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'fr',
ADD COLUMN     "onboardedAt" TIMESTAMP(3),
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Europe/Paris',
ADD COLUMN     "unitSystem" "UnitSystem" NOT NULL DEFAULT 'METRIC',
ADD COLUMN     "username" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

