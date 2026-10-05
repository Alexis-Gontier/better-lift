-- AlterTable
ALTER TABLE "Seance" ADD COLUMN     "note" VARCHAR(1000);

-- CreateTable
CREATE TABLE "Preferences" (
    "userId" TEXT NOT NULL,
    "objectifHebdo" INTEGER,
    "reposDefautSec" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Preferences_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "Preferences" ADD CONSTRAINT "Preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
